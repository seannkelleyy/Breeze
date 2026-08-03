#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Unified dev launcher — starts Colima, Postgres, API, and Web.
# All logs stream to one console with coloured prefixes.
#
# Usage:  ./scripts/dev.sh
# Stop:   Ctrl-C (gracefully kills everything)
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/Breeze.Api"
WEB_DIR="$ROOT/Breeze.Web"

# ─── Colours ─────────────────────────────────────────────────────
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

# ─── Cleanup on exit ─────────────────────────────────────────────
PIDS=()
cleanup() {
  echo ""
  info "dev" "Shutting down..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
  ok "dev" "All processes stopped."
}
trap cleanup EXIT INT TERM

# ─── 1. Colima ───────────────────────────────────────────────────
if command -v colima &>/dev/null; then
  if ! colima status &>/dev/null 2>&1; then
    info "colima" "Starting Colima..."
    colima start 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "colima"; printf "%s${RESET}\n" "$line"; done
    ok "colima" "Started."
  else
    ok "colima" "Already running."
  fi
else
  warn "colima" "Not installed — skipping (install: brew install colima)"
fi

# ─── 2. Docker / Postgres ────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  err "docker" "Docker is not available. Install Colima or Docker Desktop."
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  err "docker" "Docker daemon is not responding."
  exit 1
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'breeze-postgres'; then
  ok "postgres" "Already running."
else
  info "postgres" "Starting PostgreSQL..."
  docker compose -f "$ROOT/compose.yaml" up -d postgres 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "postgres"; printf "%s${RESET}\n" "$line"; done

  # Wait for postgres to accept connections
  info "postgres" "Waiting for database to be ready..."
  for i in $(seq 1 30); do
    if docker exec breeze-postgres pg_isready -U postgres &>/dev/null 2>&1; then
      ok "postgres" "Ready."
      break
    fi
    if [ "$i" -eq 30 ]; then
      err "postgres" "Timed out waiting for database."
      exit 1
    fi
    sleep 1
  done
fi

# ─── 3. Migrations + Codegen ─────────────────────────────────────
cd "$API_DIR"

info "api" "Applying migrations..."
export $(cat .env | xargs) && atlas migrate apply --env local 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "migrate"; printf "%s${RESET}\n" "$line"; done
ok "api" "Migrations applied."

info "api" "Generating code (sqlc + gqlgen)..."
make gen 2>&1 | while IFS= read -r line; do printf "${DIM}"; tag "codegen"; printf "%s${RESET}\n" "$line"; done
ok "api" "Code generated."

# ─── 4. Start API ────────────────────────────────────────────────
info "api" "Starting API server..."
(
  cd "$API_DIR"
  go run ./cmd/api/... 2>&1 | while IFS= read -r line; do
    printf "${GREEN}"; tag "api"; printf "%s${RESET}\n" "$line"
  done
) &
PIDS+=($!)

# Give the API a moment to start
sleep 2

# ─── 5. Start Web ────────────────────────────────────────────────
info "web" "Starting Web dev server..."
(
  cd "$WEB_DIR"
  npm run dev 2>&1 | while IFS= read -r line; do
    printf "${YELLOW}"; tag "web"; printf "%s${RESET}\n" "$line"
  done
) &
PIDS+=($!)

# ─── 6. Wait ─────────────────────────────────────────────────────
echo ""
ok "dev" "All services running. Press Ctrl-C to stop."
echo ""
printf "  ${CYAN}API${RESET}  → http://localhost:8080\n"
printf "  ${CYAN}Web${RESET}  → http://localhost:3000\n"
printf "  ${CYAN}DB${RESET}   → postgres://localhost:5432\n"
echo ""

# Wait for any child to exit (keeps script alive)
wait -n 2>/dev/null || wait
