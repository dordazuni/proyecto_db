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
| 6 | `06_datos_prueba.sql` | Datos de prueba (Ángel) | `psql -U postgres -d sigh -f 06_datos_prueba.sql` |
| 7 | `07_pruebas_reglas.sql` | Un intento inválido por regla; cada uno debe fallar con su mensaje (Ángel) | `psql -U postgres -d sigh -f 07_pruebas_reglas.sql` |

Cada script termina con una consulta de verificación. Salida esperada:

- **01:** `tablas_creadas = 20`.
- **02:** 33 franjas (6 por día de lunes a viernes, 3 el sábado), 4 contratos, 4 parámetros, 4 roles, 4 recursos, 1 usuario.
- **03:** 6 triggers: 2 en `asignacion`, 2 en `version_horario`, 1 en `seccion`, 1 en `curso`.
- **04:** 7 vistas y franjas con `hora_fin` = `hora_inicio` + 2 h.
- **05:** la lista de permisos de escritura por rol.

Los scripts usan `\set ON_ERROR_STOP on`: si algo falla, se detienen en el primer error.

## Reiniciar la base

`01_ddl.sql` borra la base `sigh` si existe y la crea de nuevo. Para empezar de cero, se vuelven a ejecutar los scripts desde el 01. Los roles del 05 son del servidor y no se borran; el 05 los reutiliza.

## Para escribir los scripts 06 y 07

1. **Identificar al usuario antes de escribir.** Todo cambio en `asignacion` o `version_horario` pasa por la bitácora y exige saber quién lo hace (RF-24). Al inicio del script:
   ```sql
   SET app.id_usuario = '1';   -- usuario técnico 'sistema' (02_catalogos.sql)
   ```
   Sin esto, el cambio falla con `RF-24: falta identificar al usuario`.
2. **DOCENTE y ESPACIO solo los carga el superusuario o `sigh_owner`.** Los roles de la aplicación no pueden escribirlos (RN-19).
3. **No enviar columnas que llena la base:** los `id` (IDENTITY), `asignacion.id_usuario_creador` y `fecha_creacion`, y `version_horario.id_usuario_aval` y `fecha_aval`.
4. **Una versión nace `EN_EDICION`.** Para avalarla: `UPDATE ... SET estado = 'PENDIENTE'` y luego `'AVALADO'` con `app.id_usuario` de un usuario con rol APROBADOR.
5. **Pruebas de permisos en el 07.** Conectarse con los usuarios de la aplicación (`app_coordinador`, `app_docente`…), no como `postgres`: el superusuario se salta los permisos y la seguridad por fila.
6. **Un `INSERT` rechazado consume el `id` IDENTITY.** No escribir ids fijos después de un intento fallido; buscarlos por su clave natural (código, número).

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
