-- =====================================================================
-- SIGH — 02_catalogos.sql — Datos fijos que el sistema necesita para operar
-- Nivel: FÍSICO (PostgreSQL 18.6)
-- Requiere: 01_ddl.sql
--
-- Ejecución:
--     psql -U postgres -d sigh -f 02_catalogos.sql
--
-- Contenido: 33 franjas, 4 tipos de contrato, 4 parámetros, 4 roles,
-- recursos y el usuario técnico de los scripts.
-- Docentes, espacios, cursos, períodos y secciones NO van aquí:
-- son datos de prueba (06_datos_prueba.sql, Ángel).
-- Todo va en una transacción: o entra el catálogo completo o nada.
-- =====================================================================

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------
-- FRANJA — opción A (Requisitos 4.5; RF-07; RN-06 a RN-08)
-- 6 franjas de lunes a viernes y 3 el sábado = 33.
-- id_franja = (dia_semana - 1) * 6 + número de bloque del día.
-- dia_semana: 1 = lunes ... 6 = sábado (decisión F5).
-- La hora de fin no se guarda: es hora_inicio + 2 h (vista en 04).
-- Si una fila violara la ventana o la zona muerta, los CHECK de 01 la
-- rechazarían: el catálogo no puede quedar mal cargado.
-- ---------------------------------------------------------------------
INSERT INTO franja (id_franja, dia_semana, hora_inicio) VALUES
    -- Lunes
    ( 1, 1, '07:00'), ( 2, 1, '09:00'), ( 3, 1, '13:00'),
    ( 4, 1, '15:00'), ( 5, 1, '17:00'), ( 6, 1, '19:00'),
    -- Martes
    ( 7, 2, '07:00'), ( 8, 2, '09:00'), ( 9, 2, '13:00'),
    (10, 2, '15:00'), (11, 2, '17:00'), (12, 2, '19:00'),
    -- Miércoles
    (13, 3, '07:00'), (14, 3, '09:00'), (15, 3, '13:00'),
    (16, 3, '15:00'), (17, 3, '17:00'), (18, 3, '19:00'),
    -- Jueves
    (19, 4, '07:00'), (20, 4, '09:00'), (21, 4, '13:00'),
    (22, 4, '15:00'), (23, 4, '17:00'), (24, 4, '19:00'),
    -- Viernes
    (25, 5, '07:00'), (26, 5, '09:00'), (27, 5, '13:00'),
    (28, 5, '15:00'), (29, 5, '17:00'), (30, 5, '19:00'),
    -- Sábado
    (31, 6, '07:00'), (32, 6, '09:00'), (33, 6, '11:00');

-- ---------------------------------------------------------------------
-- TIPO_CONTRATO — P-07 (horas máximas, resolución 9) y P-08
-- horas_max: 16, 12, 8 y 4 (decisión propia del proyecto, S-08). Las usa
-- RN-05 en 03.
-- horas_min: (propuesto) la mitad del máximo. Ningún documento fija estos
-- valores; solo los usa el reporte de RN-22 (regla blanda). Confirmar.
-- ---------------------------------------------------------------------
INSERT INTO tipo_contrato (nombre, horas_min, horas_max) VALUES
    ('TIEMPO COMPLETO', 8, 16),
    ('TRES CUARTOS',    6, 12),
    ('MEDIO TIEMPO',    4,  8),
    ('CUARTO DE TIEMPO',2,  4);

-- ---------------------------------------------------------------------
-- PARAMETRO_SISTEMA — P-01 a P-04 (resolución 7, RNF-07)
-- Los triggers de 03 leen estos valores por clave; cambiar la regla es
-- un UPDATE aquí, no un cambio de código.
-- ---------------------------------------------------------------------
INSERT INTO parametro_sistema (clave, valor, descripcion) VALUES
    ('CUPO_ESTANDAR',     40,   'P-01: cupo de una sección que no se supera sin justificación (RN-10)'),
    ('TOLERANCIA',        0.10, 'P-02: fracción sobre el cupo estándar; 40 x 1,10 = 44 (RN-10)'),
    ('CUPO_MINIMO',       10,   'P-03: matrícula por debajo de la cual una sección queda en riesgo de cierre (RN-21)'),
    ('FRECUENCIA_MAXIMA', 4,    'P-04: máximo de sesiones semanales de un curso (RN-09)');

-- ---------------------------------------------------------------------
-- ROL — 4 roles genéricos (S-14, resolución 11)
-- Son las filas de la tabla ROL (perfil del usuario en la aplicación).
-- Los roles de PostgreSQL con sus permisos se crean en 05.
-- ---------------------------------------------------------------------
INSERT INTO rol (nombre) VALUES
    ('ADMINISTRADOR'),
    ('COORDINADOR'),
    ('APROBADOR'),
    ('DOCENTE');

-- ---------------------------------------------------------------------
-- RECURSO — RD-05, RF-04, decisión 5 (el mobiliario es un recurso)
-- Proyector, computadores y sillas móviles vienen del Reto.
-- Los nombres exactos y el software son (propuesto). "Laboratorio" no
-- es recurso: es el tipo_espacio de ESPACIO.
-- ---------------------------------------------------------------------
INSERT INTO recurso (nombre, categoria) VALUES
    ('PROYECTOR',          'EQUIPO'),
    ('COMPUTADORES',       'EQUIPO'),
    ('SILLAS MOVILES',     'MOBILIARIO'),
    ('POSTGRESQL',         'SOFTWARE');   -- (propuesto) ejemplo de software

-- ---------------------------------------------------------------------
-- Usuario técnico — decisión F7
-- REGISTRAR (1,1) exige un responsable en cada fila de la bitácora,
-- también en los cambios hechos por script. Los scripts 06 y 07 fijan
--     SET app.id_usuario = <id de este usuario>;
-- La contraseña '!' no es un hash válido: nadie puede iniciar sesión
-- con este usuario desde la aplicación.
-- ---------------------------------------------------------------------
INSERT INTO usuario (nombre_usuario, contrasena, activo, id_rol)
SELECT 'sistema', '!', true, id_rol
FROM rol
WHERE nombre = 'ADMINISTRADOR';

COMMIT;

-- =====================================================================
-- Verificación (salida esperada: 33, 4, 4, 4, 4, 1)
-- =====================================================================
SELECT 'franja' AS tabla, count(*) AS filas FROM franja
UNION ALL SELECT 'tipo_contrato',     count(*) FROM tipo_contrato
UNION ALL SELECT 'parametro_sistema', count(*) FROM parametro_sistema
UNION ALL SELECT 'rol',               count(*) FROM rol
UNION ALL SELECT 'recurso',           count(*) FROM recurso
UNION ALL SELECT 'usuario',           count(*) FROM usuario;

-- Franjas por día (esperado: 6 de lunes a viernes, 3 el sábado)
SELECT dia_semana, count(*) AS franjas,
       min(hora_inicio) AS primera, max(hora_inicio) AS ultima
FROM franja
GROUP BY dia_semana
ORDER BY dia_semana;
