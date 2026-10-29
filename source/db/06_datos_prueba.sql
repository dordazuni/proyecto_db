-- =====================================================================
-- SIGH — 06_datos_prueba.sql — Datos de prueba para demostrar el sistema
-- Nivel: FÍSICO (PostgreSQL 18.6)
-- Requiere: 01 a 05 recién ejecutados (base limpia)
--
-- Ejecución:
--     psql -U postgres -d sigh -f 06_datos_prueba.sql
--
-- Todos los datos son ficticios (personas, correos, códigos y espacios
-- inventados) y genéricos: no corresponden a ninguna institución.
--
-- Escenario:
--   * Período 2026-2 (ACTIVO): versión 1 ya avalada y sincronizada.
--     Sirve de historia y para probar RN-15, RN-16 y RN-17.
--   * Período 2027-1 (PLANEACION): versión 1 EN_EDICION con un horario
--     casi completo. Es la que se edita en la demostración.
--
-- Casos límite que deja cargados (hoja de ruta):
--   * CAL1-1: cupo 44 con justificación (tope exacto de RN-10).
--   * PROG1-1: matrícula 25 en un laboratorio de capacidad 25 (RN-04 exacto).
--   * Andrés Torres: 4 h de 4 h (en el máximo de su contrato, RN-05).
--   * Jorge Pérez: 6 h de 8 h (a 2 h de su máximo, prueba de RNF-08).
-- Y alimenta los reportes de 04:
--   * ETI-1: matrícula real 8 < cupo mínimo 10   -> v_secciones_riesgo_cierre
--   * PROG1-2 y ALG-2 incompletas                  -> v_secciones_sesiones_faltantes
--   * ALG-1 lunes y martes                         -> v_sesiones_dias_consecutivos
--   * Sofía Díaz con 2 h (mínimo 4)                -> v_carga_docente (BAJO_MINIMO)
--
-- Se carga como superusuario: DOCENTE, ESPACIO y USUARIO no los puede
-- escribir la aplicación (RN-19, S-03). Todo va en una transacción.
-- Si se ejecuta dos veces, las UNIQUE lo rechazan y no queda nada a
-- medias; para recargar se ejecutan de nuevo los scripts 01 a 06.
-- =====================================================================

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------
-- Funciones de ayuda TEMPORALES (pg_temp): existen solo mientras corre
-- este script y no quedan en la base. Permiten escribir cada sesión con
-- claves naturales (código de curso, correo, código de espacio, día y
-- hora) en vez de ids numéricos.
-- ---------------------------------------------------------------------
CREATE FUNCTION pg_temp.usar_usuario(p_nombre varchar)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    -- RF-24: los triggers registran a este usuario como responsable.
    PERFORM set_config('app.id_usuario',
        (SELECT id_usuario::text FROM usuario WHERE nombre_usuario = p_nombre), false);
END;
$$;

CREATE FUNCTION pg_temp.asignar(p_periodo varchar, p_version integer,
                                p_curso varchar, p_seccion integer,
                                p_email varchar, p_espacio varchar,
                                p_dia integer, p_hora time)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_version integer; v_seccion integer; v_docente integer;
    v_espacio integer; v_franja smallint;
BEGIN
    SELECT v.id_version INTO STRICT v_version
    FROM version_horario v JOIN periodo_academico p USING (id_periodo)
    WHERE p.codigo = p_periodo AND v.numero_version = p_version;

    SELECT s.id_seccion INTO STRICT v_seccion
    FROM seccion s
    JOIN curso c USING (id_curso)
    JOIN periodo_academico p USING (id_periodo)
    WHERE p.codigo = p_periodo AND c.codigo = p_curso AND s.numero = p_seccion;

    SELECT id_docente INTO STRICT v_docente FROM docente WHERE email = p_email;
    SELECT id_espacio INTO STRICT v_espacio FROM espacio WHERE codigo = p_espacio;
    SELECT id_franja  INTO STRICT v_franja
    FROM franja WHERE dia_semana = p_dia AND hora_inicio = p_hora;

    -- El trigger de 03 valida todas las reglas: si un dato de prueba
    -- estuviera mal, este INSERT fallaría y el script se detendría.
    INSERT INTO asignacion (id_version, id_seccion, id_docente, id_espacio, id_franja)
    VALUES (v_version, v_seccion, v_docente, v_espacio, v_franja);
END;
$$;

-- =====================================================================
-- 1. Períodos (RF-01)
-- =====================================================================
INSERT INTO periodo_academico (codigo, fecha_inicio, fecha_fin, estado) VALUES
    ('2026-2', '2026-07-20', '2026-12-05', 'ACTIVO'),
    ('2027-1', '2027-01-25', '2027-06-12', 'PLANEACION');

-- =====================================================================
-- 2. Espacios y sus recursos (RF-02, RF-04) — carga del sistema fuente
-- =====================================================================
INSERT INTO espacio (codigo, nombre, capacidad, edificio, tipo_espacio) VALUES
    ('A-101', 'Aula 101',                     40, 'Bloque A', 'AULA'),
    ('A-102', 'Aula 102',                     30, 'Bloque A', 'AULA'),
    ('A-201', 'Aula 201',                     45, 'Bloque A', 'AULA'),
    ('A-202', 'Aula 202',                     20, 'Bloque A', 'AULA'),
    ('LC-1',  'Laboratorio de cómputo 1',     35, 'Bloque B', 'LAB_COMPUTO'),
    ('LC-2',  'Laboratorio de cómputo 2',     25, 'Bloque B', 'LAB_COMPUTO'),
    ('LE-1',  'Laboratorio de física',        20, 'Bloque C', 'LAB_ESPECIALIZADO');

-- Subclases de la jerarquía (decisión A): solo los laboratorios.
INSERT INTO laboratorio_computo (id_espacio, numero_equipos)
SELECT id_espacio, CASE codigo WHEN 'LC-1' THEN 35 ELSE 25 END
FROM espacio WHERE tipo_espacio = 'LAB_COMPUTO';

INSERT INTO laboratorio_especializado (id_espacio, area)
SELECT id_espacio, 'FISICA' FROM espacio WHERE codigo = 'LE-1';

-- DOTAR: qué ofrece cada espacio. A-202 no tiene proyector a propósito.
INSERT INTO espacio_recurso (id_espacio, id_recurso, cantidad)
SELECT e.id_espacio, r.id_recurso, x.cantidad
FROM (VALUES
        ('A-101', 'PROYECTOR',       1),
        ('A-102', 'PROYECTOR',       1),
        ('A-201', 'PROYECTOR',       1),
        ('A-201', 'SILLAS MOVILES', 45),
        ('LC-1',  'PROYECTOR',       1),
        ('LC-1',  'COMPUTADORES',   35),
        ('LC-1',  'POSTGRESQL',     35),
        ('LC-2',  'PROYECTOR',       1),
        ('LC-2',  'COMPUTADORES',   25),
        ('LE-1',  'PROYECTOR',       1)
     ) AS x (espacio, recurso, cantidad)
JOIN espacio e ON e.codigo = x.espacio
JOIN recurso r ON r.nombre = x.recurso;

-- =====================================================================
-- 3. Docentes (RF-03) — carga del sistema fuente
-- =====================================================================
INSERT INTO docente (tipo_documento, numero_documento, nombres, apellidos,
                     email, estado_vinculacion, id_tipo_contrato)
SELECT 'CC', x.doc, x.nombres, x.apellidos, x.email, x.estado, tc.id_tipo_contrato
FROM (VALUES
        ('1001', 'Ana',    'Rojas',   'ana.rojas@ejemplo.edu',     'ACTIVO',   'TIEMPO COMPLETO'),
        ('1002', 'Carlos', 'Méndez',  'carlos.mendez@ejemplo.edu', 'ACTIVO',   'TIEMPO COMPLETO'),
        ('1003', 'Laura',  'Gómez',   'laura.gomez@ejemplo.edu',   'ACTIVO',   'TRES CUARTOS'),
        ('1004', 'Jorge',  'Pérez',   'jorge.perez@ejemplo.edu',   'ACTIVO',   'MEDIO TIEMPO'),
        ('1005', 'Sofía',  'Díaz',    'sofia.diaz@ejemplo.edu',    'ACTIVO',   'MEDIO TIEMPO'),
        ('1006', 'Andrés', 'Torres',  'andres.torres@ejemplo.edu', 'ACTIVO',   'CUARTO DE TIEMPO'),
        ('1007', 'Paula',  'Castro',  'paula.castro@ejemplo.edu',  'ACTIVO',   'TIEMPO COMPLETO'),
        ('1008', 'Miguel', 'Vargas',  'miguel.vargas@ejemplo.edu', 'INACTIVO', 'MEDIO TIEMPO')
     ) AS x (doc, nombres, apellidos, email, estado, contrato)
JOIN tipo_contrato tc ON tc.nombre = x.contrato;

-- =====================================================================
-- 4. Usuarios de la aplicación (RF-23), uno por rol, más tres docentes
--    vinculados (VINCULAR 1:1) para probar la seguridad por fila.
-- La contraseña es un marcador: el backend genera y guarda el hash real
-- (RNF-04). Nadie puede entrar con este valor.
-- =====================================================================
INSERT INTO usuario (nombre_usuario, contrasena, id_rol, id_docente)
SELECT x.usuario, 'HASH_PENDIENTE_BACKEND', r.id_rol, d.id_docente
FROM (VALUES
        ('admin',         'ADMINISTRADOR', NULL),
        ('coordinador',   'COORDINADOR',   NULL),
        ('aprobador',     'APROBADOR',     NULL),
        ('ana.rojas',     'DOCENTE',       'ana.rojas@ejemplo.edu'),
        ('carlos.mendez', 'DOCENTE',       'carlos.mendez@ejemplo.edu'),
        ('andres.torres', 'DOCENTE',       'andres.torres@ejemplo.edu')
     ) AS x (usuario, rol, email)
JOIN rol r          ON r.nombre = x.rol
LEFT JOIN docente d ON d.email  = x.email;

-- =====================================================================
-- 5. Cursos, recursos que requieren y docentes habilitados
-- =====================================================================
-- Códigos y nombres genéricos. La frecuencia no pasa de 4 (RN-09).
INSERT INTO curso (codigo, nombre, frecuencia_semanal) VALUES
    ('BD1',   'Bases de Datos 1',      2),
    ('PROG1', 'Programación 1',        2),
    ('CAL1',  'Cálculo Diferencial',   3),
    ('FIS1',  'Física 1',              2),
    ('ALG',   'Álgebra Lineal',        2),
    ('ETI',   'Ética Profesional',     1),
    ('SEM',   'Seminario de Proyecto', 1);

-- REQUERIR (RN-14). BD1 es el único que exige software instalado.
INSERT INTO curso_recurso (id_curso, id_recurso)
SELECT c.id_curso, r.id_recurso
FROM (VALUES
        ('BD1',   'COMPUTADORES'),
        ('BD1',   'POSTGRESQL'),
        ('PROG1', 'COMPUTADORES'),
        ('CAL1',  'PROYECTOR'),
        ('FIS1',  'PROYECTOR'),
        ('ALG',   'PROYECTOR'),
        ('SEM',   'SILLAS MOVILES')
     ) AS x (curso, recurso)
JOIN curso c   ON c.codigo = x.curso
JOIN recurso r ON r.nombre = x.recurso;

-- IMPARTIR (RN-12)
INSERT INTO docente_curso (id_docente, id_curso)
SELECT d.id_docente, c.id_curso
FROM (VALUES
        ('ana.rojas@ejemplo.edu',     'BD1'),
        ('ana.rojas@ejemplo.edu',     'PROG1'),
        ('carlos.mendez@ejemplo.edu', 'CAL1'),
        ('carlos.mendez@ejemplo.edu', 'ALG'),
        ('laura.gomez@ejemplo.edu',   'FIS1'),
        ('laura.gomez@ejemplo.edu',   'CAL1'),
        ('jorge.perez@ejemplo.edu',   'PROG1'),
        ('jorge.perez@ejemplo.edu',   'BD1'),
        ('sofia.diaz@ejemplo.edu',    'ETI'),
        ('sofia.diaz@ejemplo.edu',    'SEM'),
        ('andres.torres@ejemplo.edu', 'ALG'),
        ('paula.castro@ejemplo.edu',  'CAL1'),
        ('paula.castro@ejemplo.edu',  'FIS1'),
        ('miguel.vargas@ejemplo.edu', 'ETI')
     ) AS x (email, curso)
JOIN docente d ON d.email  = x.email
JOIN curso c   ON c.codigo = x.curso;

-- =====================================================================
-- 6. Secciones (RF-09, RF-10). cupo_min se omite: toma el parámetro (10).
-- =====================================================================
INSERT INTO seccion (id_curso, id_periodo, numero, cupo_max,
                     matricula_proyectada, matricula_real,
                     justificacion_sobrecupo, estado)
SELECT c.id_curso, p.id_periodo, x.numero, x.cupo_max, x.proyectada, x.real_,
       x.justificacion, x.estado
FROM (VALUES
        -- período 2026-2 (historia)
        ('2026-2', 'BD1',   1, 40, 30, 32,   NULL, 'ABIERTA'),
        ('2026-2', 'CAL1',  1, 40, 35, 36,   NULL, 'ABIERTA'),
        -- período 2027-1 (en planeación)
        ('2027-1', 'BD1',   1, 35, 28, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'BD1',   2, 30, 22, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'PROG1', 1, 30, 25, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'PROG1', 2, 25, 20, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'CAL1',  1, 44, 42, NULL,
            'Demanda histórica superior al cupo estándar; aula de 45 puestos disponible', 'ABIERTA'),
        ('2027-1', 'CAL1',  2, 40, 30, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'FIS1',  1, 40, 35, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'ALG',   1, 40, 38, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'ALG',   2, 40, 30, NULL, NULL, 'ABIERTA'),
        ('2027-1', 'ETI',   1, 40, 30,    8, NULL, 'ABIERTA'),
        ('2027-1', 'SEM',   1, 30, 12, NULL, NULL, 'CERRADA')
     ) AS x (periodo, curso, numero, cupo_max, proyectada, real_, justificacion, estado)
JOIN curso c             ON c.codigo = x.curso
JOIN periodo_academico p ON p.codigo = x.periodo;

-- =====================================================================
-- 7. Disponibilidad 2027-1 (RF-11). Sin fila = disponible (S-04).
-- =====================================================================
INSERT INTO disponibilidad (id_docente, id_periodo, id_franja, tipo)
SELECT d.id_docente, p.id_periodo, f.id_franja, 'NO_DISPONIBLE'
FROM (VALUES
        ('ana.rojas@ejemplo.edu',     1, '07:00'::time),   -- lunes temprano
        ('ana.rojas@ejemplo.edu',     6, '07:00'),         -- sábados
        ('ana.rojas@ejemplo.edu',     6, '09:00'),
        ('ana.rojas@ejemplo.edu',     6, '11:00'),
        ('carlos.mendez@ejemplo.edu', 5, '19:00'),         -- viernes noche
        ('andres.torres@ejemplo.edu', 1, '07:00'),         -- no trabaja a las 7
        ('andres.torres@ejemplo.edu', 2, '07:00'),
        ('andres.torres@ejemplo.edu', 3, '07:00'),
        ('andres.torres@ejemplo.edu', 4, '07:00'),
        ('andres.torres@ejemplo.edu', 5, '07:00')
     ) AS x (email, dia, hora)
JOIN docente d           ON d.email = x.email
JOIN franja f            ON f.dia_semana = x.dia AND f.hora_inicio = x.hora
JOIN periodo_academico p ON p.codigo = '2027-1';

-- Las llamadas a las funciones de ayuda no imprimen nada útil: se
-- oculta su salida hasta el COMMIT.
\o /dev/null

-- =====================================================================
-- 8. Período 2026-2: versión 1 completa, avalada y sincronizada
--    (RF-12 a RF-17). Cada paso lo hace el usuario del rol que le toca;
--    la bitácora queda con quién hizo qué.
-- =====================================================================
SELECT pg_temp.usar_usuario('coordinador');

INSERT INTO version_horario (id_periodo, numero_version)
SELECT id_periodo, 1 FROM periodo_academico WHERE codigo = '2026-2';

--                    período  ver curso  sec docente                      espacio día hora
SELECT pg_temp.asignar('2026-2', 1, 'BD1',  1, 'ana.rojas@ejemplo.edu',     'LC-1',  1, '09:00');
SELECT pg_temp.asignar('2026-2', 1, 'BD1',  1, 'ana.rojas@ejemplo.edu',     'LC-1',  3, '09:00');
SELECT pg_temp.asignar('2026-2', 1, 'CAL1', 1, 'carlos.mendez@ejemplo.edu', 'A-201', 1, '07:00');
SELECT pg_temp.asignar('2026-2', 1, 'CAL1', 1, 'carlos.mendez@ejemplo.edu', 'A-201', 3, '07:00');
SELECT pg_temp.asignar('2026-2', 1, 'CAL1', 1, 'carlos.mendez@ejemplo.edu', 'A-201', 5, '07:00');

-- Coordinador envía a aprobación (RF-15)
UPDATE version_horario SET estado = 'PENDIENTE'
WHERE id_periodo = (SELECT id_periodo FROM periodo_academico WHERE codigo = '2026-2')
  AND numero_version = 1;

-- Aprobador avala (RF-16): la base anota quién y cuándo
SELECT pg_temp.usar_usuario('aprobador');
UPDATE version_horario SET estado = 'AVALADO'
WHERE id_periodo = (SELECT id_periodo FROM periodo_academico WHERE codigo = '2026-2')
  AND numero_version = 1;

-- Administrador sincroniza con el sistema documental (RF-17)
SELECT pg_temp.usar_usuario('admin');
UPDATE version_horario
SET estado = 'SINCRONIZADO', id_documento_externo = 'DOC-2026-2-0001'
WHERE id_periodo = (SELECT id_periodo FROM periodo_academico WHERE codigo = '2026-2')
  AND numero_version = 1;

-- =====================================================================
-- 9. Período 2027-1: versión 1 EN_EDICION (la de la demostración)
-- =====================================================================
SELECT pg_temp.usar_usuario('coordinador');

INSERT INTO version_horario (id_periodo, numero_version)
SELECT id_periodo, 1 FROM periodo_academico WHERE codigo = '2027-1';

-- Bases de Datos 1: requiere computadores y PostgreSQL -> solo LC-1
SELECT pg_temp.asignar('2027-1', 1, 'BD1',   1, 'ana.rojas@ejemplo.edu',     'LC-1',  1, '09:00');
SELECT pg_temp.asignar('2027-1', 1, 'BD1',   1, 'ana.rojas@ejemplo.edu',     'LC-1',  3, '09:00');
SELECT pg_temp.asignar('2027-1', 1, 'BD1',   2, 'jorge.perez@ejemplo.edu',   'LC-1',  2, '13:00');
SELECT pg_temp.asignar('2027-1', 1, 'BD1',   2, 'jorge.perez@ejemplo.edu',   'LC-1',  4, '13:00');
-- Programación 1: PROG1-1 con 25 estudiantes en LC-2 de 25 puestos (capacidad exacta)
SELECT pg_temp.asignar('2027-1', 1, 'PROG1', 1, 'ana.rojas@ejemplo.edu',     'LC-2',  2, '07:00');
SELECT pg_temp.asignar('2027-1', 1, 'PROG1', 1, 'ana.rojas@ejemplo.edu',     'LC-2',  4, '07:00');
-- PROG1-2 queda con 1 de 2 sesiones (aparece en sesiones faltantes);
-- Jorge queda en 6 h de 8 h (a 2 h de su máximo)
SELECT pg_temp.asignar('2027-1', 1, 'PROG1', 2, 'jorge.perez@ejemplo.edu',   'LC-2',  3, '15:00');
-- Cálculo: CAL1-1 con cupo 44 justificado, 42 estudiantes en A-201 (45)
SELECT pg_temp.asignar('2027-1', 1, 'CAL1',  1, 'carlos.mendez@ejemplo.edu', 'A-201', 1, '07:00');
SELECT pg_temp.asignar('2027-1', 1, 'CAL1',  1, 'carlos.mendez@ejemplo.edu', 'A-201', 3, '07:00');
SELECT pg_temp.asignar('2027-1', 1, 'CAL1',  1, 'carlos.mendez@ejemplo.edu', 'A-201', 5, '07:00');
SELECT pg_temp.asignar('2027-1', 1, 'CAL1',  2, 'paula.castro@ejemplo.edu',  'A-101', 1, '13:00');
SELECT pg_temp.asignar('2027-1', 1, 'CAL1',  2, 'paula.castro@ejemplo.edu',  'A-101', 3, '13:00');
SELECT pg_temp.asignar('2027-1', 1, 'CAL1',  2, 'paula.castro@ejemplo.edu',  'A-101', 5, '13:00');
-- Física 1
SELECT pg_temp.asignar('2027-1', 1, 'FIS1',  1, 'laura.gomez@ejemplo.edu',   'A-101', 2, '09:00');
SELECT pg_temp.asignar('2027-1', 1, 'FIS1',  1, 'laura.gomez@ejemplo.edu',   'A-101', 4, '09:00');
-- Álgebra: lunes y martes seguidos (aviso de RN-20); Andrés queda en 4 h de 4 h.
-- ALG-2 queda sin sesiones (aparece en sesiones faltantes).
SELECT pg_temp.asignar('2027-1', 1, 'ALG',   1, 'andres.torres@ejemplo.edu', 'A-101', 1, '15:00');
SELECT pg_temp.asignar('2027-1', 1, 'ALG',   1, 'andres.torres@ejemplo.edu', 'A-101', 2, '15:00');
-- Ética: sin recursos requeridos; matrícula real 8 (riesgo de cierre)
SELECT pg_temp.asignar('2027-1', 1, 'ETI',   1, 'sofia.diaz@ejemplo.edu',    'A-102', 5, '17:00');

COMMIT;
\o

-- =====================================================================
-- Verificación
-- =====================================================================
-- Filas por tabla (esperado: 2 períodos, 7 espacios, 8 docentes,
-- 7 usuarios, 7 cursos, 13 secciones, 10 disponibilidades,
-- 2 versiones, 23 asignaciones y una bitácora con todo lo anterior).
SELECT 'periodo_academico' AS tabla, count(*) AS filas FROM periodo_academico
UNION ALL SELECT 'espacio',         count(*) FROM espacio
UNION ALL SELECT 'docente',         count(*) FROM docente
UNION ALL SELECT 'usuario',         count(*) FROM usuario
UNION ALL SELECT 'curso',           count(*) FROM curso
UNION ALL SELECT 'seccion',         count(*) FROM seccion
UNION ALL SELECT 'disponibilidad',  count(*) FROM disponibilidad
UNION ALL SELECT 'version_horario', count(*) FROM version_horario
UNION ALL SELECT 'asignacion',      count(*) FROM asignacion
UNION ALL SELECT 'log_auditoria',   count(*) FROM log_auditoria;

-- Estado de las versiones
SELECT p.codigo AS periodo, v.numero_version, v.estado,
       u.nombre_usuario AS avalada_por, v.id_documento_externo
FROM version_horario v
JOIN periodo_academico p USING (id_periodo)
LEFT JOIN usuario u ON u.id_usuario = v.id_usuario_aval
ORDER BY p.codigo;

-- Carga de cada docente en la versión que se está editando
SELECT docente, tipo_contrato, carga_asignada, horas_min, horas_max, estado_carga
FROM v_carga_docente
WHERE id_periodo = (SELECT id_periodo FROM periodo_academico WHERE codigo = '2027-1')
ORDER BY carga_asignada DESC, docente;
