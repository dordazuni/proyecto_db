# SIGH — Frontend Web (Angular 21)

Interfaz web en **Angular 21** del Sistema Integrado de Gestión de Horarios (SIGH). Cada rol ve solo sus módulos; la base de datos valida las reglas de negocio y la interfaz muestra sus rechazos con el código de la regla.

---

## 1. Stack Tecnológico

* **Framework:** Angular 21.2 (componentes standalone y Signals), con enrutamiento hash (`/#/`).
* **Lenguaje:** TypeScript 5.9.
* **Estado y asincronía:** Angular Signals y RxJS 7.8. El estado vive en `SighController` y se borra completo al iniciar y al cerrar sesión.
* **Cliente HTTP:** `HttpClient` con el token de sesión en la cabecera `Authorization: Bearer <token>`. Un interceptor guarda el token renovado que llega en `X-Renewed-Token` y, ante un `401`, intenta renovar la sesión con `POST /api/auth/refresh` (solo con el token, sin datos del usuario); si no puede, cierra la sesión y vuelve al login.
* **Sesión:** el token y el usuario se guardan en `localStorage`; el módulo y el período en pantalla se guardan por pestaña en `sessionStorage`, para que `F5` conserve la vista. El `authGuard` valida el token con `GET /api/auth/me`.
* **Diseño:** Atomic Design (átomos, moléculas, organismos, plantillas y páginas) con clases CSS planas y tokens `--md-*`.
* **Servidor de producción:** Nginx en Ubuntu Server (AWS EC2).

---

## 2. Módulos Funcionales

| Módulo | Roles | Qué permite |
|---|---|---|
| **00. Inicio** | Todos | Resumen del rol, indicadores y accesos directos |
| **01. Catálogos** | Administrador, Coordinador | Administrador: períodos, recursos, dotación de espacios y parámetros (CU-01). Coordinador: cursos, recursos requeridos y habilitación docente (CU-05). Docentes y espacios son de solo lectura (`RN-19`) |
| **02. Planeación** | Administrador, Coordinador, Docente | Coordinador: secciones, sobrecupo justificado y cierre (CU-06). Administrador y Coordinador: matrícula real (`RF-10`). Docente: su propia disponibilidad (CU-09); el Coordinador la consulta |
| **03. Programación** | Administrador, Coordinador, Aprobador | Versiones `EN_EDICION → PENDIENTE → AVALADO → SINCRONIZADO`. Coordinador: crear versión, asignar, mover (arrastrar y soltar) y eliminar sesiones, y enviar a aprobación (CU-07). Aprobador: avalar o devolver (CU-10). Administrador: sincronizar con el repositorio documental (CU-04) |
| **04. Reportes** | Todos | Horario por docente, espacio y sección; carga docente frente al contrato; secciones en riesgo de cierre; sesiones faltantes y días consecutivos (CU-11). El docente ve solo su horario en la última versión avalada o sincronizada |
| **05. Seguridad** | Administrador | Usuarios con un rol cada uno y vínculo con su docente solo para el rol Docente (`S-09`); bitácora de auditoría de solo lectura (`RF-24`, `RN-18`) |

La grilla muestra lunes a sábado en bloques de 2 horas, con la zona muerta de 12:00 a 13:00 solo de lunes a viernes (`RN-06`).

---

## 3. Configuración de Entornos y Conexión a la API

La configuración de conexión reside en:
[`front-horarios/src/environments/environment.ts`](front-horarios/src/environments/environment.ts)

```typescript
export const environment = {
  production: true,
  // En producción se usa ruta relativa '/api' a través del proxy inverso Nginx (puerto 80).
  apiBaseUrl: '/api',
  echoUrl: '/api/echo'
};
```

> [!NOTE]
> **Arquitectura de Red y Resolución del Hallazgo A3:**
> El frontend utiliza la ruta relativa `/api`. Al ser servido por Nginx en la misma instancia EC2 (puerto 80), todas las peticiones a `/api/...` son redirigidas internamente al backend Spring Boot en el puerto 8080.
> **Ventajas:**
> 1. No requiere exponer el puerto 8080 al público en el Grupo de Seguridad de AWS.
> 2. Elimina bloqueos por CORS al compartir el mismo origen (mismo host y puerto HTTP 80).
> 3. No depende de direcciones IP públicas que puedan cambiar si la instancia se reinicia.

---

## 4. Instalación y Ejecución

### Prerrequisitos
* Node.js `^20.19`, `^22.12` o `>=24` (lo exige Angular 21).
* npm 8 o superior.

### Pasos para Desarrollo Local
1. Ingresar al directorio del proyecto:
   ```bash
   cd source/front-end/front-horarios
   ```
2. Instalar exactamente las dependencias de `package-lock.json`:
   ```bash
   npm ci
   ```
3. Iniciar servidor de desarrollo local:
   ```bash
   npm start
   ```
   *La aplicación estará disponible en `http://localhost:4200`. El servidor de desarrollo reenvía `/api` a Nginx en la VM de AWS (`proxy.conf.json`), así que no hace falta abrir el puerto 8080.*

---

## 5. Compilación para Producción y Despliegue en AWS

### Compilación
Para generar los artefactos optimizados (minificación, treeshaking, hashes de caché):
```bash
npm run build
```
Los archivos estáticos generados quedan en:
`front-horarios/dist/front-horarios/browser/`

### Despliegue en Nginx (Instancia 1 en AWS)
1. Copiar los archivos compilados al directorio web de la instancia:
   ```bash
   scp -r -i "connection_keys.pem" dist/front-horarios/browser/* ubuntu@<IP_PUBLICA_EC2>:/var/www/html/
   ```

2. Configuración del bloque de Nginx (`/etc/nginx/sites-available/default`):
   ```nginx
   server {
       listen 80 default_server;
       listen [::]:80 default_server;

       root /var/www/html;
       index index.html;

       server_name _;

       # Frontend Angular: soporte para rutas HTML5 (Single Page Application)
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy inverso hacia la API de Spring Boot
       location /api/ {
           proxy_pass http://localhost:8080/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Reiniciar Nginx:
   ```bash
   sudo systemctl restart nginx
   ```
