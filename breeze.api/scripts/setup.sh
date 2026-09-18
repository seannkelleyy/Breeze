#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# API-only setup — installs tool dependencies.
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

install_brew() {
  local name="$1"
  local tap="${2:-}"
  if command -v "$name" &>/dev/null; then
    ok "$name" "Already installed."
    return
  fi
  info "$name" "Installing via Homebrew..."
  if [ -n "$tap" ]; then
    brew install "$tap/$name" 2>&1 | while IFS= read -r line; do printf "${DIM}"; printf "[%s] " "$name"; printf "%s${RESET}\n" "$line"; done
  else
    brew install "$name" 2>&1 | while IFS= read -r line; do printf "${DIM}"; printf "[%s] " "$name"; printf "%s${RESET}\n" "$line"; done
  fi
  ok "$name" "Installed."
}

if command -v brew &>/dev/null; then
  install_brew golangci-lint
  install_brew atlas ariga/tap
else
  warn "brew" "Homebrew not found — install manually:"
  warn "" "  brew install golangci-lint ariga/tap/atlas"
fi

ok "sqlc" "Runs via go run — no install needed."
ok "gqlgen" "Runs via go run — no install needed."

echo ""
ok "setup" "API tools ready."
echo ""
