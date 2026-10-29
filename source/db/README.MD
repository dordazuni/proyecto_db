# SIGH — Scripts de base de datos (capa física)

Base de datos PostgreSQL del SIGH (Sistema Integrado de Gestión de Horarios). Las reglas de negocio las hace cumplir la base de datos, no la aplicación (RNF-01): cada script cita la regla (RN, RF o RNF) que cumple cada restricción, trigger o permiso.

## Requisitos

- PostgreSQL 18.6 (probado también en 16) con `psql`.
- Acceso como superusuario (`postgres`) para crear la base y los roles.
- Codificación UTF8.

## Orden de ejecución

Ejecutar desde esta carpeta, en este orden, sobre una instalación limpia (RNF-09):

| # | Script | Qué hace | Comando |
|---|---|---|---|
| 1 | `01_ddl.sql` | Crea la base `sigh` y las 20 tablas con PK, FK, UNIQUE y CHECK | `psql -U postgres -f 01_ddl.sql` |
| 2 | `02_catalogos.sql` | 33 franjas, 4 tipos de contrato, 4 parámetros, 4 roles, recursos y el usuario técnico `sistema` | `psql -U postgres -d sigh -f 02_catalogos.sql` |
| 3 | `03_funciones_triggers.sql` | Reglas que comparan tablas o leen parámetros: 6 triggers | `psql -U postgres -d sigh -f 03_funciones_triggers.sql` |
| 4 | `04_vistas.sql` | 7 vistas: atributos derivados, horario y reportes | `psql -U postgres -d sigh -f 04_vistas.sql` |
| 5 | `05_roles_permisos.sql` | Dueño `sigh_owner`, 4 roles, 4 usuarios de conexión, permisos y seguridad por fila | `psql -U postgres -d sigh -v app_password='<contraseña>' -f 05_roles_permisos.sql` |
| 6 | `06_datos_prueba.sql` | Datos ficticios: 2 períodos, 8 docentes, 7 espacios, 7 cursos, 13 secciones, 23 sesiones y una versión ya avalada y sincronizada | `psql -U postgres -d sigh -f 06_datos_prueba.sql` |
| 7 | `07_pruebas_reglas.sql` | 41 pruebas: un intento inválido por regla, más casos válidos de control; no cambia ningún dato | `psql -U postgres -d sigh -f 07_pruebas_reglas.sql` |

Cada script termina con una consulta de verificación. Salida esperada:

- **01:** `tablas_creadas = 20`.
- **02:** 33 franjas (6 por día de lunes a viernes, 3 el sábado), 4 contratos, 4 parámetros, 4 roles, 4 recursos, 1 usuario.
- **03:** 6 triggers: 2 en `asignacion`, 2 en `version_horario`, 1 en `seccion`, 1 en `curso`.
- **04:** 7 vistas y franjas con `hora_fin` = `hora_inicio` + 2 h.
- **05:** la lista de permisos de escritura por rol.
- **06:** 23 asignaciones, la versión de 2026-2 SINCRONIZADO (avalada por `aprobador`) y la de 2027-1 EN_EDICION, y la carga de cada docente.
- **07:** una tabla de 41 pruebas y el resumen `41 | 41 | 0` (pruebas, correctas, fallidas). Cualquier fila con `ok = f` es un error.

Los scripts usan `\set ON_ERROR_STOP on`: si algo falla, se detienen en el primer error.

## Reiniciar la base

`01_ddl.sql` borra la base `sigh` si existe y la crea de nuevo. Para empezar de cero, se vuelven a ejecutar los scripts desde el 01. Los roles del 05 son del servidor y no se borran; el 05 los reutiliza.

## Notas sobre los scripts 06 y 07

1. **El 06 se ejecuta una sola vez sobre una base recién creada.** Si se repite, las UNIQUE lo rechazan y no queda nada a medias. Para recargar, ejecutar de nuevo del 01 al 06.
2. **Todo cambio en el horario exige `app.id_usuario`** (RF-24). El 06 lo fija con el usuario de cada rol: el Coordinador crea las sesiones, el Aprobador avala y el Administrador sincroniza. Así la bitácora queda realista.
3. **El 07 se ejecuta cuantas veces se quiera.** Cada prueba toma el rol de la aplicación que haría la operación (`SET ROLE`), porque el superusuario se salta los permisos. Luego deshace la operación.
4. **Las contraseñas de los usuarios de prueba son un marcador** (`HASH_PENDIENTE_BACKEND`). El backend genera y guarda los hashes reales (RNF-04).
5. **La concurrencia (RNF-08) se prueba a mano con dos ventanas de psql.** Los pasos están al final del 07.

## Conexión desde la aplicación

La API se conecta con un usuario por perfil (`app_administrador`, `app_coordinador`, `app_aprobador`, `app_docente`), nunca como superusuario ni como `sigh_owner` (RNF-04). En cada transacción que escribe, ejecuta antes:

```sql
SELECT set_config('app.id_usuario', '<id_usuario>', true);
```

Los rechazos llegan como errores de PostgreSQL. El mensaje empieza con el código de la regla (`RN-05: …`), o el nombre de la restricción lo contiene (`uq_asig_rn01_docente_franja`). El backend los traduce a HTTP 409 o 422 (RNF-10).

## Límites documentados

- El superusuario y `sigh_owner` pueden desactivar o borrar triggers; la aplicación nunca usa esas cuentas.
- `app.id_usuario` lo fija la API. Una conexión directa podría poner otro id; la autenticación real está fuera del alcance.
- Si se cambia un parámetro, las filas existentes no se revalidan; la regla aplica desde el siguiente cambio.
- Que `tipo_espacio` coincida con la tabla de subtipo, y que solo los usuarios DOCENTE tengan `id_docente`, lo garantizan los scripts de carga, no un trigger (decisión F10).
