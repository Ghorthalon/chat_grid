#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-/home/bestmidi/chgrid}"
UNIT_NAME="${2:-chat-grid.service}"
SRC_UNIT="$REPO_ROOT/deploy/systemd/$UNIT_NAME"
DST_UNIT="/etc/systemd/system/$UNIT_NAME"
SERVER_ENV_FILE="$REPO_ROOT/server/.env"
SYS_ENV_FILE="${CHGRID_SYSTEM_ENV_FILE:-/etc/sysconfig/chat-grid}"
DROPIN_DIR="/etc/systemd/system/$UNIT_NAME.d"
DROPIN_FILE="$DROPIN_DIR/env.conf"

if [[ ! -f "$SRC_UNIT" ]]; then
  echo "error: unit file not found: $SRC_UNIT" >&2
  exit 1
fi

sudo cp "$SRC_UNIT" "$DST_UNIT"
if [[ -f "$SERVER_ENV_FILE" ]]; then
  SECRET_LINE="$(grep -m1 '^CHGRID_AUTH_SECRET=' "$SERVER_ENV_FILE" || true)"
  if [[ -n "$SECRET_LINE" ]]; then
    sudo install -d -m 755 /etc/sysconfig
    sudo sh -c "printf '%s\n' \"\$1\" > \"\$2\"" _ "$SECRET_LINE" "$SYS_ENV_FILE"
    sudo chmod 600 "$SYS_ENV_FILE"
    sudo chown root:root "$SYS_ENV_FILE"
  fi
fi
sudo install -d -m 755 "$DROPIN_DIR"
sudo tee "$DROPIN_FILE" >/dev/null <<EOF
[Service]
EnvironmentFile=
EnvironmentFile=-$SYS_ENV_FILE
EOF
sudo install -d -m 0755 -o bestmidi -g bestmidi "$REPO_ROOT/server/runtime"
sudo touch "$REPO_ROOT/server/runtime/server.log"
sudo chown bestmidi:bestmidi "$REPO_ROOT/server/runtime/server.log"
sudo systemctl daemon-reload
sudo systemctl enable --now "$UNIT_NAME"
sudo systemctl restart "$UNIT_NAME"
sudo systemctl status "$UNIT_NAME" --no-pager
