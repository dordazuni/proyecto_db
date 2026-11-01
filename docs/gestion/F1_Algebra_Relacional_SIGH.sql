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
