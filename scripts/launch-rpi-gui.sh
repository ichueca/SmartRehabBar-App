#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
LOG_DIR="$HOME/.local/share/smartrehabbar"
PID_FILE="$LOG_DIR/backend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
PORT="${PORT:-5000}"
URL="http://localhost:$PORT"
KIOSK_MODE="${1:-}"

mkdir -p "$LOG_DIR"
mkdir -p "$BACKEND_DIR/data"

is_backend_running() {
  if [[ -f "$PID_FILE" ]]; then
    PID="$(cat "$PID_FILE")"
    if kill -0 "$PID" >/dev/null 2>&1; then
      return 0
    fi
  fi
  return 1
}

start_backend() {
  cd "$BACKEND_DIR"
  NODE_ENV=production PORT="$PORT" node src/server.js > "$BACKEND_LOG" 2>&1 &
  echo $! > "$PID_FILE"
}

if [[ ! -d "$FRONTEND_DIR/dist" ]]; then
  echo "No existe frontend/dist. Ejecuta antes ./scripts/install-rpi.sh"
  exit 1
fi

if ! is_backend_running; then
  start_backend
  sleep 5
fi

if command -v chromium-browser >/dev/null 2>&1; then
  BROWSER_CMD="chromium-browser"
elif command -v chromium >/dev/null 2>&1; then
  BROWSER_CMD="chromium"
else
  BROWSER_CMD="xdg-open"
fi

if [[ "$BROWSER_CMD" == "xdg-open" ]]; then
  "$BROWSER_CMD" "$URL" >/dev/null 2>&1 &
else
  if [[ "$KIOSK_MODE" == "--kiosk" ]]; then
    "$BROWSER_CMD" --kiosk --start-fullscreen "$URL" >/dev/null 2>&1 &
  else
    "$BROWSER_CMD" --start-fullscreen "$URL" >/dev/null 2>&1 &
  fi
fi

echo "SmartRehabBar lanzado en $URL"
