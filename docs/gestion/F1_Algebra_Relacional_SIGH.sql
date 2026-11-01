-- =====================================================================
-- SIGH — Álgebra relacional: consultas SQL de los ejercicios
-- Base: sigh (PostgreSQL 18.6), cargada con los scripts 01 a 06.
-- Cada consulta corresponde a un ejercicio del documento
-- F1_Algebra_Relacional_SIGH.docx; el comentario indica la expresión
-- en álgebra y el número de filas esperado.
-- Autor: Ángel Daniel Aya Páez
-- =====================================================================

-- ---------------------------------------------------------------------
-- Bloque 1: Selección y proyección
-- ---------------------------------------------------------------------

-- Ejercicio 1. Franjas del sábado
-- Listar las franjas horarias del sábado.
-- Álgebra: σ dia_semana = 6 (FRANJA)
-- Resultado esperado: 3 filas
SELECT *
FROM franja
WHERE dia_semana = 6;

-- Ejercicio 2. Nombre y horas máximas de cada contrato
-- Listar el nombre de cada tipo de contrato con sus horas máximas de clase.
-- Álgebra: π nombre, horas_max (TIPO_CONTRATO)
-- Resultado esperado: 4 filas
SELECT DISTINCT nombre, horas_max
FROM tipo_contrato;

-- Ejercicio 3. Recursos de categoría EQUIPO
-- Listar el nombre de los recursos de categoría EQUIPO.
-- Álgebra: π nombre (σ categoria = 'EQUIPO' (RECURSO))
-- Resultado esperado: 2 filas
SELECT DISTINCT nombre
FROM recurso
WHERE categoria = 'EQUIPO';

-- Ejercicio 4. Franjas del lunes desde las 13:00
-- Listar las franjas del lunes que empiezan a las 13:00 o después.
-- Álgebra: σ dia_semana = 1 ∧ hora_inicio ≥ '13:00' (FRANJA)
-- Resultado esperado: 4 filas
SELECT *
FROM franja
WHERE dia_semana = 1
  AND hora_inicio >= '13:00';

-- Ejercicio 5. Franjas del sábado o nocturnas
-- Listar las franjas del sábado o las que empiezan a las 19:00.
-- Álgebra: σ dia_semana = 6 ∨ hora_inicio = '19:00' (FRANJA)
-- Resultado esperado: 8 filas
SELECT *
FROM franja
WHERE dia_semana = 6
   OR hora_inicio = '19:00';

-- Ejercicio 6. Recursos que no son EQUIPO
-- Listar los recursos que no son de categoría EQUIPO.
-- Álgebra: σ categoria ≠ 'EQUIPO' (RECURSO)  ≡  σ ¬(categoria = 'EQUIPO') (RECURSO)
-- Resultado esperado: 2 filas
SELECT *
FROM recurso
WHERE categoria <> 'EQUIPO';

-- Ejercicio 7. Espacios con capacidad de 35 o más
-- Listar el código, el nombre y la capacidad de los espacios con capacidad para 35 personas o más.
-- Álgebra: π codigo, nombre, capacidad (σ capacidad ≥ 35 (ESPACIO))
-- Resultado esperado: 3 filas
SELECT DISTINCT codigo, nombre, capacidad
FROM espacio
WHERE capacidad >= 35;

-- Ejercicio 8. Secciones con matrícula proyectada entre 30 y 40
-- Listar las secciones con matrícula proyectada entre 30 y 40 estudiantes, ambos incluidos.
-- Álgebra: π id_seccion, numero, matricula_proyectada (σ matricula_proyectada ≥ 30 ∧ matricula_proyectada ≤ 40 (SECCION))
-- Resultado esperado: 7 filas
SELECT DISTINCT id_seccion, numero, matricula_proyectada
FROM seccion
WHERE matricula_proyectada >= 30
  AND matricula_proyectada <= 40;

-- Ejercicio 9. Tipos de espacio
-- Listar los tipos de espacio que existen.
-- Álgebra: π tipo_espacio (ESPACIO)
-- Resultado esperado: 3 filas
SELECT DISTINCT tipo_espacio
FROM espacio;

-- Ejercicio 10. Secciones cerradas o en riesgo de cierre
-- Listar las secciones cerradas o cuya matrícula real es menor que su cupo mínimo.
-- Álgebra: π id_seccion, numero, estado, matricula_real, cupo_min (σ estado = 'CERRADA' ∨ matricula_real < cupo_min (SECCION))
-- Resultado esperado: 2 filas
SELECT DISTINCT id_seccion, numero, estado, matricula_real, cupo_min
FROM seccion
WHERE estado = 'CERRADA'
   OR matricula_real < cupo_min;

-- ---------------------------------------------------------------------
-- Bloque 2: Reuniones
-- ---------------------------------------------------------------------

-- Ejercicio 11. Docentes con su tipo de contrato
-- Listar cada docente con el nombre de su tipo de contrato.
-- Álgebra: π DOCENTE.nombres, DOCENTE.apellidos, TIPO_CONTRATO.nombre (DOCENTE ⋈ DOCENTE.id_tipo_contrato = TIPO_CONTRATO.id_tipo_contrato TIPO_CONTRATO)
-- Resultado esperado: 8 filas
SELECT DISTINCT d.nombres, d.apellidos, tc.nombre
FROM docente d
JOIN tipo_contrato tc
  ON d.id_tipo_contrato = tc.id_tipo_contrato;

-- Ejercicio 12. Secciones con su curso
-- Listar cada sección con el código y el nombre de su curso.
-- Álgebra: π CURSO.codigo, CURSO.nombre, SECCION.numero, SECCION.cupo_max (CURSO ⋈ CURSO.id_curso = SECCION.id_curso SECCION)
-- Resultado esperado: 13 filas
SELECT DISTINCT c.codigo, c.nombre, s.numero, s.cupo_max
FROM curso c
JOIN seccion s
  ON c.id_curso = s.id_curso;

-- Ejercicio 13. Docentes con contrato de máximo 8 horas
-- Listar los docentes cuyo contrato permite máximo 8 horas de clase.
-- Álgebra: π DOCENTE.nombres, DOCENTE.apellidos, TIPO_CONTRATO.horas_max (σ TIPO_CONTRATO.horas_max = 8 (DOCENTE ⋈ DOCENTE.id_tipo_contrato = TIPO_CONTRATO.id_tipo_contrato TIPO_CONTRATO))
-- Resultado esperado: 3 filas
SELECT DISTINCT d.nombres, d.apellidos, tc.horas_max
FROM docente d
JOIN tipo_contrato tc
  ON d.id_tipo_contrato = tc.id_tipo_contrato
WHERE tc.horas_max = 8;

-- Ejercicio 14. Recursos de cada espacio
-- Listar cada espacio con los recursos que ofrece y en qué cantidad.
-- Álgebra: π ESPACIO.codigo, RECURSO.nombre, ESPACIO_RECURSO.cantidad ((ESPACIO ⋈ ESPACIO.id_espacio = ESPACIO_RECURSO.id_espacio ESPACIO_RECURSO) ⋈ ESPACIO_RECURSO.id_recurso = RECURSO.id_recurso RECURSO)
-- Resultado esperado: 10 filas
SELECT DISTINCT e.codigo, r.nombre AS recurso, er.cantidad
FROM espacio e
JOIN espacio_recurso er ON e.id_espacio = er.id_espacio
JOIN recurso r          ON er.id_recurso = r.id_recurso;

-- Ejercicio 15. Docentes habilitados para BD1
-- Listar los docentes habilitados para dictar Bases de Datos 1.
-- Álgebra: π DOCENTE.nombres, DOCENTE.apellidos ((DOCENTE ⋈ DOCENTE.id_docente = DOCENTE_CURSO.id_docente DOCENTE_CURSO) ⋈ DOCENTE_CURSO.id_curso = CURSO.id_curso σ codigo = 'BD1' (CURSO))
-- Resultado esperado: 2 filas
SELECT DISTINCT d.nombres, d.apellidos
FROM docente d
JOIN docente_curso dc ON d.id_docente = dc.id_docente
JOIN curso c          ON dc.id_curso = c.id_curso
WHERE c.codigo = 'BD1';

-- Ejercicio 16. Horario de Ana Rojas
-- Mostrar los días y horas de clase de Ana Rojas en cada versión del horario.
-- Álgebra: π ASIGNACION.id_version, FRANJA.dia_semana, FRANJA.hora_inicio ((σ email = 'ana.rojas@ejemplo.edu' (DOCENTE) ⋈ DOCENTE.id_docente = ASIGNACION.id_docente ASIGNACION) ⋈ ASIGNACION.id_franja = FRANJA.id_franja FRANJA)
-- Resultado esperado: 6 filas
SELECT DISTINCT a.id_version, f.dia_semana, f.hora_inicio
FROM docente d
JOIN asignacion a ON d.id_docente = a.id_docente
JOIN franja f     ON a.id_franja = f.id_franja
WHERE d.email = 'ana.rojas@ejemplo.edu';

-- Ejercicio 17. Docentes con sus sesiones, incluidos los que no tienen
-- Listar todos los docentes con sus sesiones asignadas, incluidos los que no tienen ninguna.
-- Álgebra: π DOCENTE.nombres, DOCENTE.apellidos, ASIGNACION.id_asignacion (DOCENTE ⟕ DOCENTE.id_docente = ASIGNACION.id_docente ASIGNACION)
-- Resultado esperado: 24 filas (la captura muestra las primeras; el total aparece en «All Rows Fetched: 24»)
SELECT d.nombres, d.apellidos, a.id_asignacion
FROM docente d
LEFT JOIN asignacion a ON d.id_docente = a.id_docente
ORDER BY a.id_asignacion NULLS FIRST;

-- Ejercicio 18. Pares de espacios del mismo edificio
-- Listar los pares de espacios que están en el mismo edificio.
-- Álgebra: π E1.codigo, E2.codigo, E1.edificio (ρ E1 (ESPACIO) ⋈ E1.edificio = E2.edificio ∧ E1.id_espacio < E2.id_espacio ρ E2 (ESPACIO))
-- Resultado esperado: 7 filas
SELECT DISTINCT e1.codigo AS espacio_1, e2.codigo AS espacio_2, e1.edificio
FROM espacio e1
JOIN espacio e2
  ON e1.edificio = e2.edificio
 AND e1.id_espacio < e2.id_espacio;

-- Ejercicio 19. Secciones del período 2026-2
-- Listar las secciones del período 2026-2 con el código del período.
-- Álgebra: π PERIODO_ACADEMICO.codigo, SECCION.id_seccion, SECCION.numero (σ PERIODO_ACADEMICO.codigo = '2026-2' (SECCION ⋈ SECCION.id_periodo = PERIODO_ACADEMICO.id_periodo PERIODO_ACADEMICO))
-- Resultado esperado: 2 filas
SELECT DISTINCT p.codigo AS periodo, s.id_seccion, s.numero
FROM seccion s
JOIN periodo_academico p ON s.id_periodo = p.id_periodo
WHERE p.codigo = '2026-2';

-- Ejercicio 20. Horario de LC-1 en 2027-1
-- Mostrar qué cursos y secciones se dictan en el laboratorio LC-1 en el período 2027-1, con día y hora.
-- Álgebra: π CURSO.codigo, SECCION.numero, FRANJA.dia_semana, FRANJA.hora_inicio (σ ESPACIO.codigo = 'LC-1' ∧ PERIODO_ACADEMICO.codigo = '2027-1' (((((( ASIGNACION ⋈ ASIGNACION.id_seccion = SECCION.id_seccion SECCION) ⋈ SECCION.id_curso = CURSO.id_curso CURSO) ⋈ ASIGNACION.id_franja = FRANJA.id_franja FRANJA) ⋈ ASIGNACION.id_espacio = ESPACIO.id_espacio ESPACIO) ⋈ ASIGNACION.id_version = VERSION_HORARIO.id_version VERSION_HORARIO) ⋈ VERSION_HORARIO.id_periodo = PERIODO_ACADEMICO.id_periodo PERIODO_ACADEMICO))
-- Resultado esperado: 4 filas
SELECT DISTINCT c.codigo, s.numero, f.dia_semana, f.hora_inicio
FROM asignacion a
JOIN seccion s           ON a.id_seccion = s.id_seccion
JOIN curso c             ON s.id_curso   = c.id_curso
JOIN franja f            ON a.id_franja  = f.id_franja
JOIN espacio e           ON a.id_espacio = e.id_espacio
JOIN version_horario v   ON a.id_version = v.id_version
JOIN periodo_academico p ON v.id_periodo = p.id_periodo
WHERE e.codigo = 'LC-1'
  AND p.codigo = '2027-1';
