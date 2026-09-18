#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# API setup — installs tool dependencies, runs migrations + codegen.
#
# Usage:  ./scripts/setup.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
DIM='\033[2m'
RESET='\033[0m'

tag() { printf "${CYAN}[%s]${RESET} " "$1"; }
info() { printf "${CYAN}[%s]${RESET} %s\n" "$1" "$2"; }
ok()   { printf "${GREEN}[%s]${RESET} %s\n" "$1" "$2"; }
warn() { printf "${YELLOW}[%s]${RESET} %s\n" "$1" "$2"; }
err()  { printf "${RED}[%s]${RESET} %s\n" "$1" "$2"; }

# ─── 1. Homebrew tools ───────────────────────────────────────────
install_brew() {
  local name="$1"
  local tap="${2:-}"
  if command -v "$name" &>/dev/null; then
    ok "$name" "Already installed."
    return
  fi
  info "$name" "Installing via Homebrew..."
  if [ -n "$tap" ]; then
    brew install "$tap/$name" 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "$name"; printf "%s${RESET}\n" "$line"; done
  else
    brew install "$name" 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "$name"; printf "%s${RESET}\n" "$line"; done
  fi
  ok "$name" "Installed."
}

if command -v brew &>/dev/null; then
  install_brew golangci-lint
  install_brew atlas ariga/tap
else
  warn "brew" "Homebrew not found — install golangci-lint and atlas manually:"
  warn "" "  brew install golangci-lint ariga/tap/atlas"
fi

# ─── 2. Go tools (no install needed — run via go run) ────────────
ok "sqlc" "Runs via go run — no install needed."
ok "gqlgen" "Runs via go run — no install needed."

# ─── 3. Start Postgres ──────────────────────────────────────────
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'breeze-postgres'; then
    ok "postgres" "Already running."
  else
    info "postgres" "Starting PostgreSQL..."
    docker compose -f "$ROOT/compose.yaml" up -d postgres 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "postgres"; printf "%s${RESET}\n" "$line"; done

    info "postgres" "Waiting for database..."
    for i in $(seq 1 30); do
      if docker exec breeze-postgres pg_isready -U postgres &>/dev/null 2>&1; then
        ok "postgres" "Ready."
        break
      fi
      [ "$i" -eq 30 ] && { err "postgres" "Timed out."; exit 1; }
      sleep 1
    done
  fi
else
  warn "postgres" "Docker not available — skipping. Start Postgres manually."
fi

# ─── 4. Migrations + Codegen ────────────────────────────────────
cd "$ROOT"

if [ -f breeze.api/.env ]; then
  info "api" "Applying migrations..."
  (cd breeze.api && export $(cat .env | xargs) && atlas migrate apply --env local) 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "migrate"; printf "%s${RESET}\n" "$line"; done
  ok "api" "Migrations applied."

  info "api" "Generating code (sqlc + gqlgen)..."
  (cd breeze.api && export $(cat .env | xargs) && make gen) 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "codegen"; printf "%s${RESET}\n" "$line"; done
  ok "api" "Code generated."
else
  warn "api" "No .env file found — skipping migrations and codegen."
fi

# ─── 5. Web dependencies ────────────────────────────────────────
if [ -d breeze.web/node_modules ]; then
  ok "web" "node_modules already exists."
else
  info "web" "Installing npm dependencies..."
  (cd breeze.web && npm install) 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "web"; printf "%s${RESET}\n" "$line"; done
  ok "web" "Dependencies installed."
fi

echo ""
ok "setup" "API setup complete."
echo ""
printf "  Run everything:  ${CYAN}./scripts/dev.sh${RESET}\n"
printf "  API check:       ${CYAN}cd breeze.api && make check${RESET}\n"
printf "  Web check:       ${CYAN}cd breeze.web && npm run check${RESET}\n"
echo ""
