# Guía Completa de Pruebas Web, API (Apidog) y Reglas de Negocio — SIGH

Esta guía permite verificar extremo a extremo el **Sistema Integrado de Gestión de Horarios (SIGH)** desplegado en `http://18.221.34.127`, validando todos los requerimientos funcionales (`RF-01` a `RF-25`), los requerimientos no funcionales (`RNF-01` a `RNF-08`) y las 22 reglas de negocio (`RN-01` a `RN-22`) exigidas en los documentos del proyecto.

---

## 1. Colección Apidog / Postman Actualizada

El archivo JSON actualizado se encuentra en:
- `docs/api/SIGH_API_Horarios.postman_collection.json`

### ¿Qué ajustes incluye esta nueva versión del JSON?
1. **Autenticación JWT Automática (`Bearer {{token}}`)**:
   - En la carpeta **`00. Salud y Autenticación JWT (Echo & Login)`** tienes peticiones listas para iniciar sesión con cada uno de los 4 roles (`admin`, `coordinador`, `aprobador`, `ana.rojas`) más un caso de rechazo `401` (`sistema`).
   - Cada petición de Login incluye un **script de post-respuesta (`test`)** que guarda automáticamente el `token` JWT devuelto por el servidor en la variable de colección `{{token}}`.
   - Todos los endpoints de las carpetas `01` a `05` envían automáticamente el encabezado `Authorization: Bearer {{token}}`.
2. **Eliminación de encabezados y campos obsoletos**:
   - Se eliminó por completo el antiguo encabezado `X-Usuario-Id` y el campo manual `idUsuario` de los cuerpos JSON en `/disponibilidad`, `/versiones` y `/asignaciones`. Ahora el backend extrae la identidad real del usuario directamente del token JWT firmado y la inyecta en PostgreSQL mediante `SELECT set_config('app.id_usuario', '<id>', true)`.
3. **Nuevo endpoint `GET /auth/me`**:
   - Permite probar la recuperación de la sesión activa a partir del token Bearer.

### Cómo importarlo en Apidog:
1. Abre tu proyecto en **Apidog** → **Settings (Configuración)** → **Import Data (Importar datos)**.
2. Selecciona **Postman** y sube el archivo `docs/api/SIGH_API_Horarios.postman_collection.json`.
3. Ve a la carpeta **`00. Salud y Autenticación JWT`**, ejecuta **`POST /auth/login - Iniciar sesión como ADMINISTRADOR (admin)`** y luego prueba cualquier endpoint de las carpetas `01` a `05`.

---

## 2. Matriz de Credenciales y Permisos por Rol (`RF-23`, `RF-25`, `RNF-04`)

Todos los usuarios de prueba tienen la contraseña **`123456`** (almacenada como hash SHA-256 `8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92` en `usuario.hash_contrasena`). El usuario técnico `sistema` tiene `'!'` y no puede iniciar sesión (`RN-21`).

| Usuario | Contraseña | Rol en SIGH | Pool PostgreSQL (`RNF-04`) | Módulos Visibles en la Web | Permisos Clave en BD |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `admin` | `123456` | `ADMINISTRADOR` | `app_administrador` | Catálogos, Planeación, Programación, Reportes, Seguridad | Lectura y escritura total (`parametro_sistema`, `usuario`, `log_auditoria`, catálogos, versiones) |
| `coordinador` | `123456` | `COORDINADOR` | `app_coordinador` | Catálogos, Planeación, Programación, Reportes | Crea/edita catálogos, secciones, disponibilidad, versiones y asignaciones; envía a aprobación (`RF-15`) y sincroniza (`RF-17`). No avala ni edita parámetros/usuarios |
| `aprobador` | `123456` | `APROBADOR` | `app_aprobador` | Programación, Reportes | Solo lectura de planeación y reportes; en Programación **solo ve botones Avalar y Devolver (`RF-16`)** |
| `ana.rojas` | `123456` | `DOCENTE` (`idDocente=1`) | `app_docente` | Planeación, Reportes | En Planeación **solo ve y edita su propia disponibilidad (`RN-19`)**; en Reportes consulta su horario y carga |
| `sistema` | *(bloqueado)* | `ADMINISTRADOR` | N/A | Rechazado en `/login` (`401`) | Usuario técnico para operaciones internas de consola (`RN-21`) |

---

## 3. Guía Paso a Paso de Pruebas en la Web (`http://18.221.34.127`)

### Flujo A: Verificación de Rutas, Salud y Login (`RF-23`, `RN-21`)
1. **Redirección sin sesión**:
   - Abre una ventana de incógnito en `http://18.221.34.127/#/bienvenida`.
   - **Resultado esperado**: El `authGuard` redirige automáticamente a `/#/login`.
2. **Estado de conexión pública (`/conexion`)**:
   - En la pantalla de login haz clic en **"Estado de conexión BD"** (o navega a `/#/conexion`).
   - **Resultado esperado**: Muestra `UP`, motor `PostgreSQL`, base de datos `sigh`, sin requerir inicio de sesión.
3. **Rechazo de credenciales inválidas o usuario `sistema`**:
   - Intenta iniciar sesión con `sistema` / `123456` o `admin` / `clave_erronea`.
   - **Resultado esperado**: Alerta roja en pantalla con código `401 Unauthorized` ("Credenciales inválidas").
4. **Persistencia al recargar (`F5`)**:
   - Inicia sesión con `admin` / `123456`. Entrarás a `/#/bienvenida`.
   - Presiona **`F5`** (recargar página del navegador).
   - **Resultado esperado**: No aparece `404 Not Found` de Nginx ni se pierde la sesión; el frontend valida el token contra `GET /api/auth/me` y mantiene la vista activa.

---

### Flujo B: Prueba del Rol `DOCENTE` (`ana.rojas` / `123456`) — `RF-11`, `RF-19`, `RN-19`
1. Cierra sesión (botón **"Salir"** arriba a la derecha) e inicia sesión con **`ana.rojas`** / **`123456`**.
2. **Menú filtrado por rol**:
   - Verifica que en la barra superior de `/#/bienvenida` solo aparecen **Planeación** y **Reportes** (no aparecen Catálogos, Programación ni Seguridad).
3. **Planeación restringida a su propia disponibilidad (`RN-19`)**:
   - En la pestaña **Planeación**, verifica que la sección de "Apertura de secciones" está oculta para el docente y que el selector de docente está **fijo y bloqueado en `Ana María Rojas` (`idDocente=1`)**.
   - Marca o desmarca una franja como `NO_DISPONIBLE` (por ejemplo, Lunes `07:00:00`).
   - **Resultado esperado**: Se guarda o elimina correctamente en BD usando el pool `app_docente`.
4. **Prueba de seguridad en Apidog para `DOCENTE` (`RN-19` y `RNF-04`)**:
   - En Apidog, ejecuta `POST /auth/login` como `ana.rojas`.
   - Intenta ejecutar `POST /disponibilidad` enviando `"idDocente": 2` (intentando alterar la disponibilidad de Carlos).
   - **Resultado esperado**: `403 Forbidden` (`"Un usuario con rol DOCENTE solo puede modificar su propia disponibilidad (RN-19)"`).
   - Intenta ejecutar `GET /usuarios` o `POST /periodos` con el token de `ana.rojas`.
   - **Resultado esperado**: `403 Forbidden` (`permission denied for table ...` desde PostgreSQL).

---

### Flujo C: Prueba del Rol `COORDINADOR` (`coordinador` / `123456`) — `RF-01..15`, `RF-17..22`
1. Inicia sesión en la web con **`coordinador`** / **`123456`**.
2. **Módulo 01 — Catálogos (`RF-01` a `RF-08`)**:
   - Verifica que puedes crear/actualizar **Períodos**, **Docentes**, **Espacios**, **Recursos**, **Cursos** y habilitar docentes en cursos (`RF-06`).
   - En la tarjeta de **Parámetros del sistema (`RF-08`)**, verifica que como `COORDINADOR` puedes ver los valores (`CUPO_ESTANDAR = 40`, `SOBRECUPO_MAX = 4`), pero si intentas modificar un parámetro por API recibes `403 Forbidden` porque `parametro_sistema` solo permite escritura a `app_administrador`.
3. **Módulo 02 — Planeación (`RF-09` a `RF-11`)**:
   - **Regla `RN-10` (Sobrecupo `41..44` exige justificación)**:
     - Intenta abrir una sección con `cupoMax = 42` dejando la justificación vacía.
     - **Resultado esperado**: El trigger de PostgreSQL rechaza la operación con `409 Conflict` / `400 Bad Request` indicando que el sobrecupo requiere justificación.
     - Escribe una justificación (ej. `"Autorizado por decanatura"`) y guarda. Ahora se crea exitosamente.
   - **Regla `RN-10` (Tope absoluto `44`)**:
     - Intenta abrir una sección con `cupoMax = 45`.
     - **Resultado esperado**: Rechazado por la restricción `chk_seccion_cupo_max` / trigger de `seccion`.
4. **Módulo 03 — Programación (`RF-12` a `RF-18`)**:
   - Verifica que como `COORDINADOR` ves el formulario de **Crear versión (`RF-12`)**, el formulario de **Asignar sesión (`RF-13`)**, y los botones **Enviar a aprobación (`RF-15`)**, **Sincronizar (`RF-17`)** y **Clonar (`RF-18`)**, pero **NO** ves los botones de Avalar ni Devolver (exclusivos de `APROBADOR` / `ADMINISTRADOR`).
   - En una versión en estado **`EN_EDICION`**, prueba asignar sesiones en la matriz visual:
     - **Choque de espacio (`RN-05`)**: Intenta asignar el mismo espacio en la misma franja y versión a otra sección → Rechazado con `409 Conflict`.
     - **Choque de docente (`RN-06`)**: Intenta asignar el mismo docente en la misma franja y versión → Rechazado con `409 Conflict`.
     - **Docente no habilitado (`RN-03`)**: Intenta asignar un docente a una sección de un curso que no tiene habilitado en `docente_curso` → Rechazado por el trigger `trg_asignacion_validar`.
     - **Docente no disponible (`RN-09`)**: Intenta asignar a un docente en una franja marcada como `NO_DISPONIBLE` en ese período → Rechazado por el trigger.
     - **Capacidad del espacio (`RN-04`)**: Intenta asignar una sección cuya `matricula_proyectada` supere la `capacidad` del aula → Rechazado por el trigger.
     - **Recursos del espacio (`RN-07`)**: Intenta asignar una sección de un curso que requiere `SALA_COMPUTO` o `VIDEOBEAM` en un espacio que no lo tiene → Rechazado por el trigger.
     - **Tope de carga por contrato (`RN-02`)**: Intenta superar las horas máximas semanales del contrato del docente → Rechazado por el trigger.
5. **Enviar versión a aprobación (`RF-15`, `RN-14`)**:
   - Cuando todas las secciones abiertas del período tengan sus sesiones completas (verificable en **Reportes → Sesiones faltantes** = 0), haz clic en **"Enviar a aprobación"**.
   - **Resultado esperado**: La versión pasa de `EN_EDICION` a `PENDIENTE`. (Si faltan sesiones por programar, el trigger `RN-14` mostrará el mensaje exacto indicando que no se puede enviar a aprobación hasta completar la frecuencia semanal).

---

### Flujo D: Prueba del Rol `APROBADOR` (`aprobador` / `123456`) — `RF-16`, `RN-13`, `RN-15`
1. Cierra sesión e inicia sesión con **`aprobador`** / **`123456`**.
2. **Interfaz limpia para Aprobador**:
   - Entra a la pestaña **Programación**.
   - Verifica que los formularios de crear versión y asignar sesiones están ocultos, y en la tabla de versiones solo aparecen los botones **"Avalar"** y **"Devolver a edición"** para las versiones en estado `PENDIENTE`.
3. **Avalar o Devolver (`RF-16`)**:
   - Haz clic en **"Avalar"** sobre una versión en estado `PENDIENTE`.
   - **Resultado esperado**: La versión cambia a estado **`AVALADO`**, registrando en la base de datos `avala_id_usuario = 3` (`aprobador`) y la fecha de aval (`RN-13`, `RN-15`).

---

### Flujo E: Prueba del Rol `ADMINISTRADOR` (`admin` / `123456`) y Bitácora (`RF-23`, `RF-24`, `RN-20`)
1. Cierra sesión e inicia sesión con **`admin`** / **`123456`**.
2. **Módulo 05 — Seguridad y Auditoría**:
   - Abre la pestaña **Seguridad**.
   - En la tabla **Bitácora de auditoría (`log_auditoria` - `RF-24`)**, verifica los últimos registros creados durante las pruebas anteriores.
   - **Resultado esperado (`RN-20`)**: Cada `INSERT`, `UPDATE` o `DELETE` en tablas críticas muestra en `id_usuario` / `nombre_usuario` el usuario real que ejecutó la acción desde la web o Apidog (`admin`, `coordinador`, `aprobador` o `ana.rojas`), gracias a `set_config('app.id_usuario', ..., true)`.
   - Verifica que en la lista de usuarios el usuario técnico **`sistema`** aparece etiquetado como **`Sistema técnico (bloqueado)`** y no tiene botón de activar/desactivar.

---

## 4. Resumen Rápido de Verificación de las 22 Reglas de Negocio (`RN-01` a `RN-22`)

| Regla | Descripción | Dónde se valida | Cómo probarla rápidamente |
| :--- | :--- | :--- | :--- |
| **RN-01** | Duración fija de bloque (110 min) y descanso (10 min) | `parametro_sistema` y `v_franja` | Consultar `GET /api/franjas`: `horaFin` se calcula automáticamente sumando 110 min |
| **RN-02** | Horas semanales de docente dentro del rango de su `tipo_contrato` | Trigger `trg_asignacion_validar` (`asignacion`) + `v_carga_docente` | Asignar sesiones hasta superar `horas_max` del contrato → `409 Conflict` |
| **RN-03** | Docente solo dicta cursos habilitados en `docente_curso` | Trigger `trg_asignacion_validar` | Asignar docente sin habilitación en el curso de la sección → `409 Conflict` |
| **RN-04** | Capacidad del espacio $\ge$ matrícula proyectada de la sección | Trigger `trg_asignacion_validar` | Asignar sección de 35 estudiantes en sala de capacidad 20 → `409 Conflict` |
| **RN-05** | Sin solapamiento de espacio en la misma versión y franja | `UNIQUE (id_version, id_espacio, id_franja)` | Asignar mismo salón en igual versión y franja → `409 Conflict` |
| **RN-06** | Sin solapamiento de docente en la misma versión y franja | `UNIQUE (id_version, id_docente, id_franja)` | Asignar mismo docente en igual versión y franja → `409 Conflict` |
| **RN-07** | Espacio debe contar con todos los recursos que exige el curso | Trigger `trg_asignacion_validar` | Asignar curso con recurso requerido en aula sin ese recurso → `409 Conflict` |
| **RN-08** | Una sección no excede la `frecuencia_semanal` de su curso | Trigger `trg_asignacion_validar` | Intentar agregar una 3ra sesión a un curso de frecuencia 2 → `409 Conflict` |
| **RN-09** | Respetar franjas `NO_DISPONIBLE` del docente en el período | Trigger `trg_asignacion_validar` | Asignar sesión en franja donde el docente registró `NO_DISPONIBLE` → `409 Conflict` |
| **RN-10** | Cupo estándar 40; sobrecupo hasta 44 exige justificación | Trigger `trg_seccion_cupo` | Crear sección con `cupoMax=43` sin justificación → `409 Conflict` |
| **RN-11** | Alerta de riesgo de cierre si matrícula $< 10$ (`CUPO_MIN_APERTURA`) | Vista `v_secciones_riesgo_cierre` (`RF-21`) | Consultar pestaña **Reportes → Secciones en riesgo de cierre** |
| **RN-12** | Ciclo de estados de versión (`EN_EDICION` $\to$ `PENDIENTE` $\to$ `AVALADO` $\to$ `SINCRONIZADO`) | Trigger `trg_version_horario_estado` | Intentar sincronizar una versión `EN_EDICION` sin avalar → `409 Conflict` |
| **RN-13** | Solo una versión `AVALADO` o `SINCRONIZADO` activa por período | Índice único parcial `ux_version_unica_avalada_periodo` | Intentar avalar una 2da versión del mismo período → `409 Conflict` |
| **RN-14** | No pasar a `PENDIENTE` si hay secciones abiertas con sesiones incompletas | Trigger `trg_version_horario_estado` | Clic en "Enviar a aprobación" cuando faltan sesiones → `409 Conflict` |
| **RN-15** | Pasar a `AVALADO` exige usuario con rol `APROBADOR` (o `ADMIN`) | Trigger `trg_version_horario_estado` + Permisos BD | Intentar `PATCH /versiones/1/avalar` con `coordinador` → `403`/`409` |
| **RN-16** | Solo se pueden insertar/modificar/eliminar asignaciones en versión `EN_EDICION` | Trigger `trg_asignacion_version_editable` | Intentar borrar o crear asignación en versión `AVALADO` → `409 Conflict` |
| **RN-17** | Alerta informativa (no bloqueante) si una sección tiene sesiones en días consecutivos | Vista `v_sesiones_dias_consecutivos` (`RF-22`) | Consultar pestaña **Reportes → Días consecutivos** |
| **RN-18** | No se eliminan catálogos con historial; se inactivan con `activo = false` | Sin endpoints `DELETE` en maestros + `ON DELETE RESTRICT` | Inactivar docente/espacio/usuario desde `PUT` con `activo: false` |
| **RN-19** | El rol `DOCENTE` solo puede registrar/eliminar su propia disponibilidad | Validación en `PlaneacionService` + UI bloqueada | Intentar modificar otro `idDocente` con token de `ana.rojas` → `403 Forbidden` |
| **RN-20** | Toda operación de escritura exige `app.id_usuario` y queda en `log_auditoria` | `DataSourceConfig` (`set_config`) + `fn_auditar_cambio()` | Consultar `GET /api/auditoria` tras cualquier cambio |
| **RN-21** | Usuarios inactivos (`activo = false`) o técnicos (`sistema`) no inician sesión | `SeguridadAuditoriaRepository.autenticarUsuario` | Probar `POST /api/auth/login` con `sistema` → `401 Unauthorized` |
| **RN-22** | Integridad de asignaciones dentro del mismo período (`id_version`, `id_seccion`) | Clave foránea compuesta en `asignacion` | Garantizado estructuralmente por el esquema DDL |

---

## 5. Ejecución de Pruebas Unitarias Automatizadas (Backend JUnit 5)

Se agregaron pruebas unitarias en:
- `source/back-end/api_horarios/src/test/java/co/edu/unbosque/apihorarios/security/SeguridadAuthUnitTests.java`

Estas pruebas verifican automáticamente:
1. Generación y validación de tokens JWT (`HS256`) para `ADMINISTRADOR` y `DOCENTE` (incluyendo `idDocente`).
2. Rechazo automático (`UnauthorizedException` / `401`) ante cualquier manipulación de la firma del token.
3. Cálculo exacto del hash SHA-256 (`8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92` para `123456`).
4. Aislamiento del contexto de seguridad por hilo (`AuthContextHolder`).

Para ejecutarlas desde terminal en `source/back-end/api_horarios`:
```powershell
.\gradlew.bat test --tests co.edu.unbosque.apihorarios.security.SeguridadAuthUnitTests
```
