#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${1:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
PUBLISH_DIR="${2:-$REPO_ROOT/deploy/publish/chgrid}"
BASE_PATH="${3:-/chgrid/}"
SERVICE_NAME="${4:-chat-grid.service}"

"$REPO_ROOT/deploy/scripts/deploy_client.sh" "$REPO_ROOT" "$PUBLISH_DIR" "$BASE_PATH"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
