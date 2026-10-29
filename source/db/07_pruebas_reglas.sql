-- =====================================================================
-- SIGH — 07_pruebas_reglas.sql — Evidencia de que la base hace cumplir
-- las reglas (RNF-01, RNF-10)
-- Nivel: FÍSICO (PostgreSQL 18.6)
-- Requiere: 01 a 06
--
-- Ejecución:
--     psql -U postgres -d sigh -f 07_pruebas_reglas.sql
--
-- Cómo funciona cada prueba (función temporal pg_temp.probar):
--   1. Toma el rol de la aplicación que haría la operación (SET ROLE),
--      porque el superusuario se salta permisos y seguridad por fila.
--   2. Fija app.id_usuario con el usuario de ese rol.
--   3. Ejecuta la operación y anota si la base la aceptó o con qué
--      mensaje la rechazó.
--   4. Deshace la operación SIEMPRE: el script no cambia ningún dato y
--      se puede ejecutar cuantas veces se quiera.
-- Al final imprime una tabla: regla, caso, resultado esperado, mensaje
-- obtenido y OK. Todas las filas deben decir OK = true.
-- =====================================================================

\set ON_ERROR_STOP on
SET client_min_messages = warning;

-- ---------------------------------------------------------------------
-- Funciones y tabla de apoyo TEMPORALES (desaparecen al terminar)
-- ---------------------------------------------------------------------
CREATE TEMP TABLE resultado (
    n         serial,
    regla     text,
    caso      text,
    rol       text,
    esperado  text,
    obtenido  text,
    ok        boolean
);

-- probar(regla, caso, rol, usuario, sql, esperado)
--   esperado = NULL   -> la operación debe ser ACEPTADA
--   esperado = 'xxx'  -> debe ser RECHAZADA con un mensaje que contenga 'xxx'
CREATE FUNCTION pg_temp.probar(p_regla text, p_caso text, p_rol text,
                               p_usuario text, p_sql text, p_esperado text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_obtenido text;
    v_id       text;
BEGIN
    -- El id se busca antes de cambiar de rol: el Aprobador y el Docente
    -- no tienen permiso para leer la tabla USUARIO.
    v_id := COALESCE((SELECT id_usuario::text FROM public.usuario
                      WHERE nombre_usuario = p_usuario), '');
    BEGIN
        EXECUTE format('SET LOCAL ROLE %I', p_rol);
        PERFORM set_config('app.id_usuario', v_id, true);
        EXECUTE p_sql;
        -- Si llega aquí, la base aceptó: se lanza un error propio para
        -- deshacer la operación de todas formas.
        RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'ACEPTADA';
    EXCEPTION WHEN OTHERS THEN
        -- Al salir por aquí se deshace todo lo de este bloque: la
        -- operación, el SET ROLE y app.id_usuario.
        v_obtenido := SQLERRM;
    END;

    INSERT INTO resultado (regla, caso, rol, esperado, obtenido, ok)
    VALUES (p_regla, p_caso, p_rol,
            COALESCE('rechazo: ' || p_esperado, 'ACEPTADA'),
            v_obtenido,
            CASE WHEN p_esperado IS NULL THEN v_obtenido = 'ACEPTADA'
                 ELSE v_obtenido ILIKE '%' || p_esperado || '%' END);
END;
$$;

-- sql_asignar: arma el INSERT de una sesión a partir de claves naturales.
-- Busca los ids ANTES de cambiar de rol y falla si un dato no existe,
-- para que una prueba nunca pase por un error de digitación.
CREATE FUNCTION pg_temp.sql_asignar(p_periodo_version text, p_curso text,
                                    p_seccion int, p_email text,
                                    p_espacio text, p_dia int, p_hora time,
                                    p_periodo_seccion text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v int; s int; d int; e int; f int;
BEGIN
    SELECT vh.id_version INTO STRICT v
    FROM version_horario vh JOIN periodo_academico p USING (id_periodo)
    WHERE p.codigo = p_periodo_version AND vh.numero_version = 1;

    SELECT se.id_seccion INTO STRICT s
    FROM seccion se JOIN curso c USING (id_curso) JOIN periodo_academico p USING (id_periodo)
    WHERE p.codigo = COALESCE(p_periodo_seccion, p_periodo_version)
      AND c.codigo = p_curso AND se.numero = p_seccion;

    SELECT id_docente INTO STRICT d FROM docente WHERE email = p_email;
    SELECT id_espacio INTO STRICT e FROM espacio WHERE codigo = p_espacio;
    SELECT id_franja  INTO STRICT f FROM franja  WHERE dia_semana = p_dia AND hora_inicio = p_hora;

    RETURN format('INSERT INTO asignacion (id_version, id_seccion, id_docente, id_espacio, id_franja) '
                  'VALUES (%s, %s, %s, %s, %s)', v, s, d, e, f);
END;
$$;

-- id de la versión 1 de un período
CREATE FUNCTION pg_temp.version(p_periodo text)
RETURNS int LANGUAGE sql AS $$
    SELECT vh.id_version FROM version_horario vh
    JOIN periodo_academico p USING (id_periodo)
    WHERE p.codigo = p_periodo AND vh.numero_version = 1;
$$;

\o /dev/null

-- =====================================================================
-- 0. Control: una sesión válida se acepta (las reglas no bloquean todo)
-- =====================================================================
SELECT pg_temp.probar('Control', 'Sesión válida: Ana dicta PROG1-2 en LC-2 el viernes 13:00',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'PROG1', 2, 'ana.rojas@ejemplo.edu', 'LC-2', 5, '13:00'),
    NULL);

SELECT pg_temp.probar('Control', 'Mover una sesión a otra franja libre',
    'app_coordinador', 'coordinador',
    format('UPDATE asignacion SET id_franja = (SELECT id_franja FROM franja WHERE dia_semana = 5 AND hora_inicio = ''15:00'') '
           'WHERE id_version = %s AND id_seccion = (SELECT id_seccion FROM seccion s JOIN curso c USING (id_curso) '
           'WHERE c.codigo = ''ETI'' AND s.numero = 1)', pg_temp.version('2027-1')),
    NULL);

-- =====================================================================
-- 1. Choques de horario: UNIQUE en ASIGNACION (RN-01 a RN-03)
-- =====================================================================
SELECT pg_temp.probar('RN-01', 'Ana ya dicta BD1-1 el lunes 09:00; se le asigna PROG1-2 a la misma hora',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'PROG1', 2, 'ana.rojas@ejemplo.edu', 'LC-2', 1, '09:00'),
    'uq_asig_rn01');

SELECT pg_temp.probar('RN-02', 'LC-1 ya está ocupado el lunes 09:00; se programa PROG1-2 ahí',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'PROG1', 2, 'jorge.perez@ejemplo.edu', 'LC-1', 1, '09:00'),
    'uq_asig_rn02');

SELECT pg_temp.probar('RN-03', 'PROG1-2 ya tiene sesión el miércoles 15:00; se le pone otra a la misma hora',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'PROG1', 2, 'ana.rojas@ejemplo.edu', 'LC-1', 3, '15:00'),
    'uq_asig_rn03');

-- =====================================================================
-- 2. Plantilla de franjas: CHECK en FRANJA (RN-06 a RN-08)
-- =====================================================================
SELECT pg_temp.probar('RN-06', 'Franja lunes 11:00-13:00 (cruza 12:00-13:00)',
    'app_administrador', 'admin',
    'INSERT INTO franja VALUES (90, 1, ''11:00'')', 'chk_franja_rn06');

SELECT pg_temp.probar('RN-07', 'Franja lunes 21:00-23:00 (pasa de las 22:00)',
    'app_administrador', 'admin',
    'INSERT INTO franja VALUES (91, 1, ''21:00'')', 'chk_franja_rn07');

SELECT pg_temp.probar('RN-07', 'Franja sábado 13:00 (el sábado termina a las 13:00)',
    'app_administrador', 'admin',
    'INSERT INTO franja VALUES (92, 6, ''13:00'')', 'chk_franja_rn07');

SELECT pg_temp.probar('RN-08', 'Franja lunes 07:30 (no empieza en hora en punto)',
    'app_administrador', 'admin',
    'INSERT INTO franja VALUES (93, 1, ''07:30'')', 'chk_franja_rn08');

-- =====================================================================
-- 3. Reglas de validar_asignacion (trigger de 03)
-- =====================================================================
SELECT pg_temp.probar('RN-04', 'CAL1-1 (42 estudiantes) en A-101 (capacidad 40)',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'CAL1', 1, 'carlos.mendez@ejemplo.edu', 'A-101', 2, '07:00'),
    'RN-04');

SELECT pg_temp.probar('RN-05', 'Andrés (4 h de 4 h) recibe una sesión más de ALG-2',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'ALG', 2, 'andres.torres@ejemplo.edu', 'A-102', 3, '15:00'),
    'RN-05');

SELECT pg_temp.probar('RN-09', 'BD1-1 ya tiene sus 2 sesiones; se le asigna una tercera',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'BD1', 1, 'ana.rojas@ejemplo.edu', 'LC-1', 5, '09:00'),
    'RN-09');

SELECT pg_temp.probar('RN-11', 'Asignar la sección SEM-1, que está CERRADA',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'SEM', 1, 'sofia.diaz@ejemplo.edu', 'A-201', 1, '17:00'),
    'RN-11');

SELECT pg_temp.probar('RN-12', 'Laura (Física y Cálculo) dicta BD1-2',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'BD1', 2, 'laura.gomez@ejemplo.edu', 'LC-1', 5, '15:00'),
    'RN-12');

SELECT pg_temp.probar('RN-13', 'Andrés marcó el lunes 07:00 como NO_DISPONIBLE',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'ALG', 2, 'andres.torres@ejemplo.edu', 'A-102', 1, '07:00'),
    'RN-13');

SELECT pg_temp.probar('RN-14', 'PROG1-2 (requiere computadores) en A-101, que no los tiene',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'PROG1', 2, 'jorge.perez@ejemplo.edu', 'A-101', 5, '17:00'),
    'RN-14');

SELECT pg_temp.probar('RN-15', 'Sección del período 2026-2 en la versión de 2027-1',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'BD1', 1, 'ana.rojas@ejemplo.edu', 'LC-1', 5, '09:00', '2026-2'),
    'RN-15');

SELECT pg_temp.probar('RN-16', 'Agregar una sesión a la versión de 2026-2, ya SINCRONIZADA',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2026-2', 'BD1', 1, 'ana.rojas@ejemplo.edu', 'LC-1', 5, '09:00'),
    'RN-16');

SELECT pg_temp.probar('RN-16', 'Borrar las sesiones de la versión ya SINCRONIZADA',
    'app_coordinador', 'coordinador',
    format('DELETE FROM asignacion WHERE id_version = %s', pg_temp.version('2026-2')),
    'RN-16');

-- =====================================================================
-- 4. Parámetros: triggers de CURSO y SECCION (RN-09, RN-10)
-- =====================================================================
SELECT pg_temp.probar('RN-09', 'Curso con 5 sesiones semanales (máximo 4)',
    'app_coordinador', 'coordinador',
    'INSERT INTO curso (codigo, nombre, frecuencia_semanal) VALUES (''TST'', ''Prueba'', 5)',
    'RN-09');

SELECT pg_temp.probar('RN-10', 'Sección con cupo 45 (tope 40 + 10 % = 44)',
    'app_coordinador', 'coordinador',
    'INSERT INTO seccion (id_curso, id_periodo, numero, cupo_max) '
    'SELECT c.id_curso, p.id_periodo, 9, 45 FROM curso c, periodo_academico p '
    'WHERE c.codigo = ''ETI'' AND p.codigo = ''2027-1''',
    'RN-10');

SELECT pg_temp.probar('RN-10', 'Sección con cupo 42 sin justificación',
    'app_coordinador', 'coordinador',
    'INSERT INTO seccion (id_curso, id_periodo, numero, cupo_max) '
    'SELECT c.id_curso, p.id_periodo, 9, 42 FROM curso c, periodo_academico p '
    'WHERE c.codigo = ''ETI'' AND p.codigo = ''2027-1''',
    'RN-10');

SELECT pg_temp.probar('RN-10', 'Caso límite: cupo 44 con justificación (se acepta)',
    'app_coordinador', 'coordinador',
    'INSERT INTO seccion (id_curso, id_periodo, numero, cupo_max, justificacion_sobrecupo) '
    'SELECT c.id_curso, p.id_periodo, 9, 44, ''Demanda alta'' FROM curso c, periodo_academico p '
    'WHERE c.codigo = ''ETI'' AND p.codigo = ''2027-1''',
    NULL);

SELECT pg_temp.probar('RN-10', 'El Administrador intenta escribir la justificación de sobrecupo',
    'app_administrador', 'admin',
    'UPDATE seccion SET justificacion_sobrecupo = ''x''', 'permission denied');

-- Se ejecuta como superusuario porque combina el paso del Administrador
-- (cambiar el parámetro) y el del Coordinador (crear la sección); lo que
-- se prueba es el parámetro, no el permiso.
SELECT pg_temp.probar('RNF-07', 'Subir CUPO_ESTANDAR a 50 permite un cupo de 50 sin cambiar código',
    'postgres', 'admin',
    'UPDATE parametro_sistema SET valor = 50 WHERE clave = ''CUPO_ESTANDAR''; '
    'INSERT INTO seccion (id_curso, id_periodo, numero, cupo_max) '
    'SELECT c.id_curso, p.id_periodo, 9, 50 FROM curso c, periodo_academico p '
    'WHERE c.codigo = ''ETI'' AND p.codigo = ''2027-1''',
    NULL);

-- =====================================================================
-- 5. Flujo de la versión (RN-17)
-- =====================================================================
SELECT pg_temp.probar('RN-17', 'Crear una versión directamente en estado PENDIENTE',
    'app_coordinador', 'coordinador',
    'INSERT INTO version_horario (id_periodo, numero_version, estado) '
    'SELECT id_periodo, 2, ''PENDIENTE'' FROM periodo_academico WHERE codigo = ''2027-1''',
    'RN-17');

SELECT pg_temp.probar('RN-17', 'Saltar de EN_EDICION a AVALADO',
    'app_aprobador', 'aprobador',
    format('UPDATE version_horario SET estado = ''AVALADO'' WHERE id_version = %s', pg_temp.version('2027-1')),
    'RN-17');

SELECT pg_temp.probar('RN-17', 'El Coordinador envía a aprobación y luego intenta avalar él mismo',
    'app_coordinador', 'coordinador',
    format('UPDATE version_horario SET estado = ''PENDIENTE'' WHERE id_version = %1$s; '
           'UPDATE version_horario SET estado = ''AVALADO''   WHERE id_version = %1$s',
           pg_temp.version('2027-1')),
    'solo un usuario con rol APROBADOR');

SELECT pg_temp.probar('RN-17', 'Flujo correcto: enviar a aprobación (Coordinador)',
    'app_coordinador', 'coordinador',
    format('UPDATE version_horario SET estado = ''PENDIENTE'' WHERE id_version = %s', pg_temp.version('2027-1')),
    NULL);

SELECT pg_temp.probar('RN-17', 'Modificar una versión ya SINCRONIZADA',
    'app_administrador', 'admin',
    format('UPDATE version_horario SET id_documento_externo = ''OTRO'' WHERE id_version = %s', pg_temp.version('2026-2')),
    'no se modifica');

-- =====================================================================
-- 6. Bitácora de solo inserción (RN-18, RNF-06)
-- =====================================================================
SELECT pg_temp.probar('RN-18', 'El Coordinador borra la bitácora',
    'app_coordinador', 'coordinador',
    'DELETE FROM log_auditoria', 'permission denied');

SELECT pg_temp.probar('RN-18', 'El Administrador vacía la bitácora',
    'app_administrador', 'admin',
    'TRUNCATE log_auditoria', 'permission denied');

SELECT pg_temp.probar('RN-18', 'El Coordinador escribe en la bitácora a mano',
    'app_coordinador', 'coordinador',
    'INSERT INTO log_auditoria (id_usuario, accion, tabla_afectada, detalle) VALUES (1, ''DELETE'', ''x'', ''{}'')',
    'permission denied');

SELECT pg_temp.probar('RF-24', 'Una sesión válida deja su fila en la bitácora con el usuario',
    'app_coordinador', 'coordinador',
    pg_temp.sql_asignar('2027-1', 'PROG1', 2, 'ana.rojas@ejemplo.edu', 'LC-2', 5, '13:00') || '; '
    || 'DO $t$ BEGIN IF NOT EXISTS (SELECT 1 FROM log_auditoria l JOIN usuario u USING (id_usuario) '
    || 'WHERE l.tabla_afectada = ''asignacion'' AND l.accion = ''INSERT'' AND u.nombre_usuario = ''coordinador'' '
    || 'AND l.fecha_hora = now()) THEN RAISE EXCEPTION ''sin registro''; END IF; END $t$',
    NULL);

SELECT pg_temp.probar('RF-24', 'Modificar el horario sin identificar al usuario',
    'app_coordinador', NULL,
    pg_temp.sql_asignar('2027-1', 'PROG1', 2, 'ana.rojas@ejemplo.edu', 'LC-2', 5, '13:00'),
    'RF-24');

-- =====================================================================
-- 7. Datos protegidos (RN-19, RNF-05)
-- =====================================================================
SELECT pg_temp.probar('RN-19', 'Ana consulta la disponibilidad: solo ve la suya',
    'app_docente', 'ana.rojas',
    'DO $t$ BEGIN IF EXISTS (SELECT 1 FROM disponibilidad WHERE id_docente <> docente_actual()) '
    'THEN RAISE EXCEPTION ''ve filas de otros docentes''; END IF; END $t$',
    NULL);

SELECT pg_temp.probar('RN-19', 'Ana registra su propia disponibilidad',
    'app_docente', 'ana.rojas',
    'INSERT INTO disponibilidad (id_docente, id_periodo, id_franja, tipo) '
    'SELECT docente_actual(), p.id_periodo, 30, ''NO_DISPONIBLE'' '
    'FROM periodo_academico p WHERE p.codigo = ''2027-1''',
    NULL);

SELECT pg_temp.probar('RN-19', 'Ana registra disponibilidad a nombre de Carlos',
    'app_docente', 'ana.rojas',
    format('INSERT INTO disponibilidad (id_docente, id_periodo, id_franja, tipo) VALUES (%s, %s, 30, ''NO_DISPONIBLE'')',
           (SELECT id_docente FROM docente WHERE email = 'carlos.mendez@ejemplo.edu'),
           (SELECT id_periodo FROM periodo_academico WHERE codigo = '2027-1')),
    'row-level security');

SELECT pg_temp.probar('RN-19', 'Un docente consulta la tabla DOCENTE (datos de otros)',
    'app_docente', 'ana.rojas',
    'SELECT * FROM docente', 'permission denied');

SELECT pg_temp.probar('RN-19', 'El Coordinador modifica los datos de un docente',
    'app_coordinador', 'coordinador',
    'UPDATE docente SET nombres = ''X''', 'permission denied');

SELECT pg_temp.probar('RN-19', 'El Administrador consulta la disponibilidad (dato personal)',
    'app_administrador', 'admin',
    'SELECT * FROM disponibilidad', 'permission denied');

\o

-- =====================================================================
-- Resultado
-- =====================================================================
SELECT n, regla, caso, esperado, obtenido, ok
FROM resultado
ORDER BY n;

SELECT count(*)                       AS pruebas,
       count(*) FILTER (WHERE ok)     AS correctas,
       count(*) FILTER (WHERE NOT ok) AS fallidas
FROM resultado;

-- =====================================================================
-- RNF-08 (concurrencia): prueba MANUAL, necesita dos ventanas de psql.
-- Jorge tiene 6 h de 8 h. Dos coordinadores le asignan 2 h a la vez:
--
--   Ventana 1:
--     BEGIN;
--     SET app.id_usuario = '<id de coordinador>';
--     INSERT INTO asignacion ... Jorge, PROG1-2, LC-2, viernes 15:00 ...;
--     -- (todavía no hacer COMMIT)
--   Ventana 2:
--     BEGIN;
--     SET app.id_usuario = '<id de coordinador>';
--     INSERT INTO asignacion ... Jorge, BD1-2 en otra franja ...;
--     -- queda ESPERANDO: el trigger bloqueó la fila de Jorge (FOR UPDATE)
--   Ventana 1:  COMMIT;
--   Ventana 2:  falla con "RN-05: el docente ... pasaría a 10 horas ..."
--
-- Sin el bloqueo, ambas contarían 6 h y Jorge quedaría con 10 h.
-- Al terminar, en la ventana 1 borrar la sesión de prueba.
-- =====================================================================
