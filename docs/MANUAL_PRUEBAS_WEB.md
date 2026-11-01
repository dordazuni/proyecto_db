# Manual de Pruebas Web — Sistema Integrado de Gestión de Horarios (SIGH)

**URL de la Aplicación Web:** [http://18.221.34.127](http://18.221.34.127)  
**Tecnología del Frontend:** Angular 19 (SPA con Enrutamiento Hash `/#/` y diseño Material Design 3)  
**Cobertura:** Requerimientos Funcionales (`RF-01` a `RF-25`), Requisitos No Funcionales de Usabilidad/Seguridad (`RNF-01` a `RNF-08`) y 22 Reglas de Negocio en Base de Datos (`RN-01` a `RN-22`).

---

## 1. Matriz de Credenciales y Perfiles de Acceso

El sistema implementa **Control de Acceso Basado en Roles (RBAC)** tanto en la interfaz de usuario como en PostgreSQL a través de pools dedicados. Todas las opciones no autorizadas están ocultas en la interfaz para cada rol.

| Usuario | Contraseña | Rol SIGH | Módulos Autorizados en la Web | Propósito de Prueba en la Interfaz |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `123456` | **ADMINISTRADOR** | Resumen, Catálogos, Planeación, Programación, Reportes, Seguridad | Gestión de infraestructura, usuarios, sincronización externa (`RF-17`) y auditoría. |
| `coordinador` | `123456` | **COORDINADOR** | Resumen, Catálogos, Planeación, Programación, Reportes | Creación de cursos, docentes, secciones, asignación en grilla (`RF-13`/`RF-14`) y envío a aprobación (`RF-15`). |
| `aprobador` | `123456` | **APROBADOR** | Resumen, Programación, Reportes | Revisión pedagógica de la programación; avalar o devolver versiones (`RF-16`). |
| `ana.rojas` | `123456` | **DOCENTE** (`idDocente=1`) | Resumen, Planeación (solo Disponibilidad), Reportes (Mi Horario) | Registro de disponibilidad docente propia (`RN-19`) y consulta de horario personal. |
| `sistema` | *(bloqueado)* | **SISTEMA** | Ninguno (acceso rechazado con `401`) | Usuario técnico reservado para consola; bloqueado en web (`RN-21`). |

---

## 2. Casos de Prueba: Autenticación, Sesión y Navegación

### CP-WEB-01: Protección de Rutas (`authGuard`) y Redirección
- **Objetivo:** Garantizar que usuarios no autenticados no puedan acceder al sistema.
- **Pasos:**
  1. Abrir una pestaña en modo incógnito del navegador.
  2. Ingresar directamente a la URL: `http://18.221.34.127/#/bienvenida`.
- **Resultado Esperado:** La aplicación intercepta la navegación y redirige de inmediato a `http://18.221.34.127/#/login`.

### CP-WEB-02: Monitor de Salud del Sistema (`/#/conexion`)
- **Objetivo:** Verificar el estado de la base de datos sin requerir autenticación (`RNF-08`).
- **Pasos:**
  1. En la pantalla de inicio de sesión (`/#/login`), hacer clic en el enlace inferior **"Estado de conexión BD"** (o navegar a `/#/conexion`).
- **Resultado Esperado:** 
  - La tarjeta muestra estado **`UP`** con badge verde.
  - Se confirman los parámetros de conexión: motor `PostgreSQL`, base de datos `sigh` y tiempo de respuesta en milisegundos.
  - El botón "Volver al Login" retorna correctamente.

### CP-WEB-03: Rechazo de Credenciales Inválidas y Usuario Bloqueado
- **Objetivo:** Validar la seguridad de acceso (`RF-23`, `RN-21`).
- **Pasos:**
  1. Intentar iniciar sesión con usuario `admin` y contraseña incorrecta `password999`.
  2. Intentar iniciar sesión con usuario `sistema` y contraseña `123456`.
- **Resultado Esperado:** En ambos casos aparece un aviso flotante rojo de error indicando *"401: Credenciales inválidas"* o usuario no autorizado. No se permite el acceso.

### CP-WEB-04: Persistencia de Sesión al Recargar (`F5`) y Renovación Automática
- **Objetivo:** Verificar la integridad de la SPA bajo recargas de página y renovación de token JWT.
- **Pasos:**
  1. Iniciar sesión como `admin` con contraseña `123456`.
  2. Navegar a cualquier módulo (por ejemplo, *Catálogos* o *Programación*).
  3. Presionar la tecla **F5** (o botón refrescar del navegador).
- **Resultado Esperado:** La página se recarga instantáneamente sin mostrar error `404 Not Found` de Nginx. El usuario permanece autenticado y en la misma vista seleccionada gracias a la validación de sesión en memoria contra Spring Boot.

### CP-WEB-05: Cierre de Sesión Seguro (`Logout`)
- **Objetivo:** Verificar la terminación de la sesión en frontend y backend.
- **Pasos:**
  1. En el encabezado superior derecho, hacer clic en el botón **"Cerrar Sesión"**.
- **Resultado Esperado:** 
  - Se elimina el token del almacenamiento local (`localStorage`).
  - Se notifica a Spring Boot (`POST /api/auth/logout`) para remover la sesión activa del registro en memoria.
  - La pantalla retorna a `/#/login`. Si se intenta presionar el botón "Atrás" del navegador, el `authGuard` bloquea el reingreso.

---

## 3. Casos de Prueba por Rol: Validación de Permisos y Ocultamiento de Opciones

### CP-WEB-06: Rol DOCENTE (`ana.rojas`) — Interfaz Restringida y RLS (`RN-19`)
- **Objetivo:** Comprobar que un docente solo ve lo correspondiente a su carga académica.
- **Pasos:**
  1. Iniciar sesión con `ana.rojas` / `123456`.
  2. Observar el menú lateral de navegación.
  3. Ingresar al módulo **Planeación**.
  4. Ingresar al módulo **Reportes**.
- **Resultados Esperados:**
  - **Menú Lateral:** Solo son visibles **Resumen**, **Planeación** y **Reportes**. Los módulos *Catálogos*, *Programación* y *Seguridad* están completamente ocultos.
  - **En Planeación:** La pestaña *Secciones* está oculta. Solo se visualiza la pestaña *Disponibilidad*.
  - **En Disponibilidad (`RN-19`):** El selector de docente está bloqueado y fijado exclusivamente en **#1 Ana Rojas**. Solo puede registrar o eliminar franjas de su propia disponibilidad.
  - **En Reportes:** Solo está habilitada la pestaña *RF-19 Horario*. Las pestañas de análisis institucional (*Carga Docente*, *Riesgo de Cierre* y *Alertas*) están ocultas. El horario se precarga automáticamente filtrado para ella.

### CP-WEB-07: Rol APROBADOR (`aprobador`) — Flujo de Aprobación de Horarios (`RF-16`, `RN-17`)
- **Objetivo:** Validar que el aprobador solo interviene en versiones en estado `PENDIENTE`.
- **Pasos:**
  1. Iniciar sesión con `aprobador` / `123456`.
  2. Observar el menú lateral.
  3. Ingresar al módulo **Programación**.
- **Resultados Esperados:**
  - **Menú Lateral:** Solo aparecen **Resumen**, **Programación** y **Reportes**.
  - **En Programación:**
    - El botón *RF-12 Nueva Versión* está oculto (solo lo crea el Coordinador).
    - El formulario de *Asignar Sesión* (`RF-13`) y la edición de la grilla están ocultos y bloqueados en modo solo lectura (`editable = false`).
    - En el selector de versión, seleccionar una versión en estado `PENDIENTE`.
    - Aparecen habilitados únicamente los botones: **"RF-16 Avalar Versión (Aprobador)"** y **"RF-16 Devolver a Edición"**.
    - Si se selecciona una versión en estado `EN_EDICION` o `AVALADO`, los botones de aprobación no aparecen.

### CP-WEB-08: Rol COORDINADOR (`coordinador`) — Flujo Completo de Programación
- **Objetivo:** Verificar la programación de horarios, arrastrar y soltar (Drag & Drop) y transición de estados (`RF-12` a `RF-15`).
- **Pasos:**
  1. Iniciar sesión con `coordinador` / `123456`.
  2. Ir al módulo **Programación**.
  3. Clic en **"RF-12 Nueva Versión (EN_EDICION)"**.
  4. Programar una sesión mediante el formulario *Asignar Sesión* (`RF-13`) seleccionando Sección, Docente, Espacio y Franja.
  5. En la grilla interactiva, arrastrar una tarjeta de clase asignada hacia otra franja horaria vacía (Drag & Drop — `RF-14`).
  6. Hacer clic en el botón **"RF-15 Enviar a Aprobación"**.
- **Resultados Esperados:**
  - La nueva versión se crea en estado `EN_EDICION`.
  - La sesión se inserta en la base de datos validando en tiempo real las 19 reglas duras de PostgreSQL (sin cruces).
  - Al soltar la sesión en otra franja, la interfaz actualiza la posición (`UPDATE asignacion`).
  - Al dar clic en *Enviar a Aprobación*, el chip de estado cambia inmediatamente a **`PENDIENTE`** y los controles de edición de la grilla se bloquean automáticamente (`RN-16: Versión PENDIENTE es inmutable`).
  - El botón *RF-16 Avalar Versión* **no** es visible para el Coordinador.

### CP-WEB-09: Rol ADMINISTRADOR (`admin`) — Sincronización Externa y Seguridad (`RF-17`, `RF-23`, `RF-24`)
- **Objetivo:** Verificar la sincronización final del horario y las funciones de auditoría.
- **Pasos:**
  1. Iniciar sesión con `admin` / `123456`.
  2. Ir al módulo **Programación** y seleccionar una versión en estado `AVALADO`.
  3. Ingresar un código de documento externo (ej. `DOC-EXT-2026-FINAL`) y hacer clic en **"RF-17 Sincronizar"**.
  4. Ir al módulo **Seguridad**.
  5. Revisar la pestaña **Usuarios** y la pestaña **Bitácora de Auditoría** (`RF-24`).
- **Resultados Esperados:**
  - En Programación, el estado de la versión pasa a **`SINCRONIZADO`** con su documento externo asociado.
  - En Seguridad / Usuarios: El usuario técnico `sistema` aparece con el indicador **"Sistema técnico (bloqueado)"** sin botón de desactivación.
  - En Seguridad / Bitácora: Se muestran en tiempo real las inserciones, modificaciones y eliminaciones registradas por los disparadores inmutables de PostgreSQL (`RN-18`), mostrando usuario, tabla afectada, acción y fecha/hora exacta.

---

## 4. Casos de Prueba: Validación de Reglas de Negocio en la Interfaz Web

Al intentar realizar una asignación en **Programación**, la base de datos PostgreSQL ejecuta sus disparadores (`source/db/03_triggers_funciones.sql`). El frontend captura el error y despliega un diálogo emergente claro con el código de regla violado:

| Caso | Acción en la Web | Regla Evaluada | Comportamiento Esperado en Pantalla |
| :--- | :--- | :--- | :--- |
| **CP-RN-01** | Asignar al docente `#1 Ana Rojas` en una franja donde ya tiene otra clase programada. | `RN-01: Cruce de horario docente` | Aviso rojo: *"Violación de regla RN-01: El docente ya tiene una sesión asignada en este día y franja."* La grilla no se altera. |
| **CP-RN-02** | Asignar una clase en el espacio `#1 Salón 101` cuando ya está ocupado en esa franja. | `RN-02: Cruce de espacio físico` | Aviso rojo: *"Violación de regla RN-02: El espacio físico ya se encuentra ocupado en esta franja horaria."* |
| **CP-RN-03** | Asignar dos sesiones de la misma sección en la misma franja. | `RN-03: Cruce de sección` | Aviso rojo: *"Violación de regla RN-03: La sección ya tiene clase en este horario."* |
| **CP-RN-04** | Asignar la sección `#1` (cupo proyectado 30) al espacio `#2 Laboratorio Redes` (capacidad 20). | `RN-04: Capacidad y Aforo` | Aviso de error de regla de aforo: el cupo de la sección supera la capacidad máxima del espacio físico. |
| **CP-RN-05** | Intentar asignar una sesión a un docente que ya completó las horas máximas de su contrato. | `RN-05: Límite máximo de contrato` | Aviso rojo: *"Violación de regla RN-05: Se supera el tope de horas semanales permitidas por su tipo de contrato."* |
| **CP-RN-12** | Asignar al docente `#1` a un curso que no tiene registrado en la tabla de habilitación (`docente_curso`). | `RN-12: Habilitación docente` | Aviso de error: *"Violación de regla RN-12: El docente no está habilitado para dictar este curso."* |
| **CP-RN-13** | Asignar al docente en una franja donde registró `NO_DISPONIBLE` en el módulo de disponibilidad. | `RN-13: Disponibilidad docente` | Aviso de error: *"Violación de regla RN-13: El docente marcó esta franja horaria como no disponible."* |
| **CP-RN-16** | Intentar mover o eliminar una sesión en una versión en estado `AVALADO` o `SINCRONIZADO`. | `RN-16: Inmutabilidad de versión` | La interfaz desactiva los controles de arrastre y borrado. Si se fuerza la petición, el backend responde con error de inmutabilidad. |

---

## 5. Casos de Prueba: Módulo de Reportes Institucionales

Con el usuario `coordinador` o `admin`, ingresar al módulo **Reportes**:

### CP-REP-01: Horario Multicriterio (`RF-19`)
- **Pasos:** Seleccionar una versión de horario y filtrar sucesivamente por: *Docente*, luego por *Espacio Físico* y luego por *Sección*.
- **Resultado:** La grilla semanal y la tabla inferior se recalculan al instante reflejando únicamente las sesiones que coinciden con los filtros aplicados.

### CP-REP-02: Carga Docente vs Contrato (`RF-20`, `RN-05`, `RN-22`)
- **Pasos:** Hacer clic en la pestaña **"RF-20 Carga Docente"**. Utilizar el filtro de estado de carga para seleccionar `BAJO_MINIMO`.
- **Resultado:** Se listan los docentes que no alcanzan el mínimo de horas de su contrato con chip amarillo de alerta pedagógica (`RN-22`). Aquellos en rango aparecen con chip verde.

### CP-REP-03: Secciones en Riesgo de Cierre (`RF-21`, `RN-21`)
- **Pasos:** Hacer clic en la pestaña **"RF-21 Secciones en Riesgo de Cierre"**.
- **Resultado:** Se presentan aquellas secciones cuya matrícula real es inferior al parámetro `P-03 (Cupo Mínimo)`. El rol `coordinador` tiene visible el botón rojo **"Cerrar Sección (RF-10)"** para dar de baja la sección si la matrícula no es viable.

### CP-REP-04: Sesiones Faltantes y Días Consecutivos (`RF-22`, `RN-09`, `RN-20`)
- **Pasos:** Hacer clic en la pestaña **"RF-22 Sesiones Faltantes y Días Consecutivos"**.
- **Resultado:**
  - **Tabla 1:** Muestra qué secciones tienen menos sesiones programadas que la frecuencia semanal requerida por su plan de estudios (`RN-09`).
  - **Tabla 2:** Alerta pedagógica de cursos que tienen sesiones programadas en días continuos (ej. Lunes y Martes) para evitar sobrecarga del estudiante (`RN-20`).

---

## 6. Lista de Chequeo Final de Entrega (Checklist de Sustentación)

- [ ] **Acceso Web:** `http://18.221.34.127/` abre la pantalla de inicio de sesión sin errores de consola.
- [ ] **Rutas Directas:** La URL directa `http://18.221.34.127/#/conexion` responde con estado `UP`.
- [ ] **Aislamiento por Rol:** Cada usuario (`admin`, `coordinador`, `aprobador`, `ana.rojas`) ve únicamente sus módulos correspondientes.
- [ ] **Reglas de Negocio en Vivo:** Al provocar un cruce de horario en la grilla, la aplicación muestra la alerta correspondiente (`RN-01` a `RN-16`) sin congelar la pantalla.
- [ ] **Auditoría Activa:** Toda acción de asignación o cambio de estado de versión queda registrada de forma visible e inmutable en el módulo de Seguridad.
