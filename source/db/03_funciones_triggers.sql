-- =====================================================================
-- SIGH — 03_funciones_triggers.sql — Reglas que comparan tablas o leen
-- parámetros (diccionario 7.19, decisiones F1 y F9)
-- Nivel: FÍSICO (PostgreSQL 18.6, PL/pgSQL)
-- Requiere: 01_ddl.sql y 02_catalogos.sql
--
-- Ejecución:
--     psql -U postgres -d sigh -f 03_funciones_triggers.sql
--
-- Por qué triggers y solo estos (decisión F9): un CHECK solo ve su propia
-- fila y no puede leer otra tabla. Todo lo que la estructura podía
-- garantizar ya está en 01 (RN-01 a RN-03, RN-06 a RN-08, parte de RN-10,
-- RN-11 y RN-17). Aquí queda solo lo que exige consultar otra tabla.
--
-- Inventario:
--   Funciones auxiliares (no son triggers)
--     usuario_actual()  quién hace el cambio (app.id_usuario)  RF-24
--     parametro(clave)  lee PARAMETRO_SISTEMA                  RNF-07
--   Funciones de trigger y sus 6 triggers
--     fn_validar_asignacion  -> trg_asignacion_validar  RN-04, 05, 09, 11-16
--     fn_auditar             -> trg_asignacion_auditar  RF-24, RN-18
--                            -> trg_version_auditar     RF-24, RN-18
--     fn_validar_version     -> trg_version_validar     RN-17
--     fn_validar_seccion     -> trg_seccion_validar     RN-10
--     fn_validar_curso       -> trg_curso_validar       RN-09
--
-- Cada rechazo usa RAISE EXCEPTION con un mensaje que empieza por el
-- código de la regla (RNF-10). El backend lo traduce a HTTP 409/422.
--
-- SECURITY DEFINER: las funciones de trigger corren con los permisos de
-- su dueño, no del usuario de la aplicación. Así pueden escribir en la
-- bitácora y bloquear filas de DOCENTE aunque los roles de la aplicación
-- no tengan esos permisos (05). Se fija search_path para que nadie pueda
-- suplantar una tabla con otra del mismo nombre.
-- =====================================================================

\set ON_ERROR_STOP on

-- =====================================================================
-- 1. Funciones auxiliares
-- =====================================================================

-- usuario_actual — RF-24, decisión F7
-- La aplicación se conecta con un solo rol de PostgreSQL por perfil, así
-- que la base no sabe qué persona hace el cambio. Antes de cada escritura,
-- en la misma transacción, la API ejecuta
--     SELECT set_config('app.id_usuario', '<id_usuario>', true);
-- y esta función lo lee. Los scripts usan el usuario técnico 'sistema'.
CREATE OR REPLACE FUNCTION usuario_actual()
RETURNS integer
LANGUAGE plpgsql STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id     integer;
    v_activo boolean;
BEGIN
    v_id := NULLIF(current_setting('app.id_usuario', true), '')::integer;
    IF v_id IS NULL THEN
        RAISE EXCEPTION 'RF-24: falta identificar al usuario (app.id_usuario) antes de modificar el horario';
    END IF;

    SELECT activo INTO v_activo FROM usuario WHERE id_usuario = v_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'RF-24: el usuario % no existe', v_id;
    END IF;
    IF NOT v_activo THEN
        RAISE EXCEPTION 'RF-23: el usuario % está inactivo y no puede operar', v_id;
    END IF;
    RETURN v_id;
END;
$$;

-- parametro — RNF-07, resolución 7
-- Las reglas leen el valor vigente; cambiarlo es un UPDATE, no código.
CREATE OR REPLACE FUNCTION parametro(p_clave varchar)
RETURNS numeric
LANGUAGE plpgsql STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valor numeric;
BEGIN
    SELECT valor INTO v_valor FROM parametro_sistema WHERE clave = p_clave;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'RNF-07: falta el parámetro % en parametro_sistema', p_clave;
    END IF;
    RETURN v_valor;
END;
$$;

-- =====================================================================
-- 2. ASIGNACION — validación de la sesión
-- =====================================================================
-- Sustentación: "Antes de guardar, crear o borrar una sesión, la base
-- revisa en orden las reglas que necesitan mirar otras tablas; si una
-- falla, la operación se cancela completa y el mensaje dice qué regla
-- se violó".
-- Las reglas de una sola tabla (RN-01 a RN-03 con UNIQUE, RN-06 a RN-08
-- con la FK a FRANJA) ya las hace cumplir 01 y no se repiten aquí.
CREATE OR REPLACE FUNCTION fn_validar_asignacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_estado      varchar;
    v_periodo     integer;
    r_sec         record;
    v_capacidad   smallint;
    v_horas_max   smallint;
    v_sesiones    integer;
BEGIN
    -- RN-16 sobre la fila existente: no se modifica ni se borra una
    -- sesión de una versión que no esté EN_EDICION.
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT estado INTO v_estado
        FROM version_horario WHERE id_version = OLD.id_version;
        IF v_estado <> 'EN_EDICION' THEN
            RAISE EXCEPTION 'RN-16: la versión % está %; sus asignaciones no se modifican ni se borran',
                OLD.id_version, v_estado;
        END IF;
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
    END IF;

    -- RF-24: el creador y la fecha los pone la base, no la aplicación.
    IF TG_OP = 'INSERT' THEN
        NEW.id_usuario_creador := usuario_actual();
        NEW.fecha_creacion     := now();
    ELSE
        NEW.id_usuario_creador := OLD.id_usuario_creador;
        NEW.fecha_creacion     := OLD.fecha_creacion;
    END IF;

    -- Datos de la versión. Si no existe, se deja que la FK dé el error.
    SELECT estado, id_periodo INTO v_estado, v_periodo
    FROM version_horario WHERE id_version = NEW.id_version;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- RN-16: solo se crean sesiones en una versión EN_EDICION.
    IF v_estado <> 'EN_EDICION' THEN
        RAISE EXCEPTION 'RN-16: la versión % está %; no recibe asignaciones',
            NEW.id_version, v_estado;
    END IF;

    -- Datos de la sección y su curso. FOR UPDATE bloquea la sección para
    -- que dos coordinadores no le sumen sesiones a la vez (RN-09).
    SELECT s.id_periodo, s.estado, s.id_curso,
           COALESCE(s.matricula_real, s.matricula_proyectada) AS matricula,
           c.frecuencia_semanal
    INTO r_sec
    FROM seccion s
    JOIN curso c ON c.id_curso = s.id_curso
    WHERE s.id_seccion = NEW.id_seccion
    FOR UPDATE OF s;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- RN-15: sección y versión del mismo período.
    IF r_sec.id_periodo <> v_periodo THEN
        RAISE EXCEPTION 'RN-15: la sección % y la versión % pertenecen a períodos distintos',
            NEW.id_seccion, NEW.id_version;
    END IF;

    -- RN-11: una sección cerrada no recibe asignaciones.
    IF r_sec.estado <> 'ABIERTA' THEN
        RAISE EXCEPTION 'RN-11: la sección % está cerrada', NEW.id_seccion;
    END IF;

    -- RN-12: el docente debe estar habilitado para el curso (IMPARTIR).
    IF NOT EXISTS (SELECT 1 FROM docente_curso
                   WHERE id_docente = NEW.id_docente
                     AND id_curso   = r_sec.id_curso) THEN
        RAISE EXCEPTION 'RN-12: el docente % no está habilitado para dictar el curso %',
            NEW.id_docente, r_sec.id_curso;
    END IF;

    -- RN-13: el docente no marcó la franja como NO_DISPONIBLE en el
    -- período. Sin fila de disponibilidad, la franja es disponible (S-04).
    IF EXISTS (SELECT 1 FROM disponibilidad
               WHERE id_docente = NEW.id_docente
                 AND id_periodo = v_periodo
                 AND id_franja  = NEW.id_franja
                 AND tipo       = 'NO_DISPONIBLE') THEN
        RAISE EXCEPTION 'RN-13: el docente % no está disponible en la franja %',
            NEW.id_docente, NEW.id_franja;
    END IF;

    -- RN-04: matrícula de referencia (real o, si no hay, proyectada; S-11)
    -- no supera la capacidad del espacio.
    SELECT capacidad INTO v_capacidad
    FROM espacio WHERE id_espacio = NEW.id_espacio;
    IF FOUND AND r_sec.matricula > v_capacidad THEN
        RAISE EXCEPTION 'RN-04: la matrícula de la sección (%) supera la capacidad del espacio % (%)',
            r_sec.matricula, NEW.id_espacio, v_capacidad;
    END IF;

    -- RN-14: el espacio ofrece todos los recursos que requiere el curso.
    -- Es una división relacional: no debe existir un recurso del curso
    -- que el espacio no ofrezca (doble NOT EXISTS).
    IF EXISTS (SELECT 1 FROM curso_recurso cr
               WHERE cr.id_curso = r_sec.id_curso
                 AND NOT EXISTS (SELECT 1 FROM espacio_recurso er
                                 WHERE er.id_espacio = NEW.id_espacio
                                   AND er.id_recurso = cr.id_recurso)) THEN
        RAISE EXCEPTION 'RN-14: el espacio % no ofrece todos los recursos que requiere el curso %',
            NEW.id_espacio, r_sec.id_curso;
    END IF;

    -- RN-09: la sección no recibe en la versión más sesiones que la
    -- frecuencia de su curso. Se cuentan las otras sesiones (sin esta).
    SELECT count(*) INTO v_sesiones
    FROM asignacion
    WHERE id_version = NEW.id_version
      AND id_seccion = NEW.id_seccion
      AND id_asignacion <> NEW.id_asignacion;
    IF v_sesiones + 1 > r_sec.frecuencia_semanal THEN
        RAISE EXCEPTION 'RN-09: la sección % ya tiene % sesiones y su curso tiene frecuencia %',
            NEW.id_seccion, v_sesiones, r_sec.frecuencia_semanal;
    END IF;

    -- RN-05 y RNF-08: horas de clase del docente en la versión (2 h por
    -- sesión) <= horas máximas de su contrato. FOR UPDATE bloquea la fila
    -- del docente: si dos coordinadores le asignan sesiones a la vez, la
    -- segunda transacción espera a la primera y cuenta su sesión.
    SELECT tc.horas_max INTO v_horas_max
    FROM docente d
    JOIN tipo_contrato tc ON tc.id_tipo_contrato = d.id_tipo_contrato
    WHERE d.id_docente = NEW.id_docente
    FOR UPDATE OF d;
    IF FOUND THEN
        SELECT count(*) INTO v_sesiones
        FROM asignacion
        WHERE id_version = NEW.id_version
          AND id_docente = NEW.id_docente
          AND id_asignacion <> NEW.id_asignacion;
        IF (v_sesiones + 1) * 2 > v_horas_max THEN
            RAISE EXCEPTION 'RN-05: el docente % pasaría a % horas y su contrato permite %',
                NEW.id_docente, (v_sesiones + 1) * 2, v_horas_max;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_asignacion_validar
    BEFORE INSERT OR UPDATE OR DELETE ON asignacion
    FOR EACH ROW EXECUTE FUNCTION fn_validar_asignacion();

-- =====================================================================
-- 3. Auditoría — ASIGNACION y VERSION_HORARIO
-- =====================================================================
-- Sustentación: "Después de cada cambio, la base escribe sola en la
-- bitácora quién, cuándo, qué operación, en qué tabla y la fila antes y
-- después. La aplicación no puede saltarse este paso ni escribir en la
-- bitácora por su cuenta".
-- Es AFTER: solo se registra lo que de verdad quedó guardado.
CREATE OR REPLACE FUNCTION fn_auditar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO log_auditoria (id_usuario, accion, tabla_afectada, detalle)
    VALUES (usuario_actual(),
            TG_OP,
            TG_TABLE_NAME,
            jsonb_build_object('antes',   to_jsonb(OLD),    -- NULL en INSERT
                               'despues', to_jsonb(NEW)));  -- NULL en DELETE
    RETURN NULL;   -- en un trigger AFTER el valor de retorno se ignora
END;
$$;

CREATE OR REPLACE TRIGGER trg_asignacion_auditar
    AFTER INSERT OR UPDATE OR DELETE ON asignacion
    FOR EACH ROW EXECUTE FUNCTION fn_auditar();

-- RF-24 pide registrar también cada cambio de estado de una versión.
CREATE OR REPLACE TRIGGER trg_version_auditar
    AFTER INSERT OR UPDATE OR DELETE ON version_horario
    FOR EACH ROW EXECUTE FUNCTION fn_auditar();

-- =====================================================================
-- 4. VERSION_HORARIO — flujo de estados (RN-17)
-- =====================================================================
-- Sustentación: "La versión solo avanza por los caminos permitidos y
-- solo un Aprobador la avala o la devuelve; al avalarla, la base anota
-- quién y cuándo. Una versión avalada queda congelada".
-- Flujo permitido:
--   EN_EDICION -> PENDIENTE      (enviar a aprobación, RF-15)
--   PENDIENTE  -> AVALADO        (solo APROBADOR, RF-16)
--   PENDIENTE  -> EN_EDICION     (solo APROBADOR, devolución, RF-16)
--   AVALADO    -> SINCRONIZADO   (con id_documento_externo, RF-17)
-- Que AVALADO tenga avalador y fecha, y que SINCRONIZADO tenga el
-- identificador documental, lo garantizan los CHECK de 01 (F8).
CREATE OR REPLACE FUNCTION fn_validar_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rol varchar;
BEGIN
    -- Toda versión nace EN_EDICION.
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado <> 'EN_EDICION' THEN
            RAISE EXCEPTION 'RN-17: una versión nueva debe crearse EN_EDICION, no %', NEW.estado;
        END IF;
        RETURN NEW;
    END IF;

    -- UPDATE sin cambio de estado: solo se permite en EN_EDICION.
    IF NEW.estado = OLD.estado THEN
        IF OLD.estado <> 'EN_EDICION' AND NEW IS DISTINCT FROM OLD THEN
            RAISE EXCEPTION 'RN-17: la versión % está % y no se modifica', OLD.id_version, OLD.estado;
        END IF;
        RETURN NEW;
    END IF;

    -- Cambio de estado: período y número no cambian nunca en una transición.
    IF NEW.id_periodo <> OLD.id_periodo OR NEW.numero_version <> OLD.numero_version THEN
        RAISE EXCEPTION 'RN-17: al cambiar de estado no se cambian el período ni el número de la versión';
    END IF;

    IF NOT ((OLD.estado = 'EN_EDICION' AND NEW.estado = 'PENDIENTE')
         OR (OLD.estado = 'PENDIENTE'  AND NEW.estado = 'AVALADO')
         OR (OLD.estado = 'PENDIENTE'  AND NEW.estado = 'EN_EDICION')
         OR (OLD.estado = 'AVALADO'    AND NEW.estado = 'SINCRONIZADO')) THEN
        RAISE EXCEPTION 'RN-17: no se permite pasar de % a %', OLD.estado, NEW.estado;
    END IF;

    -- Avalar o devolver exige rol APROBADOR.
    IF OLD.estado = 'PENDIENTE' THEN
        SELECT r.nombre INTO v_rol
        FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = usuario_actual();
        IF v_rol <> 'APROBADOR' THEN
            RAISE EXCEPTION 'RN-17: solo un usuario con rol APROBADOR avala o devuelve una versión (rol actual: %)', v_rol;
        END IF;
    END IF;

    IF NEW.estado = 'AVALADO' THEN
        -- La base anota quién y cuándo; la aplicación no los envía.
        NEW.id_usuario_aval := usuario_actual();
        NEW.fecha_aval      := now();
    ELSIF NEW.estado = 'SINCRONIZADO' THEN
        -- El aval queda como estaba: solo se agrega el identificador.
        NEW.id_usuario_aval := OLD.id_usuario_aval;
        NEW.fecha_aval      := OLD.fecha_aval;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_version_validar
    BEFORE INSERT OR UPDATE ON version_horario
    FOR EACH ROW EXECUTE FUNCTION fn_validar_version();

-- =====================================================================
-- 5. SECCION — topes de cupo con parámetros (RN-10)
-- =====================================================================
-- Sustentación: "El cupo máximo no puede pasar del estándar más la
-- tolerancia, y si supera el estándar exige justificación. Los valores
-- (40 y 10 %) se leen de PARAMETRO_SISTEMA, por eso no caben en un CHECK".
-- Que solo el Coordinador registre la justificación se controla con un
-- GRANT por columna en 05, no aquí.
CREATE OR REPLACE FUNCTION fn_validar_seccion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_estandar numeric := parametro('CUPO_ESTANDAR');
    v_tope     numeric := floor(parametro('CUPO_ESTANDAR') * (1 + parametro('TOLERANCIA')));
BEGIN
    -- Si no se envía cupo_min, toma el parámetro P-03 (diccionario 7.8).
    IF NEW.cupo_min IS NULL THEN
        NEW.cupo_min := parametro('CUPO_MINIMO');
    END IF;

    IF NEW.cupo_max > v_tope THEN
        RAISE EXCEPTION 'RN-10: el cupo máximo % supera el estándar más la tolerancia (%)',
            NEW.cupo_max, v_tope;
    END IF;

    IF NEW.cupo_max > v_estandar
       AND COALESCE(btrim(NEW.justificacion_sobrecupo), '') = '' THEN
        RAISE EXCEPTION 'RN-10: un cupo máximo de % supera el estándar (%) y exige justificación',
            NEW.cupo_max, v_estandar;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_seccion_validar
    BEFORE INSERT OR UPDATE ON seccion
    FOR EACH ROW EXECUTE FUNCTION fn_validar_seccion();

-- =====================================================================
-- 6. CURSO — tope de frecuencia con parámetro (RN-09)
-- =====================================================================
-- Sustentación: "La frecuencia semanal no puede pasar del máximo
-- configurado (4). El piso (>= 1) ya es un CHECK en 01".
CREATE OR REPLACE FUNCTION fn_validar_curso()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_max numeric := parametro('FRECUENCIA_MAXIMA');
BEGIN
    IF NEW.frecuencia_semanal > v_max THEN
        RAISE EXCEPTION 'RN-09: la frecuencia semanal % supera la máxima permitida (%)',
            NEW.frecuencia_semanal, v_max;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_curso_validar
    BEFORE INSERT OR UPDATE ON curso
    FOR EACH ROW EXECUTE FUNCTION fn_validar_curso();

-- =====================================================================
-- Verificación: deben aparecer 6 triggers.
-- =====================================================================
SELECT event_object_table AS tabla,
       trigger_name,
       action_timing      AS momento,
       string_agg(event_manipulation, ', ' ORDER BY event_manipulation) AS eventos
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table, trigger_name, action_timing
ORDER BY tabla, trigger_name;
