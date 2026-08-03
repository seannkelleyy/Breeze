#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Start local dev environment: PostgreSQL + Woodpecker CI.
#
# Usage:
#   ./scripts/ci-local.sh          Start everything
#   ./scripts/ci-local.sh --stop   Stop everything
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${1:-}" == "--stop" ]]; then
  echo "Stopping all containers..."
  docker compose -f "$ROOT_DIR/compose.yaml" -f "$ROOT_DIR/compose.woodpecker.yaml" down
  exit 0
fi

echo "Starting PostgreSQL + Woodpecker CI..."
docker compose -f "$ROOT_DIR/compose.yaml" -f "$ROOT_DIR/compose.woodpecker.yaml" up -d

echo ""
echo "PostgreSQL:  localhost:5432"
echo "Woodpecker:  http://localhost:8000"
echo ""
echo "To stop: ./scripts/ci-local.sh --stop"
