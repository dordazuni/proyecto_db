# SIGH — Backend API (Spring Boot)

API RESTful desarrollada en **Java 17** y **Spring Boot 4.1.2** para el Sistema Integrado de Gestión de Horarios (SIGH). Provee los servicios para la gestión de catálogos, planeación docente, programación de horarios, avales, consultas de auditoría y reportes analíticos.

---

## 1. Stack Tecnológico

* **Lenguaje:** Java 17 LTS (OpenJDK 17).
* **Framework:** Spring Boot 4.1.2.
* **Módulos Spring:** `spring-boot-starter-web`, `spring-boot-starter-jdbc`.
* **Persistencia y Acceso a Datos:** `PreparedStatement` con transaccionalidad manual explícita (`Connection`), `HikariCP` y driver JDBC de PostgreSQL.
* **Gestor de Construcción:** Gradle (con wrapper incluido `gradlew`).
* **Base de Datos:** PostgreSQL 18.6 (compatible con 16+).

---

## 2. Parámetros de Configuración y Variables de Entorno

Siguiendo el requerimiento **RNF-04**, las credenciales de base de datos nunca se queman en el código fuente ni se suben al repositorio. La aplicación lee sus parámetros desde variables de entorno con valores por defecto para red interna en AWS:

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `DB_HOST` | Dirección IP o host del servidor PostgreSQL | `172.31.33.191` |
| `DB_PORT` | Puerto de escucha de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos relacional | `sigh` |
| `DB_USER` | Usuario de base de datos (nunca superusuario) | `app_administrador` |
| `DB_PASSWORD` | Contraseña del usuario de base de datos | *(vacía por defecto)* |
| `DB_URL` | Sobrescritura completa de la cadena JDBC (opcional) | `jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}` |

> [!IMPORTANT]
> **Seguridad (C2 y RNF-04):** La API **no debe** conectarse como superusuario `postgres`. El script `source/db/05_roles_permisos.sql` aprovisiona los roles aplicativos (`app_administrador`, `app_coordinador`, `app_aprobador`, `app_docente`). En producción, la API se conecta con `app_administrador` y ejecuta las operaciones bajo el esquema de seguridad por roles y auditoría.

---

## 3. Compilación y Ejecución

### Prerrequisitos
* Java Development Kit (JDK) 17 instalado (`java -version`).
* Conexión alcanzable al servidor de base de datos PostgreSQL (mediante IP privada en AWS o mediante túnel SSH en local).

### Ejecución Local en Modo Desarrollo
En Windows:
```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="sigh"
$env:DB_USER="app_administrador"
$env:DB_PASSWORD="<tu_contraseña>"

.\gradlew.bat bootRun
```

En Linux / macOS:
```bash
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="sigh"
export DB_USER="app_administrador"
export DB_PASSWORD="<tu_contraseña>"

./gradlew bootRun
```

La API quedará escuchando en `http://localhost:8080/api`.

### Ejecutar Pruebas
```bash
./gradlew test
```

### Generación del Artefacto de Producción (.jar)
Para empaquetar la aplicación sin volver a correr tests unitarios:
```bash
./gradlew build -x test
```
El archivo ejecutable se generará en:
`build/libs/api_horarios-0.0.1-SNAPSHOT.jar`

---

## 4. Despliegue en AWS EC2 (Servicio Systemd)

En la instancia de aplicación (Instancia 1 en AWS), la API se configura como un servicio del sistema para garantizar inicio automático y aislamiento de credenciales:

1. Crear el archivo de servicio `/etc/systemd/system/sigh-api.service`:
```ini
[Unit]
Description=SIGH API Spring Boot Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app/api
Environment="DB_HOST=172.31.33.191"
Environment="DB_PORT=5432"
Environment="DB_NAME=sigh"
Environment="DB_USER=app_administrador"
Environment="DB_PASSWORD=<contraseña_segura>"
ExecStart=/usr/bin/java -jar /home/ubuntu/app/api/api_horarios-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Habilitar e iniciar el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sigh-api
sudo systemctl start sigh-api
sudo systemctl status sigh-api
```

---

## 5. Arquitectura del Código y Principales Módulos

La API sigue una arquitectura en capas desacopladas:
* `co.edu.unbosque.apihorarios.controller`: Controladores REST que exponen los endpoints, validan entradas y devuelven respuestas estandarizadas.
* `co.edu.unbosque.apihorarios.service`: Lógica de orquestación, validación previa y manejo de excepciones de negocio.
* `co.edu.unbosque.apihorarios.repository`: Acceso a datos con JDBC directo, control fino de transacciones (`conn.setAutoCommit(false)`, `conn.commit()`, `conn.rollback()`), uso estricto de `PreparedStatement` contra inyección SQL y fijación de usuario en sesión PostgreSQL:
  ```java
  SELECT set_config('app.id_usuario', ?, true)
  ```
* `co.edu.unbosque.apihorarios.config.GlobalExceptionHandler`: Captura excepciones SQL y las traduce a códigos HTTP 409 (Conflict) o 422 (Unprocessable Entity), extrayendo el código de regla infringido (ej. `RN-01`, `RN-08`).

### Grupos de Endpoints (69 endpoints totales)
* **/api/catalogo:** Docentes, cursos, espacios físicos, franjas horarias, períodos académicos, contratos y recursos.
* **/api/planeacion:** Gestión de restricciones de carga, disponibilidad docente, secciones faltantes y validación de días consecutivos.
* **/api/programacion:** Creación de versiones de horario, asignación de bloques horarios/espacios/docentes, flujo de aval y pase a sincronización.
* **/api/reportes:** Vistas de horario consolidado por versión, ocupación de espacios físicos y secciones en riesgo de cierre.
* **/api/seguridad:** Bitácora inmutable de auditoría y verificación de estado.
* **/api/echo:** Endpoint de diagnóstico y salud del servicio.

---

## 6. Colección de Pruebas Postman

La colección completa de Postman para pruebas de integración se encuentra centralizada en:
[`docs/api/SIGH_API_Horarios.postman_collection.json`](../../docs/api/SIGH_API_Horarios.postman_collection.json)
