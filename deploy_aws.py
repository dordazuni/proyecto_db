#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script automatizado de compilación y despliegue completo (Frontend Angular + Backend Spring Boot)
hacia la instancia AWS EC2 del proyecto SIGH (Universidad El Bosque).

Uso rápido:
    python deploy_aws.py

Opciones adicionales:
    python deploy_aws.py --key "C:/ruta/a/connection_keys.pem"
    python deploy_aws.py --host 18.221.34.127 --db-password "<contraseña>"
    python deploy_aws.py --skip-build   # Solo sube los artefactos ya compilados
"""

from __future__ import annotations

import argparse
import glob
import os
import shutil
import subprocess
import sys
from pathlib import Path

# ==============================================================================
# CONFIGURACIÓN POR DEFECTO DEL PROYECTO SIGH
# ==============================================================================
DEFAULT_EC2_HOST = "18.221.34.127"
DEFAULT_EC2_USER = "ubuntu"
DEFAULT_DB_HOST = "172.31.33.191"
DEFAULT_DB_PORT = "5432"
DEFAULT_DB_NAME = "sigh"
DEFAULT_DB_PASS = os.environ.get("DB_PASSWORD") or os.environ.get("APP_DB_PASSWORD") or ""
DEFAULT_PEM_DIR = Path(r"D:\DATA\Desktop\aws-db-projec")
DEFAULT_PEM_PATH = DEFAULT_PEM_DIR / "connection_keys.pem"

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "source" / "front-end" / "front-horarios"
FRONTEND_DIST_DIR = FRONTEND_DIR / "dist" / "front-horarios" / "browser"
BACKEND_DIR = ROOT_DIR / "source" / "back-end" / "api_horarios"
BACKEND_JAR = BACKEND_DIR / "build" / "libs" / "apihorarios-0.0.1-SNAPSHOT.jar"


def banner(msg: str) -> None:
    print("\n" + "=" * 78)
    print(f"  {msg}")
    print("=" * 78)


def step(msg: str) -> None:
    print(f"\n>>> {msg}")


def run_local(cmd: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    print(f"    $ {' '.join(str(c) for c in cmd)}")
    result = subprocess.run(cmd, cwd=str(cwd) if cwd else None)
    if check and result.returncode != 0:
        print(f"\n[ERROR] El comando falló con código {result.returncode}.")
        sys.exit(result.returncode)
    return result


def find_pem_key(explicit_key: str | None) -> Path:
    """Busca automáticamente el archivo .pem en las rutas habituales de Windows."""
    if explicit_key:
        p = Path(explicit_key).expanduser().resolve()
        if p.is_file():
            return p
        print(f"[ERROR] No se encontró la llave SSH indicada en: {p}")
        sys.exit(1)

    candidates = [
        DEFAULT_PEM_PATH,
        DEFAULT_PEM_DIR / "back" / "connection_keys.pem",
        ROOT_DIR / "connection_keys.pem",
        Path(r"D:\DATA\Desktop\connection_keys.pem"),
        Path.home() / "Desktop" / "connection_keys.pem",
        Path.home() / "Downloads" / "connection_keys.pem",
        Path.home() / ".ssh" / "connection_keys.pem",
    ]

    # Buscar también cualquier .pem dentro de D:\DATA\Desktop\aws-db-projec
    if DEFAULT_PEM_DIR.is_dir():
        for pem in DEFAULT_PEM_DIR.rglob("*.pem"):
            candidates.append(pem)

    for candidate in candidates:
        if candidate.is_file():
            resolved = candidate.resolve()
            print(f"    [OK] Llave SSH detectada en: {resolved}")
            return resolved

    print("[!] No se detectó automáticamente 'connection_keys.pem' en las rutas predeterminadas.")
    user_input = input("Ingresa la ruta completa a tu archivo .pem: ").strip().strip('"').strip("'")
    p = Path(user_input).expanduser().resolve()
    if not p.is_file():
        print(f"[ERROR] El archivo '{p}' no existe.")
        sys.exit(1)
    return p


def fix_windows_pem_permissions(pem_path: Path) -> None:
    """Aplica permisos restrictivos en Windows (icacls) para evitar 'UNPROTECTED PRIVATE KEY FILE'."""
    if os.name != "nt":
        os.chmod(pem_path, 0o400)
        return

    username = os.environ.get("USERNAME") or os.getlogin()
    step(f"Asegurando permisos de solo lectura para '{pem_path.name}' (usuario: {username})...")
    subprocess.run(["icacls.exe", str(pem_path), "/reset"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(
        ["icacls.exe", str(pem_path), "/grant:r", f"{username}:(r)"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.run(["icacls.exe", str(pem_path), "/inheritance:r"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def build_frontend() -> None:
    banner("PASO 1/5: COMPILANDO FRONTEND (ANGULAR)")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    if not (FRONTEND_DIR / "node_modules").is_dir():
        step("Instalando dependencias de Node.js (npm install)...")
        run_local([npm_cmd, "install"], cwd=FRONTEND_DIR)

    step("Ejecutando 'npm run build' en Angular...")
    run_local([npm_cmd, "run", "build"], cwd=FRONTEND_DIR)

    index_file = FRONTEND_DIST_DIR / "index.html"
    if not index_file.is_file():
        print(f"[ERROR] No se encontró el archivo compilado en: {index_file}")
        sys.exit(1)
    print(f"    [OK] Frontend compilado exitosamente en: {FRONTEND_DIST_DIR}")


def build_backend() -> None:
    banner("PASO 2/5: COMPILANDO BACKEND (SPRING BOOT JAR)")
    gradlew = str(BACKEND_DIR / ("gradlew.bat" if os.name == "nt" else "gradlew"))
    step("Ejecutando 'gradlew bootJar --no-daemon'...")
    run_local([gradlew, "bootJar", "--no-daemon"], cwd=BACKEND_DIR)

    if not BACKEND_JAR.is_file():
        print(f"[ERROR] No se encontró el artefacto JAR en: {BACKEND_JAR}")
        sys.exit(1)
    size_mb = BACKEND_JAR.stat().st_size / (1024 * 1024)
    print(f"    [OK] Backend compilado exitosamente: {BACKEND_JAR.name} ({size_mb:.2f} MB)")


def ssh_exec(pem_path: Path, target: str, remote_command: str, check: bool = True) -> subprocess.CompletedProcess:
    cmd = [
        "ssh",
        "-i",
        str(pem_path),
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        "ConnectTimeout=15",
        target,
        remote_command,
    ]
    return run_local(cmd, check=check)


def scp_upload(pem_path: Path, sources: list[str], destination: str) -> None:
    cmd = [
        "scp",
        "-i",
        str(pem_path),
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        "ConnectTimeout=15",
        "-r",
        *sources,
        destination,
    ]
    run_local(cmd)


def deploy_to_ec2(
    pem_path: Path,
    host: str,
    user: str,
    db_host: str,
    db_port: str,
    db_name: str,
    db_password: str,
) -> None:
    target = f"{user}@{host}"

    # --------------------------------------------------------------------------
    # PASO 3: SUBIR FRONTEND Y PUBLICAR EN NGINX (/var/www/html)
    # --------------------------------------------------------------------------
    banner("PASO 3/5: SUBIENDO FRONTEND A AWS EC2 Y PUBLICANDO EN NGINX")
    step("Preparando carpeta temporal '/tmp/sigh_front_dist' en la VM...")
    ssh_exec(pem_path, target, "rm -rf /tmp/sigh_front_dist && mkdir -p /tmp/sigh_front_dist")

    dist_files = [str(p) for p in FRONTEND_DIST_DIR.iterdir()]
    if not dist_files:
        print(f"[ERROR] La carpeta {FRONTEND_DIST_DIR} está vacía.")
        sys.exit(1)

    step(f"Subiendo {len(dist_files)} archivos del Frontend vía SCP...")
    scp_upload(pem_path, dist_files, f"{target}:/tmp/sigh_front_dist/")

    step("Copiando archivos a /var/www/html y aplicando permisos de Nginx...")
    ssh_exec(
        pem_path,
        target,
        "sudo rm -rf /var/www/html/* && "
        "sudo cp -r /tmp/sigh_front_dist/* /var/www/html/ && "
        "sudo chown -R www-data:www-data /var/www/html && "
        "sudo chmod -R 755 /var/www/html && "
        "rm -rf /tmp/sigh_front_dist && "
        "ls -la /var/www/html",
    )

    # --------------------------------------------------------------------------
    # PASO 4: SUBIR BACKEND (.JAR) Y REINICIAR PROCESO SPRING BOOT + NGINX
    # --------------------------------------------------------------------------
    banner("PASO 4/5: SUBIENDO BACKEND (.JAR) Y LEVANTANDO SERVICIO EN PUERTO 8080")
    step("Creando directorios de aplicación en la VM...")
    ssh_exec(pem_path, target, "mkdir -p /home/ubuntu/backend /home/ubuntu/app/api")

    step(f"Subiendo {BACKEND_JAR.name} vía SCP a /home/ubuntu/apihorarios-0.0.1-SNAPSHOT.jar...")
    scp_upload(pem_path, [str(BACKEND_JAR)], f"{target}:/home/ubuntu/apihorarios-0.0.1-SNAPSHOT.jar")

    # Escapar comillas simples si existieran en la contraseña
    safe_db_pass = db_password.replace("'", "'\"'\"'")

    remote_restart_script = f"""
set -e
cp -f /home/ubuntu/apihorarios-0.0.1-SNAPSHOT.jar /home/ubuntu/backend/apihorarios-0.0.1-SNAPSHOT.jar || true
cp -f /home/ubuntu/apihorarios-0.0.1-SNAPSHOT.jar /home/ubuntu/app/api/api_horarios-0.0.1-SNAPSHOT.jar || true

echo "[VM] Deteniendo cualquier proceso previo en el puerto 8080..."
sudo systemctl stop sigh-api 2>/dev/null || true
killall -q java 2>/dev/null || true
sleep 2

echo "[VM] Iniciando nuevo proceso Spring Boot con los 4 pools PostgreSQL..."
nohup env \\
  DB_HOST='{db_host}' \\
  DB_PORT='{db_port}' \\
  DB_NAME='{db_name}' \\
  DB_PASSWORD='{safe_db_pass}' \\
  java -Xmx350m -jar /home/ubuntu/apihorarios-0.0.1-SNAPSHOT.jar > /home/ubuntu/app.log 2>&1 < /dev/null &

echo "[VM] Validando y recargando Nginx..."
sudo nginx -t && sudo systemctl reload nginx
"""
    step("Reiniciando el backend y recargando Nginx en la VM...")
    ssh_exec(pem_path, target, remote_restart_script)

    # --------------------------------------------------------------------------
    # PASO 5: VERIFICACIÓN AUTOMÁTICA DE SALUD (/api/echo y /api/auth/login)
    # --------------------------------------------------------------------------
    banner("PASO 5/5: VERIFICANDO QUE BACKEND, NGINX Y BASE DE DATOS ESTÉN ACTIVOS")
    remote_verify_script = """
echo "[VM] Esperando a que Spring Boot escuche en http://127.0.0.1:8080/api/echo ..."
for i in $(seq 1 25); do
    if curl -s -f http://127.0.0.1:8080/api/echo > /dev/null 2>&1; then
        echo "[OK] Spring Boot respondió en el intento $i."
        break
    fi
    sleep 1
done

echo ""
echo "1) Respuesta de Nginx Proxy (GET http://127.0.0.1/api/echo):"
curl -s http://127.0.0.1/api/echo || (echo "[ERROR] El backend no levantó. Últimas líneas de /home/ubuntu/app.log:" && tail -n 40 /home/ubuntu/app.log && exit 1)
echo ""

echo ""
echo "2) Prueba de Autenticación JWT (POST http://127.0.0.1/api/auth/login con 'admin'):"
LOGIN_STATUS=$(curl -s -o /tmp/login_test.json -w "%{http_code}" -X POST http://127.0.0.1/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"nombreUsuario":"admin","contrasena":"123456"}')
echo "   Código HTTP Login: $LOGIN_STATUS"
head -c 260 /tmp/login_test.json && echo "..."
rm -f /tmp/login_test.json

echo ""
echo "3) Últimas 15 líneas de /home/ubuntu/app.log:"
tail -n 15 /home/ubuntu/app.log
"""
    ssh_exec(pem_path, target, remote_verify_script)

    banner("¡DESPLIEGUE COMPLETADO CON ÉXITO!")
    print(f"  - URL Web (Frontend Angular):  http://{host}/")
    print(f"  - URL Login directo:           http://{host}/#/login")
    print(f"  - URL Estado Conexión:         http://{host}/#/conexion")
    print(f"  - URL API Echo (vía Nginx):    http://{host}/api/echo")
    print("=" * 78 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compila y despliega automáticamente el Frontend (Angular) y Backend (Spring Boot) de SIGH en AWS EC2."
    )
    parser.add_argument("--key", help="Ruta al archivo .pem para conexión SSH/SCP", default=None)
    parser.add_argument("--host", help=f"IP pública de la VM Web/API (default: {DEFAULT_EC2_HOST})", default=DEFAULT_EC2_HOST)
    parser.add_argument("--user", help=f"Usuario SSH de la VM (default: {DEFAULT_EC2_USER})", default=DEFAULT_EC2_USER)
    parser.add_argument("--db-host", help=f"IP privada de la VM BD (default: {DEFAULT_DB_HOST})", default=DEFAULT_DB_HOST)
    parser.add_argument("--db-port", help=f"Puerto de PostgreSQL (default: {DEFAULT_DB_PORT})", default=DEFAULT_DB_PORT)
    parser.add_argument("--db-name", help=f"Nombre de la BD (default: {DEFAULT_DB_NAME})", default=DEFAULT_DB_NAME)
    parser.add_argument("--db-password", help="Contraseña de los roles app_* en PostgreSQL", default=DEFAULT_DB_PASS)
    parser.add_argument("--skip-build", action="store_true", help="Omitir compilación local y subir directamente los artefactos existentes")
    parser.add_argument("--only-front", action="store_true", help="Compilar solo el Frontend antes de desplegar")
    parser.add_argument("--only-back", action="store_true", help="Compilar solo el Backend antes de desplegar")

    args = parser.parse_args()

    db_password = args.db_password or DEFAULT_DB_PASS
    if not db_password:
        import getpass
        try:
            db_password = getpass.getpass("Ingrese la contraseña de los roles app_* en PostgreSQL (DB_PASSWORD): ").strip()
        except Exception:
            pass
    if not db_password:
        print("[ERROR] Falta la contraseña de la BD. Especifíquela con --db-password o la variable de entorno DB_PASSWORD.")
        sys.exit(1)

    for tool in ("ssh", "scp"):
        if not shutil.which(tool):
            print(f"[ERROR] No se encontró el comando '{tool}' en el PATH de Windows. Activa el cliente OpenSSH.")
            sys.exit(1)

    pem_path = find_pem_key(args.key)
    fix_windows_pem_permissions(pem_path)

    if not args.skip_build:
        if not args.only_back:
            build_frontend()
        if not args.only_front:
            build_backend()
    else:
        banner("MODO --skip-build: USANDO ARTEFACTOS YA COMPILADOS")
        if not (FRONTEND_DIST_DIR / "index.html").is_file():
            print(f"[ERROR] No existe compilación previa del Frontend en {FRONTEND_DIST_DIR}")
            sys.exit(1)
        if not BACKEND_JAR.is_file():
            print(f"[ERROR] No existe compilación previa del Backend en {BACKEND_JAR}")
            sys.exit(1)

    deploy_to_ec2(
        pem_path=pem_path,
        host=args.host,
        user=args.user,
        db_host=args.db_host,
        db_port=args.db_port,
        db_name=args.db_name,
        db_password=db_password,
    )


if __name__ == "__main__":
    main()
