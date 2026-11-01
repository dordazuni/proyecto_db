<#
.SYNOPSIS
    Script automatizado de compilación y despliegue completo (Frontend Angular + Backend Spring Boot)
    hacia la instancia AWS EC2 del proyecto SIGH (Universidad El Bosque).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File "C:\Users\dorda\IdeaProjects\proyecto_db\deploy_aws.ps1"

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File "C:\Users\dorda\IdeaProjects\proyecto_db\deploy_aws.ps1" -SkipBuild
#>

param(
    [string]$KeyPath = "D:\DATA\Desktop\aws-db-projec\connection_keys.pem",
    [string]$HostIp = "18.221.34.127",
    [string]$SshUser = "ubuntu",
    [string]$DbHost = "172.31.33.191",
    [string]$DbPort = "5432",
    [string]$DbName = "sigh",
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } elseif ($env:APP_DB_PASSWORD) { $env:APP_DB_PASSWORD } else { "" }),
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DbPassword)) {
    $DbPassword = Read-Host "Ingrese la contrasenia de los roles app_* en PostgreSQL (DB_PASSWORD)"
    if ([string]::IsNullOrWhiteSpace($DbPassword)) {
        Write-Host "[ERROR] Se requiere la contrasenia de la base de datos (pase -DbPassword o defina DB_PASSWORD)." -ForegroundColor Red
        exit 1
    }
}

$RootDir = "C:\Users\dorda\IdeaProjects\proyecto_db"
$FrontendDir = Join-Path $RootDir "source\front-end\front-horarios"
$FrontendDistDir = Join-Path $FrontendDir "dist\front-horarios\browser"
$BackendDir = Join-Path $RootDir "source\back-end\api_horarios"
$BackendJar = Join-Path $BackendDir "build\libs\apihorarios-0.0.1-SNAPSHOT.jar"

function Write-Banner([string]$Title) {
    Write-Host ""
    Write-Host ("=" * 78) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("=" * 78) -ForegroundColor Cyan
}

function Write-Step([string]$Message) {
    Write-Host "`n>>> $Message" -ForegroundColor Yellow
}

# 0. Verificar llave SSH (.pem) y asegurar permisos en Windows
Write-Banner "PASO 0/5: VERIFICANDO LLAVE SSH (.PEM)"
if (-not (Test-Path $KeyPath)) {
    $FoundPem = Get-ChildItem -Path "D:\DATA\Desktop\aws-db-projec" -Filter "*.pem" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($FoundPem) {
        $KeyPath = $FoundPem.FullName
    } else {
        Write-Host "[ERROR] No se encontro la llave SSH en: $KeyPath" -ForegroundColor Red
        exit 1
    }
}
Write-Host "    [OK] Usando llave SSH: $KeyPath" -ForegroundColor Green

Write-Step "Aplicando permisos de solo lectura a la llave .pem (icacls)..."
icacls.exe "$KeyPath" /reset | Out-Null
icacls.exe "$KeyPath" /grant:r "$($env:USERNAME):(r)" | Out-Null
icacls.exe "$KeyPath" /inheritance:r | Out-Null

if (-not $SkipBuild) {
    # 1. Compilar Frontend (Angular)
    Write-Banner "PASO 1/5: COMPILANDO FRONTEND (ANGULAR)"
    Push-Location $FrontendDir
    try {
        if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
            Write-Step "Instalando dependencias de Node.js (npm install)..."
            & npm.cmd install
            if ($LASTEXITCODE -ne 0) { throw "Fallo npm install" }
        }
        Write-Step "Ejecutando 'npm run build'..."
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw "Fallo npm run build" }
    } finally {
        Pop-Location
    }

    # 2. Compilar Backend (Spring Boot)
    Write-Banner "PASO 2/5: COMPILANDO BACKEND (SPRING BOOT JAR)"
    Push-Location $BackendDir
    try {
        Write-Step "Ejecutando 'gradlew.bat bootJar --no-daemon'..."
        & .\gradlew.bat bootJar --no-daemon
        if ($LASTEXITCODE -ne 0) { throw "Fallo gradlew bootJar" }
    } finally {
        Pop-Location
    }
} else {
    Write-Banner "MODO -SkipBuild: USANDO ARCHIVOS YA COMPILADOS"
}

if (-not (Test-Path (Join-Path $FrontendDistDir "index.html"))) {
    Write-Host "[ERROR] No existe index.html compilado en: $FrontendDistDir" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $BackendJar)) {
    Write-Host "[ERROR] No existe el JAR compilado en: $BackendJar" -ForegroundColor Red
    exit 1
}

# Copiar también los artefactos a D:\DATA\Desktop\aws-db-projec si existe esa carpeta
if (Test-Path "D:\DATA\Desktop\aws-db-projec") {
    $LocalBackCopy = "D:\DATA\Desktop\aws-db-projec\back"
    if (Test-Path $LocalBackCopy) {
        Copy-Item -Path $BackendJar -Destination (Join-Path $LocalBackCopy "apihorarios-0.0.1-SNAPSHOT.jar") -Force
        Write-Host "    [OK] Copia local actualizada en $LocalBackCopy\apihorarios-0.0.1-SNAPSHOT.jar" -ForegroundColor DarkGray
    }
}

$Target = "$SshUser@$HostIp"
$SshOpts = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15")

# 3. Subir Frontend y publicar en /var/www/html
Write-Banner "PASO 3/5: SUBIENDO FRONTEND A AWS EC2 Y PUBLICANDO EN NGINX"
Write-Step "Preparando carpeta temporal /tmp/sigh_front_dist en la VM..."
& ssh.exe @SshOpts $Target "rm -rf /tmp/sigh_front_dist && mkdir -p /tmp/sigh_front_dist"
if ($LASTEXITCODE -ne 0) { throw "Fallo conexion SSH a $Target" }

Write-Step "Subiendo archivos de dist/front-horarios/browser por SCP..."
$DistFiles = Get-ChildItem -Path $FrontendDistDir | Select-Object -ExpandProperty FullName
& scp.exe @SshOpts -r @DistFiles "${Target}:/tmp/sigh_front_dist/"
if ($LASTEXITCODE -ne 0) { throw "Fallo subida SCP del Frontend" }

Write-Step "Publicando archivos en /var/www/html y asignando permisos de Nginx..."
& ssh.exe @SshOpts $Target "sudo rm -rf /var/www/html/* && sudo cp -r /tmp/sigh_front_dist/* /var/www/html/ && sudo chown -R www-data:www-data /var/www/html && sudo chmod -R 755 /var/www/html && rm -rf /tmp/sigh_front_dist && ls -la /var/www/html"
if ($LASTEXITCODE -ne 0) { throw "Fallo publicacion en /var/www/html" }

# 4. Subir Backend (.jar) a /home/ubuntu/backend y reiniciar servicio
Write-Banner "PASO 4/5: SUBIENDO BACKEND (.JAR) A /home/ubuntu/backend Y REINICIANDO"
Write-Step "Limpiando JARs antiguos y creando unicamente /home/ubuntu/backend..."
& ssh.exe @SshOpts $Target "rm -f /home/ubuntu/*.jar /home/ubuntu/app/api/*.jar && rm -rf /home/ubuntu/app && mkdir -p /home/ubuntu/backend && rm -f /home/ubuntu/backend/*.jar"

Write-Step "Subiendo apihorarios-0.0.1-SNAPSHOT.jar unicamente a /home/ubuntu/backend/ por SCP..."
& scp.exe @SshOpts $BackendJar "${Target}:/home/ubuntu/backend/apihorarios-0.0.1-SNAPSHOT.jar"
if ($LASTEXITCODE -ne 0) { throw "Fallo subida SCP del Backend JAR" }

Write-Step "Deteniendo proceso anterior en puerto 8080, iniciando el nuevo JAR en /home/ubuntu/backend y recargando Nginx..."
$RemoteRestartCmd = "sudo systemctl stop sigh-api 2>/dev/null || true; " +
                    "killall -q java 2>/dev/null || true; " +
                    "sleep 2; " +
                    "nohup env DB_HOST='$DbHost' DB_PORT='$DbPort' DB_NAME='$DbName' DB_PASSWORD='$DbPassword' java -Xmx350m -jar /home/ubuntu/backend/apihorarios-0.0.1-SNAPSHOT.jar > /home/ubuntu/backend.log 2>&1 < /dev/null & " +
                    "sudo nginx -t && sudo systemctl reload nginx"

& ssh.exe @SshOpts $Target $RemoteRestartCmd
if ($LASTEXITCODE -ne 0) { throw "Fallo reinicio del Backend o Nginx en la VM" }

# 5. Verificación automática de salud
Write-Banner "PASO 5/5: VERIFICANDO QUE BACKEND, NGINX Y BASE DE DATOS ESTEN ACTIVOS"
$RemoteVerifyCmd = @'
echo "[VM] Esperando a que Spring Boot responda en http://127.0.0.1:8080/api/echo ..."
for i in $(seq 1 25); do
    if curl -s -f http://127.0.0.1:8080/api/echo > /dev/null 2>&1; then
        echo "[OK] Spring Boot activo en el intento $i."
        break
    fi
    sleep 1
done
echo ""
echo "1) Respuesta de GET http://127.0.0.1/api/echo (via Nginx puerto 80):"
curl -s http://127.0.0.1/api/echo
echo ""
echo ""
echo "2) Prueba de Login JWT (POST http://127.0.0.1/api/auth/login con admin / 123456):"
curl -s -X POST http://127.0.0.1/api/auth/login -H "Content-Type: application/json" -d '{"nombreUsuario":"admin","contrasena":"123456"}' | head -c 240
echo "..."
echo ""
echo "3) Archivos JAR presentes en la VM (debe ser unico en /home/ubuntu/backend/):"
find /home/ubuntu -maxdepth 3 -name "*.jar"
echo ""
echo "4) Ultimas 12 lineas de /home/ubuntu/backend.log:"
tail -n 12 /home/ubuntu/backend.log
'@ -replace "`r`n", "`n"

& ssh.exe @SshOpts $Target $RemoteVerifyCmd

Write-Banner "DESPLIEGUE COMPLETADO CON EXITO"
Write-Host "  - URL Web (Frontend Angular):  http://$HostIp/" -ForegroundColor Green
Write-Host "  - URL Login directo:           http://$HostIp/#/login" -ForegroundColor Green
Write-Host "  - URL Estado Conexion:         http://$HostIp/#/conexion" -ForegroundColor Green
Write-Host "  - URL API Echo (via Nginx):    http://$HostIp/api/echo" -ForegroundColor Green
Write-Host ""
