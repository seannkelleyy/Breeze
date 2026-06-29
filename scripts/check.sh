#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Full monorepo clean + check.
#  1. Auto-formats all code (go fmt, prettier)
#  2. Tidies Go modules
#  3. Regenerates code (sqlc, gqlgen, graphql-codegen)
#  4. Vets, lints, tests, builds
#
# Run from repo root:  ./scripts/check.sh
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/breeze.api"
WEB_DIR="$ROOT_DIR/breeze.web"

# ─── Colours ─────────────────────────────────────────────────────
info() { printf "\033[36m━━━ %s ━━━\033[0m\n" "$*"; }
ok()   { printf "\033[32m✓ %s\033[0m\n" "$*"; }
fail() { printf "\033[31m✗ %s\033[0m\n" "$*"; exit 1; }

# ─── API ─────────────────────────────────────────────────────────
run_api() {
  cd "$API_DIR"

  info "[api] go fmt (auto-format)"
  go fmt ./...

  info "[api] go mod tidy"
  go mod tidy

  info "[api] Generate code (sqlc + gqlgen)"
  make gen

  info "[api] Vet"
  go vet ./... || fail "[api] vet"

  info "[api] Lint"
  make lint || fail "[api] lint"

  info "[api] Test"
  go test ./... -count=1 || fail "[api] test"

  info "[api] Build"
  go build -o bin/api ./cmd/api/... || fail "[api] build"

  ok "[api] clean"
}

# ─── Web ─────────────────────────────────────────────────────────
run_web() {
  cd "$WEB_DIR"

  info "[web] Prettier (auto-format)"
  npx prettier --write . --log-level warn 2>/dev/null || true

  info "[web] Generate GraphQL types from API schema"
  npm run gen 2>/dev/null || info "[web] gen skipped — run 'npm install' first"

  info "[web] Lint (auto-fix)"
  npm run lint:fix 2>/dev/null || npm run lint || fail "[web] lint"

  info "[web] TypeScript check"
  npm run typecheck || fail "[web] typecheck"

  info "[web] Build"
  npm run build || fail "[web] build"

  ok "[web] clean"
}

# ─── Run ─────────────────────────────────────────────────────────
run_api
run_web

echo ""
printf "\033[32m━━━ All checks passed ━━━\033[0m\n"
