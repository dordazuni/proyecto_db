#!/usr/bin/env bash
# ==============================================================================
# SIGH - Setup Inicial de la Máquina Virtual de la Aplicación (VirtualBox)
# IP VM APP: 192.168.78.120
# IP VM BD:  192.168.78.126
# ==============================================================================
set -e

APP_USER="${SUDO_USER:-user}"
APP_HOME=$(getent passwd "$APP_USER" | cut -d: -f6)
[ -z "$APP_HOME" ] && APP_HOME="/home/$APP_USER"

echo "Usuario destino: $APP_USER (Home: $APP_HOME)"

echo "=== [1/4] Instalando OpenJDK 17, Nginx y utilitarios ==="
sudo apt update -y
sudo apt install -y openjdk-17-jdk nginx curl

echo "=== [2/4] Creando directorios de despliegue ==="
mkdir -p "$APP_HOME/app/api"
sudo mkdir -p /var/www/html
chown -R "$APP_USER":"$APP_USER" "$APP_HOME/app"

echo "=== [3/4] Configurando Nginx con SPA Angular y Proxy Inverso /api/ ==="
sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOT'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    # Servir Frontend Angular SPA (soporte para rutas internas)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverso seguro hacia la API Spring Boot (puerto local 8080)
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOT

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=== [4/4] Creando plantilla de servicio Systemd (sigh-api.service) ==="
sudo tee /etc/systemd/system/sigh-api.service > /dev/null <<EOT
[Unit]
Description=Servicio API SIGH Spring Boot
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_HOME/app/api
Environment="DB_HOST=192.168.78.126"
Environment="DB_PORT=5432"
Environment="DB_NAME=sigh"
Environment="DB_USER=app_administrador"
Environment="DB_PASSWORD=1234"
ExecStart=/usr/bin/java -Xmx400m -jar $APP_HOME/app/api/apihorarios-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOT

sudo systemctl daemon-reload

echo ""
echo "=== ¡CONFIGURACIÓN BASE DE VM APP COMPLETADA! ==="
java -version
nginx -v
