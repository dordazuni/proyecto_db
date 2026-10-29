-- =====================================================================
-- SIGH — 04_vistas.sql — Atributos derivados, horarios y reportes
-- Nivel: FÍSICO (PostgreSQL 18.6)
-- Requiere: 01, 02 y 03
--
-- Ejecución:
--     psql -U postgres -d sigh -f 04_vistas.sql
--
-- Por qué vistas (decisión L9): un atributo derivado se calcula cada vez
-- que se consulta, así nunca queda desactualizado ni rompe 3FN.
--   hora_fin            = hora_inicio + 2 h          (fase 4, H-1)
--   horas_semanales     = 2 x frecuencia_semanal     (CURSO)
--   carga_asignada      = 2 x sesiones del docente   (DOCENTE)
--   estado de la sesión = estado de su versión       (decisión C7)
--
-- Vistas:
--   v_franja                        hora_fin y nombre del día     RF-07
--   v_curso                         horas_semanales               RF-05
--   v_horario                       horario por docente, espacio
--                                   y sección (filtrar con WHERE) RF-19
--   v_carga_docente                 carga vs. horas del contrato  RF-20, RN-05, RN-22
--   v_secciones_riesgo_cierre       matrícula real < cupo mínimo  RF-21, RN-21
--   v_secciones_sesiones_faltantes  menos sesiones que frecuencia RF-22, RN-09
--   v_sesiones_dias_consecutivos    sesiones en días seguidos     RF-22, RN-20
--
-- Las tres últimas son reportes de reglas blandas: avisan, no bloquean.
-- =====================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------
-- v_franja — hora_fin derivado (fase 4, opción A)
-- Sustentación: "hora_fin dependía solo de hora_inicio y rompía 3FN;
-- ahora se calcula aquí y nunca puede contradecir a hora_inicio".
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_franja AS
SELECT f.id_franja,
       f.dia_semana,
       CASE f.dia_semana
            WHEN 1 THEN 'LUNES'     WHEN 2 THEN 'MARTES'
            WHEN 3 THEN 'MIERCOLES' WHEN 4 THEN 'JUEVES'
            WHEN 5 THEN 'VIERNES'   WHEN 6 THEN 'SABADO'
       END                                   AS nombre_dia,
       f.hora_inicio,
       (f.hora_inicio + interval '2 hours')::time AS hora_fin
FROM franja f;

-- ---------------------------------------------------------------------
-- v_curso — horas_semanales derivado
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_curso AS
SELECT c.id_curso,
       c.codigo,
       c.nombre,
       c.frecuencia_semanal,
       c.frecuencia_semanal * 2 AS horas_semanales
FROM curso c;

-- ---------------------------------------------------------------------
-- v_horario — una fila por sesión, con todos los datos legibles (RF-19)
-- Sirve para las tres consultas del requisito:
--   por docente:  SELECT * FROM v_horario WHERE id_version = 1 AND id_docente = 3;
--   por espacio:  ... AND id_espacio = 2;
--   por sección:  ... AND id_seccion = 7;
-- estado_version es el "estado de la asignación" del MER: derivado de
-- su versión, no se guarda en ASIGNACION (decisión C7).
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_horario AS
SELECT a.id_asignacion,
       v.id_version,
       v.numero_version,
       v.estado                AS estado_version,
       p.id_periodo,
       p.codigo                AS periodo,
       s.id_seccion,
       c.codigo                AS codigo_curso,
       c.nombre                AS nombre_curso,
       s.numero                AS numero_seccion,
       d.id_docente,
       d.nombres || ' ' || d.apellidos AS docente,
       e.id_espacio,
       e.codigo                AS codigo_espacio,
       e.tipo_espacio,
       f.id_franja,
       f.dia_semana,
       f.nombre_dia,
       f.hora_inicio,
       f.hora_fin
FROM asignacion a
JOIN version_horario   v ON v.id_version = a.id_version
JOIN periodo_academico p ON p.id_periodo = v.id_periodo
JOIN seccion           s ON s.id_seccion = a.id_seccion
JOIN curso             c ON c.id_curso   = s.id_curso
JOIN docente           d ON d.id_docente = a.id_docente
JOIN espacio           e ON e.id_espacio = a.id_espacio
JOIN v_franja          f ON f.id_franja  = a.id_franja;

-- ---------------------------------------------------------------------
-- v_carga_docente — carga_asignada derivado (RF-20)
-- Una fila por docente activo y versión, también con 0 sesiones.
-- estado_carga: SOBRE_MAXIMO no debería aparecer nunca (RN-05 lo impide
-- en 03); BAJO_MINIMO es el aviso de la regla blanda RN-22.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_carga_docente AS
SELECT v.id_version,
       v.id_periodo,
       d.id_docente,
       d.nombres || ' ' || d.apellidos AS docente,
       tc.nombre                       AS tipo_contrato,
       count(a.id_asignacion)          AS sesiones,
       count(a.id_asignacion) * 2      AS carga_asignada,
       tc.horas_min,
       tc.horas_max,
       CASE
           WHEN count(a.id_asignacion) * 2 > tc.horas_max THEN 'SOBRE_MAXIMO'
           WHEN count(a.id_asignacion) * 2 < tc.horas_min THEN 'BAJO_MINIMO'
           ELSE 'EN_RANGO'
       END                             AS estado_carga
FROM version_horario v
CROSS JOIN docente d
JOIN tipo_contrato tc ON tc.id_tipo_contrato = d.id_tipo_contrato
LEFT JOIN asignacion a ON a.id_version = v.id_version
                      AND a.id_docente = d.id_docente
WHERE d.estado_vinculacion = 'ACTIVO'
GROUP BY v.id_version, v.id_periodo, d.id_docente, d.nombres, d.apellidos,
         tc.nombre, tc.horas_min, tc.horas_max;

-- ---------------------------------------------------------------------
-- v_secciones_riesgo_cierre — RN-21, regla blanda (RF-21)
-- Sección abierta cuya matrícula real ya cargada es menor que su cupo
-- mínimo. El cierre lo decide el Coordinador (estado = 'CERRADA').
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_secciones_riesgo_cierre AS
SELECT s.id_seccion,
       p.codigo        AS periodo,
       c.codigo        AS codigo_curso,
       c.nombre        AS nombre_curso,
       s.numero        AS numero_seccion,
       s.matricula_real,
       s.cupo_min
FROM seccion s
JOIN curso c             ON c.id_curso   = s.id_curso
JOIN periodo_academico p ON p.id_periodo = s.id_periodo
WHERE s.estado = 'ABIERTA'
  AND s.matricula_real IS NOT NULL
  AND s.matricula_real < s.cupo_min;

-- ---------------------------------------------------------------------
-- v_secciones_sesiones_faltantes — RN-09 (RF-22)
-- Por cada versión, las secciones abiertas de su período con menos
-- sesiones que la frecuencia de su curso. RN-09 impide pasarse (03);
-- esta vista muestra lo que falta para completar el horario.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_secciones_sesiones_faltantes AS
SELECT v.id_version,
       s.id_seccion,
       c.codigo                              AS codigo_curso,
       s.numero                              AS numero_seccion,
       c.frecuencia_semanal,
       count(a.id_asignacion)                AS sesiones_asignadas,
       c.frecuencia_semanal - count(a.id_asignacion) AS sesiones_faltantes
FROM version_horario v
JOIN seccion s ON s.id_periodo = v.id_periodo
JOIN curso   c ON c.id_curso   = s.id_curso
LEFT JOIN asignacion a ON a.id_version = v.id_version
                      AND a.id_seccion = s.id_seccion
WHERE s.estado = 'ABIERTA'
GROUP BY v.id_version, s.id_seccion, c.codigo, s.numero, c.frecuencia_semanal
HAVING count(a.id_asignacion) < c.frecuencia_semanal;

-- ---------------------------------------------------------------------
-- v_sesiones_dias_consecutivos — RN-20, regla blanda (RF-22)
-- Secciones de cursos con 2 o 3 sesiones semanales que tienen dos
-- sesiones en días seguidos. dia_semana es número (decisión F5), así que
-- "consecutivo" es una resta: f2.dia - f1.dia = 1.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sesiones_dias_consecutivos AS
SELECT a1.id_version,
       a1.id_seccion,
       c.codigo        AS codigo_curso,
       s.numero        AS numero_seccion,
       f1.nombre_dia   AS dia_1,
       f2.nombre_dia   AS dia_2
FROM asignacion a1
JOIN asignacion a2 ON a2.id_version = a1.id_version
                  AND a2.id_seccion = a1.id_seccion
JOIN v_franja f1   ON f1.id_franja  = a1.id_franja
JOIN v_franja f2   ON f2.id_franja  = a2.id_franja
JOIN seccion  s    ON s.id_seccion  = a1.id_seccion
JOIN curso    c    ON c.id_curso    = s.id_curso
WHERE c.frecuencia_semanal IN (2, 3)
  AND f2.dia_semana - f1.dia_semana = 1;

-- =====================================================================
-- Verificación: deben aparecer 7 vistas; v_franja debe dar 33 filas con
-- hora_fin = hora_inicio + 2 h.
-- =====================================================================
SELECT table_name AS vista
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT id_franja, nombre_dia, hora_inicio, hora_fin
FROM v_franja
WHERE id_franja IN (1, 3, 6, 31, 33)
ORDER BY id_franja;
