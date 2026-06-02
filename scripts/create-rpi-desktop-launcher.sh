#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="SmartRehabBar"
DESKTOP_FILE_NAME="smartrehabbar.desktop"
APPLICATIONS_DIR="$HOME/.local/share/applications"
DESKTOP_DIR="$HOME/Desktop"
AUTOSTART_DIR="$HOME/.config/autostart"
DESKTOP_FILE_PATH="$APPLICATIONS_DIR/$DESKTOP_FILE_NAME"
LAUNCH_CMD="/bin/bash -lc '$REPO_ROOT/scripts/launch-rpi-gui.sh'"

mkdir -p "$APPLICATIONS_DIR"
mkdir -p "$DESKTOP_DIR"
mkdir -p "$AUTOSTART_DIR"

cat > "$DESKTOP_FILE_PATH" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_NAME
Comment=Arrancar SmartRehabBar en Raspberry Pi
Exec=$LAUNCH_CMD
Icon=web-browser
Terminal=false
Categories=Utility;Education;MedicalSoftware;
EOF

chmod +x "$DESKTOP_FILE_PATH"
cp "$DESKTOP_FILE_PATH" "$DESKTOP_DIR/$DESKTOP_FILE_NAME"
chmod +x "$DESKTOP_DIR/$DESKTOP_FILE_NAME"

echo "Acceso directo creado en el escritorio: $DESKTOP_DIR/$DESKTOP_FILE_NAME"

if [[ "${1:-}" == "--autostart" ]]; then
  cp "$DESKTOP_FILE_PATH" "$AUTOSTART_DIR/$DESKTOP_FILE_NAME"
  chmod +x "$AUTOSTART_DIR/$DESKTOP_FILE_NAME"
  echo "Autoinicio activado en: $AUTOSTART_DIR/$DESKTOP_FILE_NAME"
fi
