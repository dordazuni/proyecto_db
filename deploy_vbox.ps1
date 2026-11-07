<#
.SYNOPSIS
    Script automatizado de compilacion y despliegue (Frontend + Backend + Base de Datos)
    hacia las maquinas virtuales de VirtualBox del proyecto SIGH (Universidad El Bosque).

.DESCRIPTION
    VM Aplicacion:    192.168.78.120
    VM Base de Datos: 192.168.78.126

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\deploy_vbox.ps1 -SkipBuild
#>

param(
    [string]$AppIp = "192.168.78.120",
    [string]$DbIp = "192.168.78.126",
    [string]$User = "user",
    [string]$KeyPath = "",
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } elseif ($env:APP_DB_PASSWORD) { $env:APP_DB_PASSWORD } else { "1234" }),
    [switch]$SkipBuild,
    [switch]$OnlyDb,
    [switch]$OnlyApp
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DbDir = Join-Path $RootDir "source\db"
$FrontendDir = Join-Path $RootDir "source\front-end\front-horarios"
$FrontendDistDir = Join-Path $FrontendDir "dist\front-horarios\browser"
$BackendDir = Join-Path $RootDir "source\back-end\api_horarios"
$BackendJar = Join-Path $BackendDir "build\libs\apihorarios-0.0.1-SNAPSHOT.jar"
$VmDocsDir = Join-Path $RootDir "docs\virtual-machine"

function Write-Banner([string]$Title) {
    Write-Host ""
    Write-Host ("=" * 78) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("=" * 78) -ForegroundColor Cyan
}

function Write-Step([string]$Message) {
    Write-Host "`n>>> $Message" -ForegroundColor Yellow
}

function Invoke-Ssh([string]$Target, [string]$Command) {
    $sshArgs = @("-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15")
    if (-not [string]::IsNullOrWhiteSpace($KeyPath) -and (Test-Path $KeyPath)) {
        $sshArgs += @("-i", $KeyPath)
    }
    $sshArgs += @($Target, $Command)
    & ssh @sshArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] El comando SSH fallo con codigo $LASTEXITCODE." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

function Invoke-Scp([string[]]$Sources, [string]$Destination) {
    $scpArgs = @("-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", "-r")
    if (-not [string]::IsNullOrWhiteSpace($KeyPath) -and (Test-Path $KeyPath)) {
        $scpArgs += @("-i", $KeyPath)
    }
    $scpArgs += $Sources
    $scpArgs += $Destination
    & scp @scpArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] SCP fallo con codigo $LASTEXITCODE." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Validar herramientas locales
foreach ($tool in @("ssh", "scp")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] No se encontro '$tool' en el PATH. Activa el cliente OpenSSH de Windows." -ForegroundColor Red
        exit 1
    }
}

if (-not $OnlyApp -and [string]::IsNullOrWhiteSpace($DbPassword)) {
    $DbPassword = "1234"
}
$safePass = $DbPassword.Replace("'", "'""'""'")

# ==============================================================================
# PASO 1: COMPILACION LOCAL (WINDOWS)
# ==============================================================================
if (-not $OnlyDb -and -not $SkipBuild) {
    Write-Banner "COMPILANDO FRONTEND (ANGULAR 21)"
    if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
        Write-Step "Instalando dependencias de Node.js (npm install)..."
        Push-Location $FrontendDir
        npm.cmd install
        Pop-Location
    }

    Write-Step "Ejecutando 'npm run build'..."
    Push-Location $FrontendDir
    npm.cmd run build
    Pop-Location

    if (-not (Test-Path (Join-Path $FrontendDistDir "index.html"))) {
        Write-Host "[ERROR] No se genero index.html en $FrontendDistDir" -ForegroundColor Red
        exit 1
    }

    Write-Banner "COMPILANDO BACKEND (SPRING BOOT)"
    Write-Step "Ejecutando 'gradlew.bat bootJar --no-daemon'..."
    Push-Location $BackendDir
    .\gradlew.bat bootJar --no-daemon
    Pop-Location

    if (-not (Test-Path $BackendJar)) {
        Write-Host "[ERROR] No se encontro el artefacto $BackendJar" -ForegroundColor Red
        exit 1
    }
}

# ==============================================================================
# PASO 2: DESPLIEGUE EN VM BASE DE DATOS (192.168.78.126)
# ==============================================================================
if (-not $OnlyApp) {
    $dbTarget = "$User@$DbIp"
    Write-Banner "CONFIGURANDO Y DESPLEGANDO BASE DE DATOS POSTGRESQL EN $dbTarget"

    Write-Step "Subiendo y ejecutando script de configuracion inicial de PostgreSQL..."
    $setupDbScript = Join-Path $VmDocsDir "setup_vm_bd.sh"
    Invoke-Scp @($setupDbScript) "$dbTarget`:/tmp/setup_vm_bd.sh"
    Invoke-Ssh $dbTarget "echo '$safePass' | sudo -S bash /tmp/setup_vm_bd.sh"

    Write-Step "Subiendo scripts SQL (01 a 07) y orquestador a la VM BD..."
    Invoke-Ssh $dbTarget "rm -rf /tmp/sigh_db && mkdir -p /tmp/sigh_db"
    $sqlFiles = Get-ChildItem -Path $DbDir -Filter "*.sql" | Select-Object -ExpandProperty FullName
    $runnerScript = Join-Path $VmDocsDir "run_sql_sigh.sh"
    $allDbUploads = @($sqlFiles; $runnerScript)
    Invoke-Scp $allDbUploads "$dbTarget`:/tmp/sigh_db/"

    Write-Step "Ejecutando scripts SQL en orden (01 a 07)..."
    Invoke-Ssh $dbTarget "echo '$safePass' | sudo -S bash /tmp/sigh_db/run_sql_sigh.sh '$safePass' && rm -rf /tmp/sigh_db /tmp/setup_vm_bd.sh"
}

# ==============================================================================
# PASO 3: DESPLIEGUE EN VM APLICACION (192.168.78.120)
# ==============================================================================
if (-not $OnlyDb) {
    $appTarget = "$User@$AppIp"
    Write-Banner "CONFIGURANDO Y DESPLEGANDO APLICACION EN $appTarget"

    Write-Step "Asegurando dependencias de la VM APP (Nginx, OpenJDK 17)..."
    $setupAppScript = Join-Path $VmDocsDir "setup_vm_app.sh"
    Invoke-Scp @($setupAppScript) "$appTarget`:/tmp/setup_vm_app.sh"
    Invoke-Ssh $appTarget "echo '$safePass' | sudo -S bash /tmp/setup_vm_app.sh && rm -f /tmp/setup_vm_app.sh"

    Write-Step "Subiendo Frontend Angular compilado a /var/www/html..."
    Invoke-Ssh $appTarget "rm -rf /tmp/sigh_front_dist && mkdir -p /tmp/sigh_front_dist"
    $distItems = Get-ChildItem -Path $FrontendDistDir | Select-Object -ExpandProperty FullName
    Invoke-Scp $distItems "$appTarget`:/tmp/sigh_front_dist/"

    $deployFrontCmd = "echo '$safePass' | sudo -S rm -rf /var/www/html/* && " +
                      "echo '$safePass' | sudo -S cp -r /tmp/sigh_front_dist/* /var/www/html/ && " +
                      "echo '$safePass' | sudo -S chown -R www-data:www-data /var/www/html && " +
                      "echo '$safePass' | sudo -S chmod -R 755 /var/www/html && " +
                      "rm -rf /tmp/sigh_front_dist"
    Invoke-Ssh $appTarget $deployFrontCmd

    Write-Step "Subiendo Backend (.jar) a /home/$User/app/api/..."
    Invoke-Ssh $appTarget "mkdir -p /home/$User/app/api"
    Invoke-Scp @($BackendJar) "$appTarget`:/home/$User/app/api/apihorarios-0.0.1-SNAPSHOT.jar"

    Write-Step "Reiniciando servicios sigh-api y Nginx en la VM APP..."
    $restartAppCmd = "echo '$safePass' | sudo -S systemctl daemon-reload && " +
                     "echo '$safePass' | sudo -S systemctl enable sigh-api && " +
                     "echo '$safePass' | sudo -S systemctl restart sigh-api && " +
                     "echo '$safePass' | sudo -S nginx -t && " +
                     "echo '$safePass' | sudo -S systemctl reload nginx"
    Invoke-Ssh $appTarget $restartAppCmd

    Write-Step "Esperando a que la API responda en http://127.0.0.1:8080/api/echo ..."
    $verifyCmd = "for i in `$(seq 1 30); do " +
                 "  if curl -s -f http://127.0.0.1:8080/api/echo > /dev/null 2>&1; then " +
                 "    echo '[OK] Spring Boot levanto en el intento '`$i; break; " +
                 "  fi; sleep 1; " +
                 "done; " +
                 "echo 'Respuesta de API Echo:'; " +
                 "curl -s http://127.0.0.1/api/echo || true; echo ''"
    Invoke-Ssh $appTarget $verifyCmd
}

Write-Banner "DESPLIEGUE EN VIRTUALBOX FINALIZADO CON EXITO"
Write-Host "  - Frontend Web (SPA):   http://$AppIp/" -ForegroundColor Green
Write-Host "  - Login directo:        http://$AppIp/#/login" -ForegroundColor Green
Write-Host "  - Estado Conexion:      http://$AppIp/#/conexion" -ForegroundColor Green
Write-Host "  - Verificacion API:     http://$AppIp/api/echo" -ForegroundColor Green
Write-Host "  - Base de Datos (BD):   $DbIp`:5432 (sigh)" -ForegroundColor Green
Write-Host ("=" * 78 + "`n")
