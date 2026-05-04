#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/breeze.api"
WEB_DIR="$ROOT_DIR/breeze.web"

run_api_checks() {
  cd "$API_DIR"

  echo "==> [api] Generate code (sqlc + gqlgen)"
  make gen

  echo "==> [api] Vet"
  go vet ./...

  echo "==> [api] Check gofmt"
  unformatted=$(gofmt -l .)
  if [ -n "$unformatted" ]; then
    echo "gofmt needs to be run on the following files:"
    echo "$unformatted"
    exit 1
  fi

  echo "==> [api] Lint"
  make lint

  echo "==> [api] Test"
  make test

  echo "==> [api] Build"
  make build
}

run_web_checks() {
  cd "$WEB_DIR"

  echo "==> [web] Lint"
  npm run lint

  echo "==> [web] Typecheck"
  npx tsc --noEmit

  if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)"; then
    echo "==> [web] Test"
    npm test
  else
    echo "==> [web] Test skipped (no test script in package.json)"
  fi

  echo "==> [web] Build"
  npm run build
}

run_api_checks
run_web_checks

echo "==> All API and web checks passed"
