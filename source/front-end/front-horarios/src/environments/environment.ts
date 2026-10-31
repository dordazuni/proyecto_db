export const environment = {
  production: true,
  // En producción se usa ruta relativa '/api' a través del proxy inverso Nginx (puerto 80).
  // Esto elimina la dependencia de IP pública y evita exponer el puerto 8080 (Hallazgo A3).
  apiBaseUrl: '/api',
  echoUrl: '/api/echo'
};

