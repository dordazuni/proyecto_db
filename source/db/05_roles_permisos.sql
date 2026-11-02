-- =====================================================================
-- SIGH — 05_roles_permisos.sql — Roles, permisos y seguridad por fila
-- Nivel: FÍSICO (PostgreSQL 18.6)
-- Requiere: 01 a 04
--
-- Ejecución (la contraseña de los usuarios de conexión NO va en el
-- repositorio; se pasa al ejecutar, RNF-04):
--     psql -U postgres -d sigh -v app_password='<contraseña>' -f 05_roles_permisos.sql
--
-- Tres capas:
--   1. sigh_owner: dueño de todos los objetos. La aplicación nunca lo usa
--      (mitiga el límite de que el dueño puede borrar triggers).
--   2. Cuatro roles de grupo, uno por rol genérico (S-14), con solo los
--      permisos que necesitan (RNF-04, RF-25):
--        rol_administrador, rol_coordinador, rol_aprobador, rol_docente
--   3. Cuatro usuarios de conexión (LOGIN), uno por grupo, que usa la API:
--        app_administrador, app_coordinador, app_aprobador, app_docente
--
-- Reglas que se cumplen aquí:
--   RN-18  bitácora de solo inserción: nadie tiene UPDATE/DELETE/TRUNCATE
--          (ni INSERT: solo escriben los triggers de 03)       RNF-06
--   RN-19  DOCENTE y ESPACIO de solo lectura para la aplicación; cada
--          docente ve y modifica solo su disponibilidad         RNF-05
--   RN-10  solo el Coordinador registra la justificación de sobrecupo
--   F4     ningún rol borra historia (sin DELETE salvo donde se indica)
-- =====================================================================

\set ON_ERROR_STOP on

\if :{?app_password}
\else
    \echo 'Falta la contraseña: psql ... -v app_password=''<contraseña>'' -f 05_roles_permisos.sql'
    \quit
\endif

-- Los roles son del servidor, no de la base: si el script se repite sobre
-- un servidor donde ya existen, se reutilizan.
DO $$
DECLARE
    r text;
BEGIN
    FOREACH r IN ARRAY ARRAY['sigh_owner', 'rol_administrador', 'rol_coordinador',
                             'rol_aprobador', 'rol_docente'] LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('CREATE ROLE %I NOLOGIN', r);
        END IF;
    END LOOP;
    FOREACH r IN ARRAY ARRAY['app_administrador', 'app_coordinador',
                             'app_aprobador', 'app_docente'] LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('CREATE ROLE %I LOGIN', r);
        END IF;
    END LOOP;
END;
$$;

-- Contraseñas de conexión (se guardan cifradas por PostgreSQL).
ALTER ROLE app_administrador PASSWORD :'app_password';
ALTER ROLE app_coordinador   PASSWORD :'app_password';
ALTER ROLE app_aprobador     PASSWORD :'app_password';
ALTER ROLE app_docente       PASSWORD :'app_password';

GRANT rol_administrador TO app_administrador;
GRANT rol_coordinador   TO app_coordinador;
GRANT rol_aprobador     TO app_aprobador;
GRANT rol_docente       TO app_docente;

BEGIN;

-- =====================================================================
-- 1. Dueño de los objetos: sigh_owner (no es superusuario)
-- =====================================================================
-- Las funciones SECURITY DEFINER de 03 pasan a correr como sigh_owner y
-- no como el superusuario: si alguien encontrara una forma de abusar de
-- ellas, solo tendría los permisos del dueño del esquema.
DO $$
DECLARE
    o record;
BEGIN
    FOR o IN SELECT c.relname, c.relkind
             FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v') LOOP
        IF o.relkind = 'r' THEN
            EXECUTE format('ALTER TABLE %I OWNER TO sigh_owner', o.relname);
        ELSE
            EXECUTE format('ALTER VIEW %I OWNER TO sigh_owner', o.relname);
        END IF;
    END LOOP;
    FOR o IN SELECT p.oid::regprocedure AS firma
             FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' LOOP
        EXECUTE format('ALTER FUNCTION %s OWNER TO sigh_owner', o.firma);
    END LOOP;
END;
$$;

-- =====================================================================
-- 2. Puerta de entrada: base, esquema y funciones
-- =====================================================================
REVOKE ALL ON DATABASE sigh FROM PUBLIC;
GRANT CONNECT ON DATABASE sigh
    TO rol_administrador, rol_coordinador, rol_aprobador, rol_docente;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
-- El dueño necesita el esquema: con sus permisos corren las funciones
-- SECURITY DEFINER de 03 y las comprobaciones de las FK.
GRANT USAGE, CREATE ON SCHEMA public TO sigh_owner;
GRANT USAGE ON SCHEMA public
    TO rol_administrador, rol_coordinador, rol_aprobador, rol_docente;

-- Nadie ejecuta funciones salvo las que se conceden abajo. Los triggers
-- se disparan igual: no dependen de este permiso.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Los id son IDENTITY: insertar necesita usar su secuencia.
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public
    TO rol_administrador, rol_coordinador, rol_aprobador, rol_docente;

-- =====================================================================
-- 3. Administrador — catálogos, parámetros, usuarios y sincronización
-- =====================================================================
-- Consulta todo menos DISPONIBILIDAD (dato personal, RNF-05).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_administrador;  -- incluye las vistas
REVOKE SELECT ON disponibilidad FROM rol_administrador;

-- CU-01: períodos, franjas, recursos y parámetros (RF-01, RF-04, RF-07, RF-08)
GRANT INSERT, UPDATE ON periodo_academico, franja, recurso TO rol_administrador;
GRANT INSERT, UPDATE, DELETE ON espacio_recurso TO rol_administrador;
GRANT UPDATE (valor, descripcion) ON parametro_sistema TO rol_administrador;

-- CU-02: usuarios (RF-23). No cambia el catálogo de roles.
GRANT INSERT, UPDATE ON usuario TO rol_administrador;

-- CU-03: Ingesta desde sistemas fuente (Talento Humano e Infraestructura) (RN-19)
GRANT INSERT ON docente, espacio TO rol_administrador;
GRANT INSERT ON laboratorio_computo, laboratorio_especializado TO rol_administrador;

-- CU-03: matrícula real desde los sistemas fuente (RF-10). Solo esa
-- columna: no puede tocar cupos ni la justificación (RN-10).
GRANT UPDATE (matricula_real) ON seccion TO rol_administrador;

-- CU-04: sincronización documental (RF-17). El trigger de 03 solo le deja
-- pasar de AVALADO a SINCRONIZADO; avalar exige rol APROBADOR.
GRANT UPDATE (estado, id_documento_externo) ON version_horario TO rol_administrador;

-- =====================================================================
-- 4. Coordinador académico — cursos, secciones y programación
-- =====================================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_coordinador;  -- tablas y vistas
-- DISPONIBILIDAD: solo lectura, filtrada por la política de la sección 7.

-- CU-05: cursos, recursos requeridos y habilitaciones (RF-05, RF-06)
GRANT INSERT, UPDATE ON curso TO rol_coordinador;
GRANT INSERT, DELETE ON curso_recurso, docente_curso TO rol_coordinador;

-- CU-06: secciones y cierres (RF-09, RF-10). Es el único rol que escribe
-- cupos y justificación de sobrecupo (RN-10, D4).
GRANT INSERT, UPDATE ON seccion TO rol_coordinador;

-- CU-07: versiones y asignaciones (RF-12 a RF-15). En VERSION_HORARIO solo
-- puede tocar el estado; el trigger de 03 le permite enviar a aprobación.
GRANT INSERT ON version_horario TO rol_coordinador;
GRANT UPDATE (estado) ON version_horario TO rol_coordinador;
GRANT INSERT, UPDATE, DELETE ON asignacion TO rol_coordinador;

-- =====================================================================
-- 5. Aprobador — avalar o devolver versiones (RF-16)
-- =====================================================================
GRANT SELECT ON version_horario, periodo_academico,
                v_horario, v_franja, v_curso, v_carga_docente,
                v_secciones_sesiones_faltantes, v_sesiones_dias_consecutivos
    TO rol_aprobador;
GRANT UPDATE (estado) ON version_horario TO rol_aprobador;

-- =====================================================================
-- 6. Docente — su horario y su disponibilidad (RF-11, RF-19)
-- =====================================================================
-- Solo vistas: no ve tablas con datos de otros docentes.
GRANT SELECT ON v_horario, v_franja, v_curso, periodo_academico TO rol_docente;
GRANT SELECT, INSERT, UPDATE, DELETE ON disponibilidad TO rol_docente;

-- =====================================================================
-- 7. Seguridad por fila en DISPONIBILIDAD (RN-19, RNF-05, Ley 1581)
-- =====================================================================
-- docente_actual(): el id_docente vinculado al usuario de app.id_usuario.
-- SECURITY DEFINER porque rol_docente no puede leer la tabla USUARIO.
CREATE OR REPLACE FUNCTION docente_actual()
RETURNS integer
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT id_docente FROM usuario WHERE id_usuario = usuario_actual();
$$;
ALTER FUNCTION docente_actual() OWNER TO sigh_owner;
GRANT EXECUTE ON FUNCTION docente_actual() TO rol_docente;

-- Sustentación: "La base filtra las filas antes de devolverlas: aunque el
-- docente escriba SELECT * FROM disponibilidad, solo ve las suyas, y no
-- puede insertar ni cambiar filas de otro docente".
ALTER TABLE disponibilidad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pol_disp_docente_propia ON disponibilidad;
CREATE POLICY pol_disp_docente_propia ON disponibilidad
    FOR ALL TO rol_docente
    USING      (id_docente = docente_actual())
    WITH CHECK (id_docente = docente_actual());

-- El Coordinador consulta la disponibilidad de todos para asignar.
DROP POLICY IF EXISTS pol_disp_coordinador_lectura ON disponibilidad;
CREATE POLICY pol_disp_coordinador_lectura ON disponibilidad
    FOR SELECT TO rol_coordinador
    USING (true);

-- =====================================================================
-- 8. Bitácora de solo inserción (RN-18, RNF-06)
-- =====================================================================
-- Ningún rol de la aplicación puede insertar, modificar, borrar ni vaciar
-- la bitácora. Solo la escriben los triggers de 03, que corren como
-- sigh_owner. Se revoca explícitamente para que quede documentado.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON log_auditoria
    FROM PUBLIC, rol_administrador, rol_coordinador, rol_aprobador, rol_docente;

-- DOCENTE, ESPACIO y sus subclases: solo lectura para la aplicación
-- (RN-19, S-03). Se cargan por script con sigh_owner.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
    ON docente, espacio, laboratorio_computo, laboratorio_especializado
    FROM PUBLIC, rol_administrador, rol_coordinador, rol_aprobador, rol_docente;

COMMIT;

-- =====================================================================
-- Verificación: permisos de escritura por rol (SELECT no se lista)
-- =====================================================================
SELECT grantee AS rol,
       table_name AS tabla,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS permisos
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee LIKE 'rol_%'
  AND privilege_type <> 'SELECT'
GROUP BY grantee, table_name
ORDER BY grantee, table_name;

SELECT grantee AS rol, table_name AS tabla,
       string_agg(column_name || ':' || privilege_type, ', ') AS columnas
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND grantee LIKE 'rol_%'
  AND privilege_type = 'UPDATE'
  AND (grantee, table_name) NOT IN (SELECT grantee, table_name
                                    FROM information_schema.table_privileges
                                    WHERE privilege_type = 'UPDATE')
GROUP BY grantee, table_name
ORDER BY 1, 2;
