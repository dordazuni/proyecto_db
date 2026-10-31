# SIGH — Frontend Web (Angular 21)

Interfaz de usuario web desarrollada en **Angular 21** para el Sistema Integrado de Gestión de Horarios (SIGH). Proporciona una experiencia interactiva para la programación académica, visualización en grilla horaria, control de versiones, alertas de conflictos en tiempo real y conmutación de roles de usuario.

---

## 1. Stack Tecnológico

* **Framework:** Angular 21.2.0 (arquitectura basada en Standalone Components y Signals).
* **Lenguaje:** TypeScript 5.9.
* **Manejo de Estado y Asincronía:** RxJS 7.8 y Angular Signals.
* **Cliente HTTP:** Angular `HttpClient` con interceptores para inyección de cabeceras de usuario (`X-Usuario-Id`).
* **Estilos:** CSS3 modular y diseño responsivo optimizado para grillas de horarios.
* **Servidor Web de Producción:** Nginx en Ubuntu Server (AWS EC2).

---

## 2. Módulos Funcionales

La aplicación está organizada en 5 módulos principales accesibles desde la barra de navegación:

1. **Catálogos:**
   * Mantenimiento y consulta de docentes, cursos, espacios físicos (aulas/laboratorios), franjas horarias y recursos.
2. **Planeación Académica:**
   * Control de disponibilidad horaria de docentes, asignación de cursos habilitados, límites de contratación y detección de secciones con sesiones faltantes.
3. **Programación y Grilla de Horarios:**
   * Grilla horaria interactiva (Lunes a Sábado, bloques de 2 horas).
   * Asignación y reasignación de espacios y docentes.
   * Visualización inmediata de rechazos de la base de datos (con traducción amigable del código de regla infringido: `RN-01`, `RN-04`, `RN-07`, etc.).
   * Ciclo de vida de versiones de horario: `EN_EDICION` $\to$ `AVALADO` $\to$ `SINCRONIZADO`.
4. **Reportes:**
   * Horario consolidado por programa y período.
   * Matriz de ocupación física de espacios.
   * Reporte de secciones en riesgo de cierre por baja matrícula/sesiones.
5. **Seguridad y Auditoría:**
   * Consulta de la bitácora inmutable de transacciones registradas por los triggers de la base de datos.
   * Selector rápido de usuario activo (`Administrador`, `Coordinador`, `Aprobador`, `Docente`) para verificar el comportamiento de permisos y roles en tiempo real durante la sustentación.

---

## 3. Configuración de Entornos y Conexión a la API

La configuración de conexión reside en:
[`front-horarios/src/environments/environment.ts`](front-horarios/src/environments/environment.ts)

```typescript
export const environment = {
  production: true,
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
* Node.js v18.x o v20.x LTS.
* Gestor de paquetes npm (v9+ o v11+).

### Pasos para Desarrollo Local
1. Ingresar al directorio del proyecto:
   ```bash
   cd source/front-end/front-horarios
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar servidor de desarrollo local:
   ```bash
   npm start
   ```
   *La aplicación estará disponible en `http://localhost:4200`.*

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
