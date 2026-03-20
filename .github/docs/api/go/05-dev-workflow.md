# 05 — Development Workflow

## The Core Loop

```
1. Edit db/schema.hcl          add table, column, index, or constraint
2. make migrate-diff           Atlas diffs against local DB, generates SQL migration file
3. make migrate-apply          applies migration to local DB
4. make gen                    sqlc regenerates Go DB types + gqlgen regenerates resolver stubs
5. Fix compiler errors         Go compiler tells you everywhere that needs updating
6. Write resolver logic        implement the generated resolver stubs (keep thin)
7. Write service logic         business logic, validation, transactions
8. Write tests                 testcontainers-go against a real Postgres instance
```

After any change to `db/queries/*.sql` — skip steps 1-3, start at step 4.
After any change to `internal/graph/schema.graphqls` — run `make gen`, implement new stubs.

---

## Makefile

```makefile
DATABASE_URL ?= postgres://budget:budget@localhost:5432/budget_dev

# Start local postgres + run API
dev:
	docker compose up -d postgres
	go run ./cmd/api

# Regenerate all generated code
gen:
	go run github.com/99designs/gqlgen generate
	sqlc generate

# Generate migration from schema.hcl changes
migrate-diff:
	atlas migrate diff \
	  --dir     "file://db/migrations" \
	  --to      "file://db/schema.hcl" \
	  --dev-url "docker://postgres/16/dev"

# Apply pending migrations to local DB
migrate-apply:
	atlas migrate apply \
	  --dir "file://db/migrations" \
	  --url "$(DATABASE_URL)"

# Lint migrations — catch destructive changes before pushing
migrate-lint:
	atlas migrate lint \
	  --dir     "file://db/migrations" \
	  --dev-url "docker://postgres/16/dev" \
	  --latest  1

# Cross-compile for Linux ARM64 (Hetzner CAX or Fly.io arm)
build:
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
	  go build -ldflags="-w -s" -o budget-api ./cmd/api

# Run all tests with race detector
test:
	go test ./... -race -count=1

# Lint
lint:
	go vet ./...

# Deploy — migrate first, then ship binary
deploy: build migrate-apply
	scp budget-api user@yourserver.com:/opt/budget-api/budget-api.new
	ssh user@yourserver.com \
	  "mv /opt/budget-api/budget-api.new /opt/budget-api/budget-api \
	   && systemctl restart budget-api"

.PHONY: dev gen migrate-diff migrate-apply migrate-lint build test lint deploy
```

---

## Key Config Files

| File | Purpose |
|---|---|
| `db/schema.hcl` | Atlas — single source of truth for entire DB schema |
| `sqlc.yaml` | sqlc — maps schema to generated Go, decimal + UUID type overrides |
| `gqlgen.yml` | gqlgen — maps GraphQL schema to resolver stubs and generated models |
| `docker-compose.yml` | Local dev Postgres only — never used in production |
| `fly.toml` | Fly.io app config — committed to git |
| `infra/main.go` | Pulumi IaC — provisions Neon DB, Fly app, secrets |
| `.github/copilot-instructions.md` | Copilot repo-wide context — always loaded |

---

## sqlc.yaml

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "db/queries"
    schema:  "db/schema.hcl"
    gen:
      go:
        package:        "db"
        out:            "internal/db"
        emit_json_tags: true
        emit_db_tags:   true
        sql_driver:     "pgx/v5"
        overrides:
          - db_type: "uuid"
            go_type:
              import: "github.com/google/uuid"
              type:   "UUID"
          - db_type: "numeric"
            go_type:
              import: "github.com/govalues/decimal"
              type:   "Decimal"
          - db_type: "pg_catalog.numeric"
            go_type:
              import: "github.com/govalues/decimal"
              type:   "Decimal"
```

---

## gqlgen.yml

```yaml
schema:
  - internal/graph/*.graphqls

exec:
  filename: internal/graph/generated/generated.go
  package: generated

model:
  filename: internal/graph/model/models_gen.go
  package: model

resolver:
  layout: follow-schema
  dir: internal/graph/resolver
  package: resolver
  filename_template: "{name}.resolvers.go"

autobind: []

models:
  UUID:
    model:
      - github.com/google/uuid.UUID
```

---

## Docker Compose (local dev only)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB:       budget_dev
      POSTGRES_USER:     budget
      POSTGRES_PASSWORD: budget
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

---

## Testing with testcontainers-go

Service tests use a real Postgres container — not mocks. Integration tests are more valuable than unit tests with mocked DBs for this project.

```go
func TestBudgetService(t *testing.T) {
    ctx := context.Background()

    // Spin up real Postgres
    container, err := postgres.RunContainer(ctx,
        testcontainers.WithImage("postgres:16-alpine"),
        postgres.WithDatabase("budget_test"),
        postgres.WithUsername("budget"),
        postgres.WithPassword("budget"),
    )
    require.NoError(t, err)
    defer container.Terminate(ctx)

    // Run Atlas migrations
    connStr, _ := container.ConnectionString(ctx, "sslmode=disable")
    // ... apply migrations, create service, run tests
}
```

Test file naming: `expense_service_test.go` alongside `expense_service.go`.
Use `t.Helper()` in helper functions. Use `t.Cleanup()` for teardown. Always test the error path.

---

## VS Code Extensions

| Extension | Priority |
|---|---|
| `golang.go` | Essential |
| `github.copilot` + `github.copilot-chat` | Essential |
| `graphql.vscode-graphql` + `graphql.vscode-graphql-syntax` | Essential |
| `hashicorp.hcl` | Essential — Atlas schema.hcl syntax |
| `usernamehw.errorlens` | Strongly recommended — inline errors as you type |
| `mtxr.sqltools` + `mtxr.sqltools-driver-pg` | Strongly recommended — query Neon from VS Code |
| `ms-azuretools.vscode-docker` | Recommended |
| `editorconfig.editorconfig` | Recommended |
| `eamodio.gitlens` | Optional |
