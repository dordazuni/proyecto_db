-- =====================================================================
-- SIGH — Sistema Integrado de Gestión de Horarios
-- 01_ddl.sql — Creación de la base y de las 20 tablas
-- Nivel: FÍSICO (PostgreSQL 18.6)
-- Fuente: contrato del esquema lógico v1.1 (fases 2-3, secciones 6.6 y 7)
--         y Documento de Requisitos (fase 1).
--
-- Ejecución (como superusuario, sobre una instalación limpia):
--     psql -U postgres -f 01_ddl.sql
--
-- Este script SOLO usa restricciones declarativas: PK, FK, UNIQUE,
-- NOT NULL, DEFAULT y CHECK. Las reglas que comparan tablas o leen
-- parámetros (tabla 7.19 del diccionario) van en 03_funciones_triggers.sql.
--
-- Convención de nombres: cada restricción que cumple una regla lleva
-- el código de la regla en su nombre (por ejemplo, uq_asig_rn01_docente_franja).
-- PostgreSQL incluye el nombre de la restricción en el mensaje de error,
-- así que el rechazo ya nombra la regla violada (RNF-10) sin trigger.
-- =====================================================================

\set ON_ERROR_STOP on

-- Reinicio limpio (RNF-09): borra la base si existe y la crea de nuevo.
DROP DATABASE IF EXISTS sigh;
CREATE DATABASE sigh
    ENCODING 'UTF8'
    TEMPLATE template0;

\c sigh

SET client_min_messages = warning;

-- =====================================================================
-- 1. Tablas sin dependencias (catálogos)
-- =====================================================================

-- ROL — 4 roles genéricos (S-14, RF-25)
CREATE TABLE rol (
    id_rol  integer GENERATED ALWAYS AS IDENTITY,
    nombre  varchar(30) NOT NULL,
    CONSTRAINT pk_rol PRIMARY KEY (id_rol),
    CONSTRAINT uq_rol_nombre UNIQUE (nombre),
    CONSTRAINT chk_rol_s14_nombre CHECK (nombre IN
        ('ADMINISTRADOR', 'COORDINADOR', 'APROBADOR', 'DOCENTE'))
);

-- TIPO_CONTRATO — horas mínimas y máximas de clase (P-07, P-08)
CREATE TABLE tipo_contrato (
    id_tipo_contrato  integer GENERATED ALWAYS AS IDENTITY,
    nombre            varchar(40) NOT NULL,
    horas_min         smallint NOT NULL DEFAULT 0,
    horas_max         smallint NOT NULL,
    CONSTRAINT pk_tipo_contrato PRIMARY KEY (id_tipo_contrato),
    CONSTRAINT uq_tipo_contrato_nombre UNIQUE (nombre),
    CONSTRAINT chk_tc_p08_horas_min CHECK (horas_min >= 0),
    CONSTRAINT chk_tc_rn05_horas_max CHECK (horas_max > 0 AND horas_max >= horas_min)
);

-- PERIODO_ACADEMICO — todo horario pertenece a un período (RF-01, RD-13)
CREATE TABLE periodo_academico (
    id_periodo    integer GENERATED ALWAYS AS IDENTITY,
    codigo        varchar(7) NOT NULL,
    fecha_inicio  date NOT NULL,
    fecha_fin     date NOT NULL,
    estado        varchar(15) NOT NULL DEFAULT 'PLANEACION',
    CONSTRAINT pk_periodo_academico PRIMARY KEY (id_periodo),
    CONSTRAINT uq_periodo_codigo UNIQUE (codigo),
    CONSTRAINT chk_periodo_rf01_codigo CHECK (codigo ~ '^[0-9]{4}-[12]$'),
    CONSTRAINT chk_periodo_rf01_fechas CHECK (fecha_fin > fecha_inicio),
    -- (propuesto) valores pendientes de confirmar, diccionario 9.3
    CONSTRAINT chk_periodo_rf01_estado CHECK (estado IN
        ('PLANEACION', 'ACTIVO', 'CERRADO'))
);

-- CURSO — horas_semanales (= 2 x frecuencia) NO se almacena: vista en 04 (L9)
CREATE TABLE curso (
    id_curso            integer GENERATED ALWAYS AS IDENTITY,
    codigo              varchar(20) NOT NULL,
    nombre              varchar(120) NOT NULL,
    frecuencia_semanal  smallint NOT NULL,
    CONSTRAINT pk_curso PRIMARY KEY (id_curso),
    CONSTRAINT uq_curso_codigo UNIQUE (codigo),
    -- RN-09: piso estructural. El tope (<= FRECUENCIA_MAXIMA, P-04) lee
    -- PARAMETRO_SISTEMA y por eso va en trigger (03), decisión F1.
    CONSTRAINT chk_curso_rn09_frecuencia_min CHECK (frecuencia_semanal >= 1)
);

-- ESPACIO — superclase de la jerarquía disjunta y parcial (sección 6.4)
-- Se carga solo por script desde los sistemas fuente (S-03, RN-19).
CREATE TABLE espacio (
    id_espacio    integer GENERATED ALWAYS AS IDENTITY,
    codigo        varchar(20) NOT NULL,
    nombre        varchar(100) NOT NULL,
    capacidad     smallint NOT NULL,
    edificio      varchar(60) NOT NULL,
    tipo_espacio  varchar(20) NOT NULL,
    CONSTRAINT pk_espacio PRIMARY KEY (id_espacio),
    CONSTRAINT uq_espacio_codigo UNIQUE (codigo),
    CONSTRAINT chk_espacio_rn04_capacidad CHECK (capacidad > 0),
    CONSTRAINT chk_espacio_tipo CHECK (tipo_espacio IN
        ('AULA', 'LAB_COMPUTO', 'LAB_ESPECIALIZADO'))
);

-- RECURSO — equipo, mobiliario o software (RF-04, decisión 5)
CREATE TABLE recurso (
    id_recurso  integer GENERATED ALWAYS AS IDENTITY,
    nombre      varchar(80) NOT NULL,
    categoria   varchar(15) NOT NULL,
    CONSTRAINT pk_recurso PRIMARY KEY (id_recurso),
    CONSTRAINT uq_recurso_nombre UNIQUE (nombre),
    CONSTRAINT chk_recurso_categoria CHECK (categoria IN
        ('EQUIPO', 'MOBILIARIO', 'SOFTWARE'))
);

-- FRANJA — plantilla semanal de bloques de 2 horas (S-06, RF-07)
-- hora_fin NO es columna: es hora_inicio + 2 h y se calcula en la vista
-- de franjas (fase 4, hallazgo H-1, opción A; decisión L9).
-- dia_semana: 1 = lunes ... 6 = sábado (decisión F5).
-- Como ASIGNACION solo puede apuntar a una franja existente (FK),
-- estos CHECK bastan para RN-06, RN-07 y RN-08 en todo el horario.
CREATE TABLE franja (
    id_franja    smallint NOT NULL,  -- fijado en 02_catalogos.sql (1 a 33)
    dia_semana   smallint NOT NULL,
    hora_inicio  time NOT NULL,
    CONSTRAINT pk_franja PRIMARY KEY (id_franja),
    CONSTRAINT uq_franja_dia_hora UNIQUE (dia_semana, hora_inicio),
    CONSTRAINT chk_franja_dia CHECK (dia_semana BETWEEN 1 AND 6),
    -- RN-07: ventana operativa. Inicio >= 07:00 y fin (inicio + 2 h)
    -- <= 22:00 de lunes a viernes y <= 13:00 el sábado.
    CONSTRAINT chk_franja_rn07_ventana CHECK (
        hora_inicio >= time '07:00'
        AND (   (dia_semana BETWEEN 1 AND 5 AND hora_inicio <= time '20:00')
             OR (dia_semana = 6            AND hora_inicio <= time '11:00'))),
    -- RN-06: de lunes a viernes ninguna sesión toca 12:00-13:00:
    -- termina a más tardar a las 12:00 o empieza desde las 13:00.
    CONSTRAINT chk_franja_rn06_zona_muerta CHECK (
        dia_semana = 6
        OR hora_inicio <= time '10:00'
        OR hora_inicio >= time '13:00'),
    -- RN-08: la franja empieza en hora en punto; la duración de 2 h
    -- está garantizada porque hora_fin se deriva, no se almacena.
    CONSTRAINT chk_franja_rn08_hora_en_punto CHECK (
        date_trunc('hour', hora_inicio) = hora_inicio)
);

-- PARAMETRO_SISTEMA — capa física, sin relaciones (resolución 7, RNF-07)
-- Guarda P-01 a P-04; los triggers de 03 los leen por clave.
CREATE TABLE parametro_sistema (
    clave        varchar(40) NOT NULL,
    valor        numeric(8,2) NOT NULL,
    descripcion  varchar(200) NOT NULL,
    CONSTRAINT pk_parametro_sistema PRIMARY KEY (clave),
    CONSTRAINT chk_parametro_valor CHECK (valor >= 0)
);

-- =====================================================================
-- 2. Tablas que dependen de los catálogos
-- =====================================================================

-- Subclases de ESPACIO: PK = FK a la superclase (decisión A, L4)
CREATE TABLE laboratorio_computo (
    id_espacio      integer NOT NULL,
    numero_equipos  smallint NOT NULL,
    CONSTRAINT pk_laboratorio_computo PRIMARY KEY (id_espacio),
    CONSTRAINT fk_labcomp_espacio FOREIGN KEY (id_espacio)
        REFERENCES espacio (id_espacio) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_labcomp_equipos CHECK (numero_equipos > 0)
);

CREATE TABLE laboratorio_especializado (
    id_espacio  integer NOT NULL,
    area        varchar(60) NOT NULL,
    CONSTRAINT pk_laboratorio_especializado PRIMARY KEY (id_espacio),
    CONSTRAINT fk_labesp_espacio FOREIGN KEY (id_espacio)
        REFERENCES espacio (id_espacio) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- DOCENTE — se carga solo por script (S-03, RN-19)
CREATE TABLE docente (
    id_docente          integer GENERATED ALWAYS AS IDENTITY,
    tipo_documento      varchar(5) NOT NULL,
    numero_documento    varchar(20) NOT NULL,
    nombres             varchar(80) NOT NULL,
    apellidos           varchar(80) NOT NULL,
    email               varchar(120) NOT NULL,
    estado_vinculacion  varchar(20) NOT NULL DEFAULT 'ACTIVO',
    id_tipo_contrato    integer NOT NULL,
    CONSTRAINT pk_docente PRIMARY KEY (id_docente),
    CONSTRAINT uq_docente_documento UNIQUE (tipo_documento, numero_documento), -- decisión 7
    CONSTRAINT uq_docente_email UNIQUE (email),
    CONSTRAINT fk_docente_tipo_contrato FOREIGN KEY (id_tipo_contrato)
        REFERENCES tipo_contrato (id_tipo_contrato) ON DELETE RESTRICT ON UPDATE RESTRICT,
    -- (propuesto) valores pendientes de confirmar, diccionario 9.3
    CONSTRAINT chk_docente_tipo_documento CHECK (tipo_documento IN ('CC', 'CE', 'PA')),
    CONSTRAINT chk_docente_email CHECK (email LIKE '%@%._%'),
    CONSTRAINT chk_docente_estado CHECK (estado_vinculacion IN ('ACTIVO', 'INACTIVO'))
);

-- USUARIO — un rol por usuario (S-09); VINCULAR 1:1 con DOCENTE (L5)
CREATE TABLE usuario (
    id_usuario      integer GENERATED ALWAYS AS IDENTITY,
    nombre_usuario  varchar(50) NOT NULL,
    contrasena      varchar(255) NOT NULL,   -- hash, nunca texto plano (RNF-04)
    activo          boolean NOT NULL DEFAULT true,
    id_rol          integer NOT NULL,
    id_docente      integer NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_nombre UNIQUE (nombre_usuario),
    CONSTRAINT uq_usuario_docente UNIQUE (id_docente),       -- garantiza la 1:1
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol)
        REFERENCES rol (id_rol) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_usuario_docente FOREIGN KEY (id_docente)
        REFERENCES docente (id_docente) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- SECCION — entidad débil con id propio (decisión 6, L1)
CREATE TABLE seccion (
    id_seccion               integer GENERATED ALWAYS AS IDENTITY,
    id_curso                 integer NOT NULL,
    id_periodo               integer NOT NULL,
    numero                   smallint NOT NULL,
    cupo_max                 smallint NOT NULL,
    cupo_min                 smallint NOT NULL,
    matricula_proyectada     smallint NOT NULL DEFAULT 0,
    matricula_real           smallint NULL,
    justificacion_sobrecupo  varchar(500) NULL,
    estado                   varchar(10) NOT NULL DEFAULT 'ABIERTA',
    CONSTRAINT pk_seccion PRIMARY KEY (id_seccion),
    CONSTRAINT uq_seccion_s13_curso_periodo_numero UNIQUE (id_curso, id_periodo, numero),
    CONSTRAINT fk_seccion_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_seccion_periodo FOREIGN KEY (id_periodo)
        REFERENCES periodo_academico (id_periodo) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_seccion_s13_numero CHECK (numero > 0),
    -- RN-10: parte estructural. El tope (estándar + tolerancia) y la
    -- justificación obligatoria leen PARAMETRO_SISTEMA: trigger en 03 (F1).
    CONSTRAINT chk_seccion_rn10_cupo_min CHECK (cupo_min > 0),
    CONSTRAINT chk_seccion_rn10_cupo_max CHECK (cupo_max >= cupo_min),
    CONSTRAINT chk_seccion_rn04_matriculas CHECK (
        matricula_proyectada >= 0 AND (matricula_real IS NULL OR matricula_real >= 0)),
    CONSTRAINT chk_seccion_rn11_estado CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

-- VERSION_HORARIO — consecutivo por período (S-12); AVALAR como FK nula (L6)
CREATE TABLE version_horario (
    id_version            integer GENERATED ALWAYS AS IDENTITY,
    id_periodo            integer NOT NULL,
    numero_version        smallint NOT NULL,
    estado                varchar(15) NOT NULL DEFAULT 'EN_EDICION',
    fecha_aval            timestamptz NULL,
    id_documento_externo  varchar(100) NULL,
    id_usuario_aval       integer NULL,
    CONSTRAINT pk_version_horario PRIMARY KEY (id_version),
    CONSTRAINT uq_version_s12_periodo_numero UNIQUE (id_periodo, numero_version),
    CONSTRAINT uq_version_documento_externo UNIQUE (id_documento_externo),
    CONSTRAINT fk_version_periodo FOREIGN KEY (id_periodo)
        REFERENCES periodo_academico (id_periodo) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_version_usuario_aval FOREIGN KEY (id_usuario_aval)
        REFERENCES usuario (id_usuario) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_version_s12_numero CHECK (numero_version > 0),
    -- RN-17: estados válidos. Qué transiciones se permiten y que quien
    -- avala tenga rol APROBADOR comparan filas/tablas: trigger en 03.
    CONSTRAINT chk_version_rn17_estado CHECK (estado IN
        ('EN_EDICION', 'PENDIENTE', 'AVALADO', 'SINCRONIZADO')),
    -- RN-17: una versión avalada (o sincronizada) tiene avalador y fecha;
    -- una no avalada no los tiene (decisión F8, sobre una sola fila).
    CONSTRAINT chk_version_rn17_aval CHECK (
        (estado IN ('AVALADO', 'SINCRONIZADO'))
        = (id_usuario_aval IS NOT NULL AND fecha_aval IS NOT NULL)),
    -- RN-17: pasar a SINCRONIZADO exige el identificador documental.
    CONSTRAINT chk_version_rn17_sincronizado CHECK (
        (estado = 'SINCRONIZADO') = (id_documento_externo IS NOT NULL))
);

-- DISPONIBILIDAD — entidad débil, PK compuesta (decisión 3, sección 6.2)
-- Una franja sin fila se considera disponible (S-04).
-- Cada docente ve y edita solo la suya: seguridad por fila en 05 (RN-19).
CREATE TABLE disponibilidad (
    id_docente  integer NOT NULL,
    id_periodo  integer NOT NULL,
    id_franja   smallint NOT NULL,
    tipo        varchar(15) NOT NULL DEFAULT 'NO_DISPONIBLE',
    CONSTRAINT pk_disponibilidad PRIMARY KEY (id_docente, id_periodo, id_franja),
    CONSTRAINT fk_disp_docente FOREIGN KEY (id_docente)
        REFERENCES docente (id_docente) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_disp_periodo FOREIGN KEY (id_periodo)
        REFERENCES periodo_academico (id_periodo) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_disp_franja FOREIGN KEY (id_franja)
        REFERENCES franja (id_franja) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_disp_rn13_tipo CHECK (tipo IN ('DISPONIBLE', 'NO_DISPONIBLE'))
);

-- =====================================================================
-- 3. Tablas de las relaciones N:M (L7)
-- =====================================================================

-- IMPARTIR: qué cursos puede dictar cada docente (RN-12, RF-06)
CREATE TABLE docente_curso (
    id_docente  integer NOT NULL,
    id_curso    integer NOT NULL,
    CONSTRAINT pk_docente_curso PRIMARY KEY (id_docente, id_curso),
    CONSTRAINT fk_dc_docente FOREIGN KEY (id_docente)
        REFERENCES docente (id_docente) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_dc_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- REQUERIR: recursos que exige cada curso (RN-14, RF-05)
CREATE TABLE curso_recurso (
    id_curso    integer NOT NULL,
    id_recurso  integer NOT NULL,
    CONSTRAINT pk_curso_recurso PRIMARY KEY (id_curso, id_recurso),
    CONSTRAINT fk_cr_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_cr_recurso FOREIGN KEY (id_recurso)
        REFERENCES recurso (id_recurso) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- DOTAR: recursos que ofrece cada espacio y en qué cantidad (RN-14, RF-04)
CREATE TABLE espacio_recurso (
    id_espacio  integer NOT NULL,
    id_recurso  integer NOT NULL,
    cantidad    smallint NOT NULL DEFAULT 1,
    CONSTRAINT pk_espacio_recurso PRIMARY KEY (id_espacio, id_recurso),
    CONSTRAINT fk_er_espacio FOREIGN KEY (id_espacio)
        REFERENCES espacio (id_espacio) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_er_recurso FOREIGN KEY (id_recurso)
        REFERENCES recurso (id_recurso) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_er_cantidad CHECK (cantidad > 0)
);

-- =====================================================================
-- 4. ASIGNACION — la sesión programada (entidad + 6 relaciones 1:N)
-- =====================================================================
-- Las tres UNIQUE son a la vez las reglas RN-01 a RN-03 y las llaves
-- candidatas que demuestran la FNBC (fase 4, L8). No necesitan trigger.
-- RN-04, RN-05, RN-09 (sesiones <= frecuencia), RN-11 a RN-16: función
-- validar_asignacion en 03.
CREATE TABLE asignacion (
    id_asignacion       integer GENERATED ALWAYS AS IDENTITY,
    id_version          integer NOT NULL,
    id_seccion          integer NOT NULL,
    id_docente          integer NOT NULL,
    id_espacio          integer NOT NULL,
    id_franja           smallint NOT NULL,
    id_usuario_creador  integer NOT NULL,
    fecha_creacion      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_asignacion PRIMARY KEY (id_asignacion),
    -- RN-01: un docente no tiene dos sesiones en la misma franja de una versión
    CONSTRAINT uq_asig_rn01_docente_franja UNIQUE (id_version, id_docente, id_franja),
    -- RN-02: un espacio no tiene dos sesiones en la misma franja de una versión
    CONSTRAINT uq_asig_rn02_espacio_franja UNIQUE (id_version, id_espacio, id_franja),
    -- RN-03: una sección no tiene dos sesiones en la misma franja de una versión
    CONSTRAINT uq_asig_rn03_seccion_franja UNIQUE (id_version, id_seccion, id_franja),
    CONSTRAINT fk_asig_version FOREIGN KEY (id_version)
        REFERENCES version_horario (id_version) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_asig_seccion FOREIGN KEY (id_seccion)
        REFERENCES seccion (id_seccion) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_asig_docente FOREIGN KEY (id_docente)
        REFERENCES docente (id_docente) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_asig_espacio FOREIGN KEY (id_espacio)
        REFERENCES espacio (id_espacio) ON DELETE RESTRICT ON UPDATE RESTRICT,
    -- RN-06 a RN-08: la sesión solo puede usar una franja del catálogo
    CONSTRAINT fk_asig_rn08_franja FOREIGN KEY (id_franja)
        REFERENCES franja (id_franja) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_asig_usuario_creador FOREIGN KEY (id_usuario_creador)
        REFERENCES usuario (id_usuario) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- =====================================================================
-- 5. LOG_AUDITORIA — bitácora de solo inserción (RN-18, RF-24)
-- =====================================================================
-- Solo inserción: se garantiza en 05 con REVOKE de UPDATE, DELETE y
-- TRUNCATE a todos los roles de la aplicación (RNF-06). La llenan los
-- triggers de auditoría de 03; los scripts usan un usuario técnico (F7).
CREATE TABLE log_auditoria (
    id_log          bigint GENERATED ALWAYS AS IDENTITY,
    id_usuario      integer NOT NULL,
    fecha_hora      timestamptz NOT NULL DEFAULT now(),
    accion          varchar(10) NOT NULL,
    tabla_afectada  varchar(40) NOT NULL,
    detalle         jsonb NOT NULL,          -- valor opaco (fase 4, H-2)
    CONSTRAINT pk_log_auditoria PRIMARY KEY (id_log),
    CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_log_rf24_accion CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- =====================================================================
-- Verificación: deben aparecer 20 tablas.
-- =====================================================================
SELECT count(*) AS tablas_creadas
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
