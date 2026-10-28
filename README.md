# SIGH · Sistema Integrado de Gestión de Horarios

Proyecto final de **Bases de Datos 1** · Programa de Ingeniería de Sistemas · Universidad El Bosque
Docente: Ing. Christian Felipe Duarte

Base de datos relacional en **PostgreSQL** para programar horarios académicos: qué sección de qué curso se dicta, con qué docente, en qué espacio y en qué franja, dentro de una versión de horario de un período académico. La base de datos hace cumplir las reglas de negocio por sí sola (llaves, restricciones, triggers y permisos). Una aplicación web (API en Spring Boot e interfaz en Angular) la consulta y la modifica.

## Equipo

| Integrante | Rol en el proyecto |
|---|---|
| Ángel Daniel Aya Páez | Gerente del proyecto: gestión, requisitos, álgebra relacional y pruebas |
| Julián Felipe López Narváez | Capa de datos: modelo entidad-relación, modelo relacional, normalización y scripts |
| David Alejandro Ordaz Luque | Infraestructura y aplicación: máquinas virtuales en AWS, backend y frontend |

## Arquitectura

| Componente | Tecnología | Dónde corre |
|---|---|---|
| Base de datos | PostgreSQL | Instancia EC2 con Ubuntu Server, sin acceso público |
| API | Spring Boot (Java 17) | Instancia EC2 con Ubuntu Server, detrás de Nginx |
| Interfaz web | Angular | Servida por Nginx en la misma instancia de la API |

La administración de la base se hace por túnel SSH (ver `docs/virtual-machine/`).

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `docs/contexto/` | Contexto unificado y plan de trabajo del equipo |
| `docs/gestion/` | Documentos de gestión: acta de constitución, EDT, cronograma y revisiones |
| `docs/virtual-machine/` | Despliegue de las máquinas virtuales en AWS |
| `docs/api/` | Colección de Postman de la API |
| `source/db/` | Scripts SQL de la base de datos y su README (orden de ejecución) |
| `source/back-end/api_horarios/` | API en Spring Boot |
| `source/front-end/front-horarios/` | Interfaz web en Angular |

## Cómo ejecutar

**Requisitos:** PostgreSQL 18, Java 17, Node.js con npm y Angular CLI 21.

1. **Base de datos:** ejecutar los scripts de `source/db/` en el orden que indica `source/db/README.MD`.
2. **API:** en `source/back-end/api_horarios/`, configurar la conexión a la base y ejecutar `./gradlew bootRun` (en Windows, `gradlew.bat bootRun`). La API queda en `http://localhost:8080/api`.
3. **Interfaz web:** en `source/front-end/front-horarios/`, ejecutar `npm install` y luego `npm start`. La interfaz queda en `http://localhost:4200`.

Las credenciales de la base de datos nunca se suben al repositorio.

## Entregables

| Entregable | Ubicación |
|---|---|
| Acta de constitución | `docs/gestion/F0_Acta_de_Constitucion_SIGH.docx` |
| EDT/WBS | `docs/gestion/F0_EDT_SIGH.docx` |
| Cronograma | `docs/gestion/F0_Cronograma_SIGH.docx` |
| Despliegue de las máquinas virtuales | `docs/virtual-machine/` |
| Scripts de base de datos y README | `source/db/` |
| Aplicación web conectada a la base | `source/back-end/` y `source/front-end/` |
| Propuesta, supuestos y requisitos | Pendiente |
| MER (Chen, extendido y Crow's Foot), modelo relacional y diccionario de datos | Pendiente |
| Normalización | Pendiente |
| Álgebra relacional (50 ejercicios) | Pendiente |
| Análisis de selección del sistema operativo y del RDBMS | Pendiente |
| Interesados, presupuesto y acta de cierre | Pendiente |
| Video de demostración | Pendiente |

Esta tabla se actualiza a medida que se integra cada entregable.
