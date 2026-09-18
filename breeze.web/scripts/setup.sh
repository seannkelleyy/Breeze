#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Web-only setup — installs npm dependencies.
#
# Usage:  ./scripts/setup.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
DIM='\033[2m'
RESET='\033[0m'

info() { printf "${CYAN}[%s]${RESET} %s\n" "$1" "$2"; }
ok()   { printf "${GREEN}[%s]${RESET} %s\n" "$1" "$2"; }
warn() { printf "${YELLOW}[%s]${RESET} %s\n" "$1" "$2"; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v node &>/dev/null; then
  warn "node" "Node.js not found. Install via: brew install node"
  exit 1
fi

if [ -d "$ROOT/node_modules" ]; then
  ok "web" "node_modules already exists."
else
  info "web" "Installing npm dependencies..."
  (cd "$ROOT" && npm install) 2>&1 | while IFS= read -r line; do printf "${DIM}"; printf "[%s] " "web"; printf "%s${RESET}\n" "$line"; done
  ok "web" "Dependencies installed."
fi

echo ""
ok "setup" "Web tools ready."
echo ""
