#!/usr/bin/env bash
# ==============================================================================
# SIGH - Setup y Reparación Automática de PostgreSQL (VirtualBox)
# IP VM BD: 192.168.78.126
# ==============================================================================
set -e

echo "=== [1/5] Verificando e instalando PostgreSQL ==="
sudo apt update -y
sudo apt install -y postgresql postgresql-contrib

PG_VERSION=$(ls /etc/postgresql/ 2>/dev/null | head -n 1)
if [ -z "$PG_VERSION" ]; then
    PG_VERSION="18"
fi
echo "Versión de PostgreSQL: $PG_VERSION"

echo "=== [2/5] Diagnosticando estado del cluster PostgreSQL ==="
CLUSTER_STATUS=$(sudo -u postgres pg_lsclusters 2>/dev/null | grep -E "^$PG_VERSION\s+main" | awk '{print $4}' || true)
echo "Estado actual del cluster ($PG_VERSION main): '$CLUSTER_STATUS'"

# Si el cluster no existe o no está online, repararlo / recrearlo
if [ "$CLUSTER_STATUS" != "online" ]; then
    echo "[!] Cluster caído o inexistente. Recreando cluster limpio para garantizar socket e integridad..."
    sudo pg_dropcluster "$PG_VERSION" main --stop 2>/dev/null || true
    sudo pg_createcluster -u postgres -g postgres -e UTF-8 "$PG_VERSION" main --start
fi

PG_DIR="/etc/postgresql/$PG_VERSION/main"
PG_CONF="$PG_DIR/postgresql.conf"
PG_HBA="$PG_DIR/pg_hba.conf"

echo "=== [3/5] Configurando listen_addresses y conf.d ==="
sudo mkdir -p "$PG_DIR/conf.d"
echo "listen_addresses = '*'" | sudo tee "$PG_DIR/conf.d/sigh.conf" > /dev/null
# Asegurar también al final de postgresql.conf
echo "listen_addresses = '*'" | sudo tee -a "$PG_CONF" > /dev/null

echo "=== [4/5] Autorizando conexiones remotas en pg_hba.conf ==="
sudo sed -i '/# Regla SIGH VM APP/d' "$PG_HBA" 2>/dev/null || true
sudo sed -i '/192.168.78./d' "$PG_HBA" 2>/dev/null || true

sudo tee -a "$PG_HBA" > /dev/null <<'EOT'

# Regla SIGH VM APP (VirtualBox)
host    all    all    192.168.78.0/24    scram-sha-256
host    all    all    192.168.78.0/24    md5
EOT

echo "=== [5/5] Reiniciando y verificando disponibilidad de PostgreSQL ==="
sudo pg_ctlcluster "$PG_VERSION" main restart || sudo systemctl restart postgresql

ONLINE=0
for i in $(seq 1 20); do
    if sudo -u postgres pg_isready -h 127.0.0.1 -p 5432 -q || sudo -u postgres pg_isready -q; then
        echo "[OK] PostgreSQL activo y respondiendo consultas en el intento $i."
        ONLINE=1
        break
    fi
    sleep 1
done

if [ "$ONLINE" -ne 1 ]; then
    echo "[ERROR] PostgreSQL no pudo levantar. Logs detallados:"
    sudo -u postgres pg_lsclusters || true
    sudo journalctl -u postgresql@"$PG_VERSION"-main --no-pager -n 30 || true
    exit 1
fi

echo ""
echo "=== PostgreSQL Versión ==="
sudo -u postgres psql -c "SELECT version();"
echo ""
echo "=== Clusters Activos ==="
sudo -u postgres pg_lsclusters
