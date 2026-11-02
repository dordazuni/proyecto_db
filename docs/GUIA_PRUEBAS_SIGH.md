# Guía Completa de Pruebas Web, API (Apidog) y Reglas de Negocio — SIGH

Esta guía permite verificar extremo a extremo el **Sistema Integrado de Gestión de Horarios (SIGH)** desplegado en `http://18.221.34.127`, validando los requisitos funcionales (`RF-01` a `RF-25`, excepto `RF-18`, que no se implementa en esta entrega), los requisitos no funcionales de seguridad y las 22 reglas de negocio (`RN-01` a `RN-22`) del documento *Requisitos y reglas de negocio*.

La guía paso a paso de la interfaz está en [`MANUAL_PRUEBAS_WEB.md`](MANUAL_PRUEBAS_WEB.md); esta guía se centra en la API y en cómo comprobar cada regla.

> Las pruebas que escriben datos modifican la base de la entrega. Antes de la sustentación hay que recargar los scripts `01` a `06` y ejecutar `07`.

---

## 1. Colección Apidog / Postman Actualizada

El archivo JSON actualizado se encuentra en:
- `docs/api/SIGH_API_Horarios.postman_collection.json`

### ¿Qué ajustes incluye esta nueva versión del JSON?
1. **Autenticación JWT Automática (`Bearer {{token}}`)**:
   - En la carpeta **`00. Salud y Autenticación JWT (Echo & Login)`** tienes peticiones listas para iniciar sesión con cada uno de los 4 roles (`admin`, `coordinador`, `aprobador`, `ana.rojas`) más un caso de rechazo `401` (`sistema`, cuya contraseña guardada no es un hash válido).
   - Cada petición de Login incluye un **script de post-respuesta (`test`)** que guarda automáticamente el `token` JWT devuelto por el servidor en la variable de colección `{{token}}`.
   - Todos los endpoints de las carpetas `01` a `05` envían automáticamente el encabezado `Authorization: Bearer {{token}}`.
2. **Eliminación de encabezados y campos obsoletos**:
   - Se eliminó por completo el antiguo encabezado `X-Usuario-Id` y el campo manual `idUsuario` de los cuerpos JSON en `/disponibilidad`, `/versiones` y `/asignaciones`. Ahora el backend extrae la identidad real del usuario directamente del token JWT firmado y la inyecta en PostgreSQL mediante `SELECT set_config('app.id_usuario', '<id>', true)`.
3. **Endpoints de sesión y token**:
   - `GET /auth/me`: Recuperación de la sesión activa a partir del token Bearer.
   - `POST /auth/refresh`: Renovación de sesión con cabecera Bearer, cuerpo vacío `{}` y ventana de gracia.
   - `POST /auth/logout`: Cierre de sesión y revocación en el registro de sesiones.
   - `GET /auth/sessions`: Consulta de sesiones activas (exclusivo para `ADMINISTRADOR`, sin exponer tokens).
4. **Ingesta de Sistemas Fuente (CU-03 / RN-19)**:
   - `POST /integracion/docentes`: Ingesta segura de docentes desde Talento Humano.
   - `POST /integracion/espacios`: Ingesta segura de aulas y laboratorios desde Planta Física.


### Cómo importarlo en Apidog:
1. Abre tu proyecto en **Apidog** → **Settings (Configuración)** → **Import Data (Importar datos)**.
2. Selecciona **Postman** y sube el archivo `docs/api/SIGH_API_Horarios.postman_collection.json`.
3. Ve a la carpeta **`00. Salud y Autenticación JWT`**, ejecuta **`POST /auth/login - Iniciar sesión como ADMINISTRADOR (admin)`** y luego prueba cualquier endpoint de las carpetas `01` a `05`.

---

## 2. Usuarios de prueba y permisos por rol (`RF-23`, `RF-25`, `RNF-04`)

Los usuarios los crea el script `06` con la contraseña de prueba **`123456`** almacenada como hash criptográfico SHA-256 (`8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92`, RNF-04). El usuario técnico `sistema` (script `02`, decisión F7) tiene la contraseña `'!'`, que no es un hash válido, así que no puede iniciar sesión: solo firma en la bitácora los cambios hechos por script.

| Usuario | Rol | Pool PostgreSQL | Módulos en la web | Qué puede escribir en la base (script `05`) |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `ADMINISTRADOR` | `app_administrador` | Inicio, Catálogos, Planeación, Programación, Reportes, Seguridad | Períodos, franjas y recursos; dotación de espacios; valor de los parámetros; usuarios; solo la columna `matricula_real` de secciones; pasar una versión de `AVALADO` a `SINCRONIZADO`. No lee `disponibilidad` (dato personal) |
| `coordinador` | `COORDINADOR` | `app_coordinador` | Inicio, Catálogos, Planeación, Programación, Reportes | Cursos, recursos requeridos y habilitaciones; secciones (único rol que escribe cupos y justificación de sobrecupo); versiones nuevas y envío a aprobación; asignaciones. Lee la disponibilidad de todos |
| `aprobador` | `APROBADOR` | `app_aprobador` | Inicio, Programación, Reportes | Solo el estado de la versión: avalar o devolver una versión `PENDIENTE` |
| `ana.rojas` | `DOCENTE` (Ana Rojas) | `app_docente` | Inicio, Planeación (disponibilidad), Reportes (su horario) | Solo su propia disponibilidad (seguridad por fila). Lee las vistas `v_horario`, `v_franja`, `v_curso` y los períodos |

`carlos.mendez` y `andres.torres` son otros dos docentes con usuario. Docentes y espacios son de solo lectura para todos los roles de la aplicación (`RN-19`): vienen de los sistemas fuente.

---

## 3. Pruebas por rol (web y API)

### Flujo A: Rutas, conexión y login (`RF-23`)
1. **Sin sesión:** en incógnito, abrir `http://18.221.34.127/#/bienvenida`. **Esperado:** redirige a `/#/login`.
2. **Conexión:** abrir `http://18.221.34.127/api/echo`. **Esperado:** JSON con `"databaseConnected": true`.
3. **Credenciales inválidas:** `admin` / `clave_erronea` o `sistema` / `123456`. **Esperado:** `401` y aviso rojo de credenciales inválidas.
4. **Recarga (`F5`):** con sesión iniciada, recargar en cualquier módulo. **Esperado:** el token se valida con `GET /api/auth/me` y se conservan el módulo y el período.

### Flujo B: DOCENTE (`ana.rojas`) — `RF-11`, `RF-19`, `RN-19`
1. En la web solo aparecen Inicio, Planeación y Reportes.
2. En Planeación, alternar una franja entre `DISPONIBLE` y `NO DISPONIBLE`. **Esperado:** se guarda con el pool `app_docente`.
3. En Reportes se ve solo la última versión **avalada o sincronizada** del período; si no hay ninguna, un aviso.
4. **API:** con el token de `ana.rojas`, ejecutar `POST /disponibilidad` con `"idDocente": 2`. **Esperado:** `403`, porque la política de seguridad por fila de `disponibilidad` solo deja escribir filas del propio docente.
5. **API:** con el mismo token, `GET /usuarios` o `POST /periodos`. **Esperado:** `403` (`permission denied` desde PostgreSQL).

### Flujo C: COORDINADOR (`coordinador`) — `RF-05`, `RF-06`, `RF-09` a `RF-15`
1. **Catálogos:** crear un curso, agregarle un recurso requerido y habilitar un docente. Los períodos, recursos, espacios, docentes y parámetros se ven pero no se editan; por API, modificar un parámetro responde `403`.
2. **Sobrecupo (`RN-10`):** abrir una sección con `cupoMax = 42` sin justificación. **Esperado:** rechazo "un cupo máximo de 42 supera el estándar (40) y exige justificación". Con justificación se crea. Con `cupoMax = 45` se rechaza siempre: supera el estándar más la tolerancia (44).
3. **Programación:** crear una versión (`EN_EDICION`) y asignar sesiones. Para provocar cada regla de asignación, ver la tabla de la sección 4. El coordinador no ve los botones de avalar ni devolver.
4. **Enviar a aprobación (`RF-15`):** **Esperado:** la versión pasa a `PENDIENTE` y sus asignaciones quedan bloqueadas (`RN-16`).

### Flujo D: APROBADOR (`aprobador`) — `RF-16`, `RN-17`
1. En Programación no aparecen el formulario de asignación ni el botón de nueva versión.
2. Con una versión `PENDIENTE`, hacer clic en **Avalar**. **Esperado:** pasa a `AVALADO` y queda registrado quién la avaló y cuándo. **Devolver** la regresa a `EN_EDICION`.
3. **API:** intentar `PATCH /versiones/{id}/avalar` con el token de `coordinador` o de `admin`. **Esperado:** rechazo `RN-17`: "solo un usuario con rol APROBADOR avala o devuelve una versión".

### Flujo E: ADMINISTRADOR (`admin`) — `RF-17`, `RF-23`, `RF-24`
1. **Sincronizar (`RF-17`):** con una versión `AVALADO`, escribir el identificador del documento externo y sincronizar. **Esperado:** pasa a `SINCRONIZADO`.
2. **Usuarios (`RF-23`, `S-09`):** el vínculo con un docente solo aparece y es obligatorio con el rol `DOCENTE`, y solo lista docentes sin usuario (la base exige la relación 1:1 con `uq_usuario_docente`).
3. **Bitácora (`RF-24`, `RN-18`):** cada `INSERT`, `UPDATE` o `DELETE` en `asignacion` y cada cambio de `version_horario` muestra el usuario real que lo hizo, gracias a `set_config('app.id_usuario', …, true)`. Ningún rol de la aplicación puede modificar ni borrar la bitácora.

---

## 4. Las 22 reglas de negocio y cómo probarlas

Numeración del documento *Requisitos y reglas de negocio*. Las reglas duras las garantiza la base de datos; las blandas (`RN-20` a `RN-22`) solo se reportan.

| Regla | Tipo | Qué exige | Dónde se garantiza | Cómo probarla |
| :--- | :--- | :--- | :--- | :--- |
| **RN-01** | Dura | Un docente no tiene dos sesiones en la misma franja de una versión | `UNIQUE` `uq_asig_rn01_docente_franja` | Asignar el mismo docente dos veces en la misma franja → `409` |
| **RN-02** | Dura | Un espacio no tiene dos sesiones en la misma franja de una versión | `UNIQUE` `uq_asig_rn02_espacio_franja` | Asignar el mismo espacio dos veces en la misma franja → `409` |
| **RN-03** | Dura | Una sección no tiene dos sesiones en la misma franja de una versión | `UNIQUE` `uq_asig_rn03_seccion_franja` | Asignar la misma sección dos veces en la misma franja → `409` |
| **RN-04** | Dura | La matrícula de referencia de la sección no supera la capacidad del espacio | Disparador `trg_asignacion_validar` | Asignar una sección grande a un espacio pequeño → `422` |
| **RN-05** | Dura | Las horas del docente en la versión no superan el máximo de su contrato | Disparador `trg_asignacion_validar` (con bloqueo de fila) | Asignar sesiones hasta pasar `horas_max` → `422` |
| **RN-06** | Dura | Ninguna sesión entre 12:00 y 13:00 de lunes a viernes | `CHECK` en `franja` | Las franjas que la violarían no existen; en la grilla se marcan como zona muerta |
| **RN-07** | Dura | Ventana operativa: L–V de 07:00 a 22:00, sábado de 07:00 a 13:00 | `CHECK` en `franja` | `GET /api/franjas` devuelve solo las 33 franjas válidas |
| **RN-08** | Dura | Cada sesión dura 2 horas y usa una franja del catálogo | FK de `asignacion` a `franja` y `CHECK` | Asignar con un `idFranja` inexistente → rechazo por llave foránea |
| **RN-09** | Dura | Frecuencia del curso entre 1 y `P-04`; una sección no recibe más sesiones que esa frecuencia | `CHECK` en `curso` y disparadores de `curso` y `asignacion` | Agregar una 3.ª sesión a una sección de un curso de frecuencia 2 → `422` |
| **RN-10** | Dura | Cupo máximo entre el mínimo y 44; más de 40 exige justificación (solo el Coordinador) | `CHECK` y disparador en `seccion`; permiso por columna | Sección con `cupoMax = 42` sin justificación → `422` |
| **RN-11** | Dura | Una sección cerrada no recibe asignaciones | Disparador `trg_asignacion_validar` | Por API, asignar una sección `CERRADA` → `422` (la web no la ofrece) |
| **RN-12** | Dura | El docente debe estar habilitado para el curso | Disparador `trg_asignacion_validar` | Asignar un docente sin fila en `docente_curso` → `422` |
| **RN-13** | Dura | No se asigna a un docente en una franja que marcó como no disponible | Disparador `trg_asignacion_validar` | Marcar la franja como `NO_DISPONIBLE` y asignar ahí → `422` |
| **RN-14** | Dura | El espacio ofrece todos los recursos que requiere el curso | Disparador `trg_asignacion_validar` (división relacional) | Asignar un curso que exige un recurso a un espacio sin él → `422` |
| **RN-15** | Dura | La sección y la versión pertenecen al mismo período | Disparador `trg_asignacion_validar` | Por API, asignar una sección de otro período → `422` |
| **RN-16** | Dura | Las asignaciones de una versión que no está `EN_EDICION` no cambian | Disparador `trg_asignacion_validar` | Por API, borrar una asignación de una versión `AVALADO` → `409` |
| **RN-17** | Dura | Estados `EN_EDICION → PENDIENTE → AVALADO → SINCRONIZADO` (y `PENDIENTE → EN_EDICION`); avalar o devolver exige rol Aprobador; sincronizar exige el identificador documental | `CHECK` y disparador `trg_version_validar` | Sincronizar una versión `EN_EDICION` → `409` |
| **RN-18** | Dura | La bitácora solo admite inserciones | Permisos (`REVOKE`) en el script `05` | Ningún rol de la aplicación puede ejecutar `UPDATE` o `DELETE` sobre `log_auditoria` |
| **RN-19** | Dura | Cada docente ve y modifica solo su disponibilidad; docentes y espacios son de solo lectura | Seguridad por fila en `disponibilidad` y permisos | Flujo B, paso 4 → `403` |
| **RN-20** | Blanda | Un curso con 2 o 3 sesiones semanales no debería tenerlas en días consecutivos | Vista `v_sesiones_dias_consecutivos` (`RF-22`) | **Reportes → Días consecutivos** |
| **RN-21** | Blanda | Una sección con matrícula real menor que `P-03` debería cerrarse; lo decide el Coordinador | Vista `v_secciones_riesgo_cierre` (`RF-21`) | **Reportes → Secciones en riesgo de cierre** |
| **RN-22** | Blanda | Cada docente debería alcanzar las horas mínimas de su contrato | Vista `v_carga_docente` (`RF-20`, estado `BAJO_MINIMO`) | **Reportes → Carga docente**, filtro `BAJO_MINIMO` |

---

## 5. Pruebas unitarias del backend (JUnit 5)

Archivo: `source/back-end/api_horarios/src/test/java/co/edu/unbosque/apihorarios/security/SeguridadAuthUnitTests.java`

Las cuatro pruebas verifican:
1. Que se genera y valida un token para un `ADMINISTRADOR` (estructura `header.payload.signature`, id, usuario y rol).
2. Que el token de un `DOCENTE` conserva su `idDocente`.
3. Que un token con la firma alterada se rechaza (`UnauthorizedException`, `401`).
4. Que el usuario en sesión se guarda por hilo (`AuthContextHolder`) y se limpia al terminar.

Para ejecutarlas desde `source/back-end/api_horarios`:
```powershell
.\gradlew.bat test --tests co.edu.unbosque.apihorarios.security.SeguridadAuthUnitTests
```
