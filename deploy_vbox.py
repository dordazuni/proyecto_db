#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script automatizado de compilación y despliegue completo (Frontend + Backend + Base de Datos)
hacia las máquinas virtuales de VirtualBox del proyecto SIGH (Universidad El Bosque).

Máquinas por defecto:
    - VM Aplicación:    192.168.78.120
    - VM Base de Datos: 192.168.78.126

Uso rápido:
    python deploy_vbox.py --skip-build
"""

from __future__ import annotations

import argparse
import glob
import os
import shutil
import subprocess
import sys
from pathlib import Path

DEFAULT_APP_IP = "192.168.78.120"
DEFAULT_DB_IP = "192.168.78.126"
DEFAULT_SSH_USER = "user"
DEFAULT_DB_PASS = os.environ.get("DB_PASSWORD") or os.environ.get("APP_DB_PASSWORD") or "1234"

ROOT_DIR = Path(__file__).resolve().parent
DB_DIR = ROOT_DIR / "source" / "db"
FRONTEND_DIR = ROOT_DIR / "source" / "front-end" / "front-horarios"
FRONTEND_DIST_DIR = FRONTEND_DIR / "dist" / "front-horarios" / "browser"
BACKEND_DIR = ROOT_DIR / "source" / "back-end" / "api_horarios"
BACKEND_JAR = BACKEND_DIR / "build" / "libs" / "apihorarios-0.0.1-SNAPSHOT.jar"
DOCS_VM_DIR = ROOT_DIR / "docs" / "virtual-machine"


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


def ssh_exec(target: str, remote_command: str, key_path: Path | None = None) -> subprocess.CompletedProcess:
    cmd = ["ssh", "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15"]
    if key_path and key_path.is_file():
        cmd.extend(["-i", str(key_path)])
    cmd.extend([target, remote_command])
    return run_local(cmd)


def scp_upload(sources: list[str], destination: str, key_path: Path | None = None) -> None:
    cmd = ["scp", "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=15", "-r"]
    if key_path and key_path.is_file():
        cmd.extend(["-i", str(key_path)])
    cmd.extend(sources + [destination])
    run_local(cmd)


def deploy_database(db_ip: str, user: str, db_password: str, key_path: Path | None) -> None:
    target = f"{user}@{db_ip}"
    banner(f"CONFIGURANDO Y DESPLEGANDO BASE DE DATOS POSTGRESQL EN {target}")

    step("Subiendo y ejecutando script de configuración inicial de PostgreSQL...")
    setup_db_script = str(DOCS_VM_DIR / "setup_vm_bd.sh")
    scp_upload([setup_db_script], f"{target}:/tmp/setup_vm_bd.sh", key_path=key_path)
    ssh_exec(target, f"echo '{db_password}' | sudo -S bash /tmp/setup_vm_bd.sh", key_path=key_path)

    step("Subiendo scripts SQL (01 a 07) y orquestador a la VM BD...")
    ssh_exec(target, "rm -rf /tmp/sigh_db && mkdir -p /tmp/sigh_db", key_path=key_path)
    sql_files = sorted(glob.glob(str(DB_DIR / "*.sql")))
    runner_script = str(DOCS_VM_DIR / "run_sql_sigh.sh")
    scp_upload(sql_files + [runner_script], f"{target}:/tmp/sigh_db/", key_path=key_path)

    safe_pass = db_password.replace("'", "'\"'\"'")
    step("Ejecutando scripts SQL en orden (01 a 07)...")
    ssh_exec(
        target,
        f"echo '{db_password}' | sudo -S bash /tmp/sigh_db/run_sql_sigh.sh '{safe_pass}' && rm -rf /tmp/sigh_db /tmp/setup_vm_bd.sh",
        key_path=key_path,
    )


def deploy_application(app_ip: str, user: str, db_password: str, key_path: Path | None) -> None:
    target = f"{user}@{app_ip}"
    banner(f"CONFIGURANDO Y DESPLEGANDO APLICACIÓN EN {target}")

    step("Asegurando dependencias en la VM APP (Nginx, OpenJDK 17)...")
    setup_app_script = str(DOCS_VM_DIR / "setup_vm_app.sh")
    scp_upload([setup_app_script], f"{target}:/tmp/setup_vm_app.sh", key_path=key_path)
    ssh_exec(target, f"echo '{db_password}' | sudo -S bash /tmp/setup_vm_app.sh && rm -f /tmp/setup_vm_app.sh", key_path=key_path)

    step("Subiendo Frontend Angular a /var/www/html...")
    ssh_exec(target, "rm -rf /tmp/sigh_front_dist && mkdir -p /tmp/sigh_front_dist", key_path=key_path)
    dist_files = [str(p) for p in FRONTEND_DIST_DIR.iterdir()]
    scp_upload(dist_files, f"{target}:/tmp/sigh_front_dist/", key_path=key_path)

    ssh_exec(
        target,
        f"echo '{db_password}' | sudo -S rm -rf /var/www/html/* && "
        f"echo '{db_password}' | sudo -S cp -r /tmp/sigh_front_dist/* /var/www/html/ && "
        f"echo '{db_password}' | sudo -S chown -R www-data:www-data /var/www/html && "
        f"echo '{db_password}' | sudo -S chmod -R 755 /var/www/html && "
        "rm -rf /tmp/sigh_front_dist",
        key_path=key_path,
    )

    step(f"Subiendo {BACKEND_JAR.name} a /home/{user}/app/api/...")
    ssh_exec(target, f"mkdir -p /home/{user}/app/api", key_path=key_path)
    scp_upload([str(BACKEND_JAR)], f"{target}:/home/{user}/app/api/apihorarios-0.0.1-SNAPSHOT.jar", key_path=key_path)

    step("Reiniciando sigh-api y Nginx...")
    ssh_exec(
        target,
        f"echo '{db_password}' | sudo -S systemctl daemon-reload && "
        f"echo '{db_password}' | sudo -S systemctl enable sigh-api && "
        f"echo '{db_password}' | sudo -S systemctl restart sigh-api && "
        f"echo '{db_password}' | sudo -S nginx -t && "
        f"echo '{db_password}' | sudo -S systemctl reload nginx",
        key_path=key_path,
    )

    step("Verificando que la API responda...")
    verify_script = (
        "for i in $(seq 1 30); do "
        "  if curl -s -f http://127.0.0.1:8080/api/echo > /dev/null 2>&1; then "
        "    echo '[OK] Spring Boot levantó en el intento '$i; break; "
        "  fi; sleep 1; "
        "done; "
        "curl -s http://127.0.0.1/api/echo || true; echo ''"
    )
    ssh_exec(target, verify_script, key_path=key_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Despliega SIGH en VirtualBox.")
    parser.add_argument("--app-ip", default=DEFAULT_APP_IP)
    parser.add_argument("--db-ip", default=DEFAULT_DB_IP)
    parser.add_argument("--user", default=DEFAULT_SSH_USER)
    parser.add_argument("--key", default=None)
    parser.add_argument("--db-password", default=DEFAULT_DB_PASS)
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--only-db", action="store_true")
    parser.add_argument("--only-app", action="store_true")

    args = parser.parse_args()
    key_path = Path(args.key).resolve() if args.key else None

    if not args.only_app:
        deploy_database(args.db_ip, args.user, args.db_password, key_path)

    if not args.only_db:
        deploy_application(args.app_ip, args.user, args.db_password, key_path)

    banner("DESPLIEGUE FINALIZADO")
    print(f"  - Frontend Web:  http://{args.app_ip}/")
    print(f"  - Login directo: http://{args.app_ip}/#/login")
    print(f"  - API Echo:      http://{args.app_ip}/api/echo")
    print(f"  - Base de Datos: {args.db_ip}:5432 (sigh)\n")


if __name__ == "__main__":
    main()
