#!/usr/bin/env bash
# ==============================================================================
# SIGH - Ejecución ordenada de scripts SQL en la Base de Datos
# Uso: bash run_sql_sigh.sh <app_password>
# ==============================================================================
set -e

APP_PASSWORD="${1:-1234}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== [1/7] 01_ddl.sql (Crear BD sigh y 20 tablas) ==="
sudo -u postgres psql -f 01_ddl.sql

echo "=== [2/7] 02_catalogos.sql (Cargar franjas y roles) ==="
sudo -u postgres psql -d sigh -f 02_catalogos.sql

echo "=== [3/7] 03_funciones_triggers.sql (6 disparadores de reglas) ==="
sudo -u postgres psql -d sigh -f 03_funciones_triggers.sql

echo "=== [4/7] 04_vistas.sql (7 vistas del sistema) ==="
sudo -u postgres psql -d sigh -f 04_vistas.sql

echo "=== [5/7] 05_roles_permisos.sql (Roles y seguridad RNF-04) ==="
sudo -u postgres psql -d sigh -v app_password="$APP_PASSWORD" -f 05_roles_permisos.sql

echo "=== [6/7] 06_datos_prueba.sql (Datos de períodos, docentes y horario) ==="
sudo -u postgres psql -d sigh -f 06_datos_prueba.sql

echo "=== [7/7] 07_pruebas_reglas.sql (Verificación de 46 pruebas) ==="
sudo -u postgres psql -d sigh -f 07_pruebas_reglas.sql

echo ""
echo "=========================================================================="
echo " ¡BASE DE DATOS SIGH INICIALIZADA EXITOSAMENTE! (Resumen 46|46|0 esperado)"
echo "=========================================================================="
