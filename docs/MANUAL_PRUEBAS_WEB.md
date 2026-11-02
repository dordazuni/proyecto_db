# Manual de Pruebas Web — Sistema Integrado de Gestión de Horarios (SIGH)

**URL de la aplicación web:** [http://18.221.34.127](http://18.221.34.127)  
**Frontend:** Angular 21 (SPA con enrutamiento hash `/#/`, componentes standalone y Signals)  
**Cobertura:** requisitos funcionales `RF-01` a `RF-25` (excepto `RF-18`, no implementado en esta entrega), requisitos no funcionales de seguridad y usabilidad, y las 22 reglas de negocio `RN-01` a `RN-22` (19 duras y 3 blandas).

> **Importante antes de probar:** las pruebas que crean, modifican o eliminan datos escriben en la base de la entrega. Antes de la sustentación hay que recargar los scripts `01` a `06` y ejecutar `07` (ver [`source/db/README.MD`](../source/db/README.MD)).

---

## 1. Usuarios de prueba y módulos por rol

El control de acceso se aplica dos veces: la interfaz oculta lo que el rol no puede usar y PostgreSQL rechaza lo que el rol no tiene permitido (cuatro pools de conexión, uno por rol, script `05`).

| Usuario | Contraseña | Rol | Módulos visibles | Qué se prueba |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `123456` | **ADMINISTRADOR** | Inicio, Catálogos, Planeación, Programación, Reportes, Seguridad | Períodos, recursos, dotación de espacios y parámetros (CU-01); matrícula real (CU-03); sincronización documental (`RF-17`, CU-04); usuarios y bitácora (CU-02) |
| `coordinador` | `123456` | **COORDINADOR** | Inicio, Catálogos, Planeación, Programación, Reportes | Cursos, recursos requeridos y habilitación docente (CU-05); secciones y cierres (CU-06); versiones, asignación en grilla y envío a aprobación (CU-07) |
| `aprobador` | `123456` | **APROBADOR** | Inicio, Programación, Reportes | Avalar o devolver versiones pendientes (`RF-16`, CU-10) |
| `ana.rojas` | `123456` | **DOCENTE** (vinculada al docente Ana Rojas) | Inicio, Planeación (solo disponibilidad), Reportes (solo su horario) | Su propia disponibilidad (`RF-11`, `RN-19`, CU-09) y su horario publicado (`RF-19`, CU-11) |

También existen los docentes `carlos.mendez` y `andres.torres` (misma contraseña), útiles para comprobar que cada docente ve solo lo suyo. El usuario técnico `sistema` no puede iniciar sesión: su contraseña guardada (`'!'`) no es un hash válido; existe solo para firmar en la bitácora los cambios hechos por script.

> La contraseña `123456` es temporal: el script `06` guarda un marcador y el backend aún no genera el hash definitivo (`RNF-04`).

Los docentes y los espacios son de solo lectura en la aplicación (`RN-19`): se cargan desde los sistemas fuente con el script `06`.

---

## 2. Autenticación, sesión y navegación

### CP-WEB-01: Protección de rutas (`authGuard`)
- **Pasos:** abrir una ventana de incógnito y entrar a `http://18.221.34.127/#/bienvenida`.
- **Resultado esperado:** la aplicación redirige a `/#/login`. Lo mismo ocurre si en el navegador queda un usuario guardado pero no un token.

### CP-WEB-02: Verificación de conexión al entrar
- **Pasos:** abrir `http://18.221.34.127/`.
- **Resultado esperado:** la pantalla inicial comprueba la conexión con la API y la base de datos (`GET /api/echo`) y luego lleva al login (o a la bienvenida, si ya hay sesión). En `http://18.221.34.127/api/echo` se ve el JSON con `"databaseConnected": true`.

### CP-WEB-03: Credenciales inválidas
- **Pasos:** iniciar sesión con `admin` y la contraseña `password999`; luego con `sistema` y `123456`.
- **Resultado esperado:** en ambos casos aparece el recuadro rojo "Error de Autenticación" con el mensaje de credenciales inválidas y no se entra. El login no muestra contraseñas de ejemplo.

### CP-WEB-04: Recarga de la página (`F5`)
- **Pasos:** iniciar sesión como `admin`, abrir **Programación**, cambiar el período a `2027-1` y presionar **F5**.
- **Resultado esperado:** no aparece `404` de Nginx; la sesión sigue activa (el token se valida con `GET /api/auth/me`) y se conservan el módulo y el período. La vista se guarda por pestaña: una pestaña nueva empieza en **Inicio**.

### CP-WEB-05: Cierre de sesión
- **Pasos:** hacer clic en **Cerrar Sesión** y luego en el botón **Atrás** del navegador.
- **Resultado esperado:** se borra el token del navegador, se avisa al backend (`POST /api/auth/logout`) y se limpian todos los datos en pantalla. Al volver atrás, el `authGuard` lleva otra vez al login. Si luego entra otro usuario, empieza en **Inicio** sin ver nada del anterior.

---

## 3. Pruebas por rol

### CP-WEB-06: DOCENTE (`ana.rojas`) — disponibilidad propia y horario publicado
- **Pasos:** entrar con `ana.rojas`, revisar el menú, abrir **Planeación** y después **Reportes** con los períodos `2026-2` y `2027-1`.
- **Resultados esperados:**
  - **Menú:** solo **Inicio**, **Planeación** y **Reportes**.
  - **Planeación:** solo la pestaña de disponibilidad, fija en Ana Rojas. Cada clic en una franja alterna entre `DISPONIBLE` y `NO DISPONIBLE` y se guarda en la base (seguridad por fila, `RN-19`). Al cambiar de período se carga la disponibilidad de ese período.
  - **Reportes:** solo la pestaña de horario. Se muestra únicamente la **última versión avalada o sincronizada** del período, con un recuadro verde que indica cuál es (en `2026-2`: v1 SINCRONIZADO). En `2027-1`, que solo tiene una versión en edición, aparece el aviso amarillo "aún no tiene un horario avalado ni sincronizado".

### CP-WEB-07: APROBADOR (`aprobador`) — aval de versiones (`RF-16`, `RN-17`)
- **Pasos:** entrar con `aprobador` y abrir **Programación**.
- **Resultados esperados:**
  - **Menú:** solo **Inicio**, **Programación** y **Reportes**.
  - No aparecen el botón *Nueva Versión* ni el formulario *Asignar Sesión*; la grilla es de solo lectura.
  - Con una versión `PENDIENTE` seleccionada aparecen solo **Avalar Versión** y **Devolver a Edición**. Con versiones en otros estados no aparecen.

### CP-WEB-08: COORDINADOR (`coordinador`) — planeación y programación
- **Pasos:**
  1. En **Planeación**, abrir una sección nueva y registrar su matrícula real.
  2. En **Programación**, crear una versión (**Nueva Versión**), asignar una sesión eligiendo sección, docente, espacio y franja, arrastrar una sesión a otra franja y eliminar otra.
  3. Hacer clic en **Enviar a Aprobación**.
- **Resultados esperados:**
  - El campo de matrícula real está vacío si la sección no tiene dato; si se guarda vacío aparece un aviso y no se envía nada. Cerrar una sección pide confirmación y no hay opción de reabrirla (`RF-10`).
  - El formulario de asignación ofrece solo secciones **abiertas** (`RN-11`).
  - Cada asignación pasa por las reglas duras en la base (`RN-01` a `RN-09` y `RN-11` a `RN-16`); si alguna falla, aparece un aviso rojo con el código de la regla y la grilla no cambia.
  - Eliminar una sesión pide confirmación.
  - Al enviar a aprobación, la versión pasa a `PENDIENTE` y la grilla queda bloqueada (`RN-16`). El coordinador no ve los botones de aval.
  - Si la base rechaza un formulario (por ejemplo, un curso con código repetido), los datos escritos se conservan para corregirlos.

### CP-WEB-09: ADMINISTRADOR (`admin`) — sincronización, usuarios y bitácora
- **Pasos:**
  1. En **Programación**, seleccionar una versión `AVALADO`, escribir el identificador del documento externo y hacer clic en **Sincronizar**.
  2. En **Seguridad**, revisar **Usuarios** y **Bitácora**.
- **Resultados esperados:**
  - La versión pasa a `SINCRONIZADO` con su documento externo. Sin identificador aparece un aviso y no se envía nada (`RN-17`).
  - **Usuarios:** el rol empieza sin elegir; el campo de docente aparece solo con el rol `DOCENTE`, es obligatorio y lista solo docentes sin usuario (`S-09`). El usuario `sistema` aparece como "Sistema técnico (bloqueado)" y el usuario en sesión como "Tu usuario (no se desactiva)". Desactivar a otro usuario pide confirmación.
  - **Bitácora (`RF-24`, `RN-18`):** muestra los cambios en `asignacion` y `version_horario` con usuario, acción, tabla y fecha. Se puede filtrar por esas dos tablas, por acción y por usuario.

---

## 4. Reglas de negocio en la interfaz

Al asignar o mover una sesión en **Programación**, la base de datos valida las reglas con restricciones y disparadores (`source/db/01_ddl.sql` y `source/db/03_funciones_triggers.sql`). La interfaz muestra un aviso rojo con el código de la regla en el título y un mensaje legible.

| Caso | Acción en la web | Regla | Aviso esperado |
| :--- | :--- | :--- | :--- |
| **CP-RN-01** | Asignar a un docente en una franja donde ya tiene sesión en la misma versión | `RN-01` | "El docente ya tiene otra sesión en esa franja de esta versión." |
| **CP-RN-02** | Asignar un espacio ya ocupado en esa franja | `RN-02` | "El espacio ya está ocupado en esa franja de esta versión." |
| **CP-RN-03** | Asignar dos sesiones de la misma sección en la misma franja | `RN-03` | "La sección ya tiene otra sesión en esa franja de esta versión." |
| **CP-RN-04** | Asignar una sección cuya matrícula supera la capacidad del espacio | `RN-04` | "La matrícula de la sección (…) supera la capacidad del espacio …" |
| **CP-RN-05** | Asignar a un docente que ya llegó a las horas máximas de su contrato | `RN-05` | "El docente … pasaría a … horas y su contrato permite …" |
| **CP-RN-09** | Agregar a una sección más sesiones que la frecuencia semanal de su curso | `RN-09` | "La sección … ya tiene … sesiones y su curso tiene frecuencia …" |
| **CP-RN-12** | Asignar a un docente no habilitado para el curso | `RN-12` | "El docente … no está habilitado para dictar el curso …" |
| **CP-RN-13** | Asignar a un docente en una franja que marcó como no disponible | `RN-13` | "El docente … no está disponible en la franja …" |
| **CP-RN-14** | Asignar un curso a un espacio sin los recursos que requiere | `RN-14` | "El espacio … no ofrece todos los recursos que requiere el curso …" |
| **CP-RN-16** | Intentar cambiar una versión que no está `EN_EDICION` | `RN-16` | La grilla bloquea arrastrar y borrar; si se fuerza por la API, la base responde "la versión … está …; sus asignaciones no se modifican ni se borran". |

Las franjas ya cumplen `RN-06` a `RN-08` por construcción: en la grilla, la zona muerta de 12:00 a 13:00 cubre solo de lunes a viernes, las celdas de las 11:00 de lunes a viernes indican que cruzarían esa zona (`RN-06`) y las del sábado por la tarde quedan fuera de la ventana operativa (`RN-07`).

---

## 5. Reportes (`coordinador` o `admin`)

### CP-REP-01: Horario por docente, espacio y sección (`RF-19`)
- **Pasos:** elegir una versión y filtrar por docente, por espacio y por sección.
- **Resultado:** la grilla y la tabla muestran solo las sesiones que cumplen el filtro. Al cambiar de período o de versión los filtros se limpian. Si el período no tiene versiones, aparece un aviso y los reportes quedan vacíos.

### CP-REP-02: Carga docente frente al contrato (`RF-20`, `RN-05`, `RN-22`)
- **Pasos:** abrir **RF-20 Carga Docente** y filtrar por estado.
- **Resultado:** los estados son `BAJO_MINIMO` (chip amarillo, regla blanda `RN-22`), `EN_RANGO` (verde) y `SOBRE_MAXIMO` (rojo; no debería aparecer nunca porque `RN-05` lo impide).

### CP-REP-03: Secciones en riesgo de cierre (`RF-21`, `RN-21`)
- **Pasos:** abrir **RF-21 Secciones en Riesgo de Cierre**.
- **Resultado:** se listan las secciones con matrícula real menor que el cupo mínimo (`P-03`). El coordinador ve el botón **Cerrar Sección**, que pide confirmación.

### CP-REP-04: Sesiones faltantes y días consecutivos (`RF-22`, `RN-09`, `RN-20`)
- **Pasos:** abrir **RF-22 Sesiones Faltantes y Días Consecutivos**.
- **Resultado:** la primera tabla muestra las secciones con menos sesiones que la frecuencia de su curso; la segunda, los cursos con sesiones en días seguidos (regla blanda `RN-20`).

---

## 6. Lista de chequeo para la sustentación

- [ ] Se recargaron los scripts `01` a `06` y se ejecutó `07` sin errores.
- [ ] `http://18.221.34.127/` abre la aplicación sin errores en la consola del navegador.
- [ ] `http://18.221.34.127/api/echo` responde `"databaseConnected": true`.
- [ ] Cada usuario (`admin`, `coordinador`, `aprobador`, `ana.rojas`) ve solo sus módulos.
- [ ] Al provocar un cruce en la grilla aparece el aviso con su regla (`RN-01` a `RN-16`) sin congelar la pantalla.
- [ ] Toda asignación y todo cambio de estado de versión aparecen en la bitácora de **Seguridad**.
