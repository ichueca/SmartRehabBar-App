#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
BACKEND_ENV="$BACKEND_DIR/.env"
PORT="${PORT:-5000}"

log() {
  echo
  echo "> $1"
}

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

log "Actualizando sistema base"
$SUDO apt update
$SUDO apt install -y git curl build-essential

if ! command -v node >/dev/null 2>&1; then
  log "Instalando Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt install -y nodejs
fi

log "Versiones detectadas"
node -v
npm -v

mkdir -p "$BACKEND_DIR/data"

if [[ ! -f "$BACKEND_ENV" ]]; then
  log "Creando backend/.env para Raspberry"
  cat > "$BACKEND_ENV" <<EOF
DATABASE_URL="file:./data/smartrehabbar.db"
NODE_ENV="production"
PORT=$PORT
CORS_ORIGIN="http://localhost:$PORT"
WEIGHT_THRESHOLD_START=5
WEIGHT_THRESHOLD_END=3
SYNC_WINDOW_MS=3000
DISPLAY_STEPS=20
BALANCE_GOOD_PERCENT=10
BALANCE_WARNING_PERCENT=20
EOF
fi

log "Instalando backend"
cd "$BACKEND_DIR"
npm install --no-fund
npx prisma generate
npx prisma db push

log "Instalando frontend"
cd "$FRONTEND_DIR"
npm ci --no-fund --no-audit || npm install --no-fund
npm run build

log "Instalacion completada"
echo "Aplicacion preparada para arrancar en http://localhost:$PORT"
echo "Siguiente paso: ./scripts/create-rpi-desktop-launcher.sh o ./scripts/launch-rpi-gui.sh"
