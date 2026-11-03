# Diagramas del SIGH

Diagramas UML de la aplicación web, generados a partir del código de la rama `main` (02/11/2026).

| Archivo | Contenido |
|---|---|
| [`Diagrama_de_clases_backend_SIGH.pdf`](Diagrama_de_clases_backend_SIGH.pdf) | Diagrama de clases del back-end (Spring Boot), 7 hojas |
| [`Diagrama_de_componentes_frontend_SIGH.pdf`](Diagrama_de_componentes_frontend_SIGH.pdf) | Diagrama de componentes del front-end (Angular 21) |
| [`fuentes/`](fuentes/) | Fuentes Graphviz (`.dot`) de cada hoja |

## Back-end: diagrama de clases

| Hoja | Contenido |
|---|---|
| Fig. 1 | Vista general: las 54 clases del paquete `co.edu.unbosque.apihorarios` por paquete y sus relaciones |
| Fig. 2 | Módulo de catálogos: controlador, servicio y repositorio con sus operaciones y endpoints |
| Fig. 3 | Módulo de planeación (secciones y disponibilidad) |
| Fig. 4 | Módulo de programación (versiones y asignaciones) |
| Fig. 5 | Módulos de reportes y de verificación de conexión (`/echo`) |
| Fig. 6 | Seguridad, autenticación y configuración (filtro, tokens, sesiones, pools por rol) |
| Fig. 7 | Clases del modelo (DTO) con sus atributos |

Las hojas 2 a 6 muestran los 79 endpoints de la API junto a la operación del controlador que los atiende.

## Front-end: diagrama de componentes

En Angular el diagrama adecuado es el de componentes: muestra el enrutamiento, las páginas, plantillas, organismos, moléculas y átomos (diseño atómico), los controladores con el estado de la vista, los servicios HTTP y su conexión con la API a través de Nginx.

## Javadoc

El Javadoc del back-end está en [`../javadoc/index.html`](../javadoc/index.html). Cubre solo el paquete `co.edu.unbosque.apihorarios` (sin pruebas ni dependencias).

## Cómo regenerar

```bash
dot -Tpdf fuentes/f1_componentes.dot -o Diagrama_de_componentes_frontend_SIGH.pdf
```
