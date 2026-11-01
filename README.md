# SIGH — Sistema Integrado de Gestión de Horarios

Proyecto final de **Bases de Datos 1** — Programa de Ingeniería de Sistemas — Universidad El Bosque  
Docente: Ing. Christian Felipe Duarte  

Base de datos relacional en **PostgreSQL** para programar horarios académicos: qué sección de qué curso se dicta, con qué docente, en qué espacio y en qué franja, dentro de una versión de horario de un período académico. La base de datos hace cumplir las reglas de negocio por sí sola (llaves, restricciones, triggers y permisos). Una aplicación web (API en Spring Boot e interfaz en Angular) la consulta y la modifica.

---

## Equipo

| Integrante | Rol en el proyecto |
|---|---|
| **Ángel Daniel Aya Páez** | Gerente del proyecto: gestión, requisitos, álgebra relacional y pruebas |
| **Julián Felipe López Narváez** | Capa de datos: modelo entidad-relación, modelo relacional, normalización y scripts |
| **David Alejandro Ordaz Luque** | Infraestructura y aplicación: máquinas virtuales en AWS, backend y frontend |

---

## Arquitectura

| Componente | Tecnología | Dónde corre |
|---|---|---|
| **Base de datos** | PostgreSQL 18.6 | Instancia EC2 con Ubuntu Server, sin acceso público |
| **API** | Spring Boot 4.1.2 (Java 17) | Instancia EC2 con Ubuntu Server, detrás de Nginx |
| **Interfaz web** | Angular 21 | Servida por Nginx en la misma instancia de la API |

La administración de la base de datos se realiza de forma segura mediante túnel SSH (ver [`docs/virtual-machine/`](docs/virtual-machine/README.md)).

---

## Estructura del Repositorio

| Carpeta | Contenido |
|---|---|
| [`docs/gestion/`](docs/gestion/) | Documentos de gestión, modelos MER, relacional, normalización, requisitos y análisis |
| [`docs/virtual-machine/`](docs/virtual-machine/) | Manual de implementación y despliegue de VMs y RDBMS en AWS |
| [`docs/api/`](docs/api/) | Colección de Postman de la API REST |
| [`source/db/`](source/db/) | Scripts SQL de la base de datos (01 a 07) y su README de ejecución |
| [`source/back-end/`](source/back-end/) | API REST en Spring Boot (código fuente y documentación) |
| [`source/front-end/`](source/front-end/) | Interfaz web SPA en Angular (código fuente y documentación) |

---

## Cómo Ejecutar

**Requisitos:** PostgreSQL 16 o 18, Java 17 LTS, Node.js v18+ o v20+ con npm y Angular CLI 21.

1. **Base de datos:** Ejecutar los scripts de [`source/db/`](source/db/README.MD) en el orden estipulado:
   ```bash
   psql -U postgres -f 01_ddl.sql
   psql -U postgres -d sigh -f 02_catalogos.sql
   psql -U postgres -d sigh -f 03_funciones_triggers.sql
   psql -U postgres -d sigh -f 04_vistas.sql
   psql -U postgres -d sigh -v app_password='<contraseña>' -f 05_roles_permisos.sql
   psql -U postgres -d sigh -f 06_datos_prueba.sql
   psql -U postgres -d sigh -f 07_pruebas_reglas.sql
   ```
2. **API:** En [`source/back-end/api_horarios/`](source/back-end/README.MD), configurar las variables de entorno de base de datos y ejecutar:
   ```bash
   ./gradlew bootRun
   ```
   *(En Windows: `.\gradlew.bat bootRun`). La API queda disponible en `http://localhost:8080/api`.*
3. **Interfaz web:** En [`source/front-end/front-horarios/`](source/front-end/README.MD), instalar dependencias y ejecutar:
   ```bash
   npm install
   npm start
   ```
   *La interfaz queda disponible en `http://localhost:4200`.*

*Las credenciales reales nunca se suben al repositorio.*

---

## Estado de Entregables del Enunciado

| Entregable | Ubicación | Estado |
|---|---|:---:|
| **Acta de constitución** | [`docs/gestion/F0_Acta_de_Constitucion_SIGH.docx`](docs/gestion/F0_Acta_de_Constitucion_SIGH.docx) | Completo |
| **EDT / WBS** | [`docs/gestion/F0_EDT_SIGH.docx`](docs/gestion/F0_EDT_SIGH.docx) | Completo |
| **Cronograma** | [`docs/gestion/F0_Cronograma_SIGH.docx`](docs/gestion/F0_Cronograma_SIGH.docx) | Completo |
| **Propuesta del proyecto** | [`docs/gestion/SIGH - Propuesta del proyecto.pdf`](docs/gestion/SIGH%20-%20Propuesta%20del%20proyecto.pdf) | Completo |
| **Documento de supuestos** | [`docs/gestion/SIGH - Documento de supuestos.pdf`](docs/gestion/SIGH%20-%20Documento%20de%20supuestos.pdf) | Completo |
| **Requisitos y reglas de negocio** | [`docs/gestion/SIGH - Requisitos y reglas de negocio.pdf`](docs/gestion/SIGH%20-%20Requisitos%20y%20reglas%20de%20negocio.pdf) | Completo |
| **MER en notación de Chen** | [`docs/gestion/SIGH - MER en notación de Chen.pdf`](docs/gestion/SIGH%20-%20MER%20en%20notación%20de%20Chen.pdf) | Completo |
| **MER extendido** | [`docs/gestion/SIGH - MER extendido.pdf`](docs/gestion/SIGH%20-%20MER%20extendido.pdf) | Completo |
| **MER en Crow's Foot** | [`docs/gestion/SIGH - MER en Crow's Foot.pdf`](docs/gestion/SIGH%20-%20MER%20en%20Crow's%20Foot.pdf) | Completo |
| **Modelo relacional** | [`docs/gestion/SIGH - Modelo relacional.pdf`](docs/gestion/SIGH%20-%20Modelo%20relacional.pdf) | Completo |
| **Normalización (1FN, 2FN, 3FN)** | [`docs/gestion/SIGH - Normalización.pdf`](docs/gestion/SIGH%20-%20Normalización.pdf) | Completo |
| **Diccionario de datos** | [`docs/gestion/SIGH - Diccionario de datos.pdf`](docs/gestion/SIGH%20-%20Diccionario%20de%20datos.pdf) | Completo |
| **Análisis de selección del SO** | [`docs/gestion/SIGH - Analisis de seleccion del SO.pdf`](docs/gestion/SIGH%20-%20Analisis%20de%20seleccion%20del%20SO.pdf) | Completo |
| **Análisis de selección del RDBMS** | [`docs/gestion/SIGH - Analisis de seleccion del RDBMS.pdf`](docs/gestion/SIGH%20-%20Analisis%20de%20seleccion%20del%20RDBMS.pdf) | Completo |
| **Despliegue e implementación de VM y RDBMS** | [`docs/virtual-machine/README.md`](docs/virtual-machine/README.md) | Completo |
| **Scripts de base de datos (01 a 07) + README** | [`source/db/`](source/db/) | Completo |
| **API REST conectada a la base de datos** | [`source/back-end/`](source/back-end/) | Completo |
| **Frontend web conectado a la API** | [`source/front-end/`](source/front-end/) | Completo |
| **Álgebra relacional (50 ejercicios)** | `docs/gestion/` | Pendiente (Daniel) |
| **Interesados, presupuesto y acta de cierre** | `docs/gestion/` | Pendiente (Daniel) |
| **Presentación y Video de demostración (15 min)** | Enlace en README / Anexo | Pendiente (Los tres) |
