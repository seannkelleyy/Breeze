# 04 — Development Workflow

CI (GitHub Actions, `.github/workflows/ci.yml`) runs on every push and PR: API lint + full tests (against a Postgres service with migrations applied — integration tests included), and the web typecheck/lint/test/build gate.

## The Core Loop

```
1. Edit db/schema.hcl          add table, column, index, or constraint
2. make migrate-diff           Atlas diffs against local DB, generates SQL migration file
3. make migrate                applies migration to local DB
4. make gen                    sqlc regenerates Go DB types + gqlgen regenerates resolver stubs
5. Fix compiler errors         Go compiler tells you everywhere that needs updating
6. Write resolver logic        implement the generated resolver stubs (keep thin)
7. Write service logic         business logic, validation, transactions
8. Write tests                 mock-based unit tests in internal/service/*_test.go
```

After any change to `db/queries/*.sql` — skip steps 1-3, start at step 4.
After any change to `graph/schema.graphqls` — run `make gen`, implement new stubs.

---

## One-Command Dev Start

```bash
make dev
```

This runs the `dev` target which:
1. Checks if PostgreSQL is running; starts it via `docker compose` if not
2. Applies pending migrations with Atlas
3. Regenerates sqlc + gqlgen code
4. Runs the API server (`go run ./cmd/api/...`)

---

## Makefile Targets (breeze.api/)

Authoritative source: the `Makefile` itself. Key targets:

| Target | What it does |
|---|---|
| `make dev` | Start Postgres if needed → migrate → gen → run the API |
| `make test` / `test-verbose` / `test-coverage` | Go test suite (plain / -v / coverage profile + HTML) |
| `make gen` | sqlc generate, then gqlgen generate (order matters) |
| `make migrate-diff MIGRATION_NAME=x` | Generate a migration from schema.hcl diffs |
| `make migrate` | Apply pending migrations (Atlas, local env) |
| `make migrate-deploy` | Apply migrations in deploy environments (Render/CI) |
| `make migrate-lint` | Lint the latest migration (Atlas) |
| `make migrate-clean` | Wipe the local database schema |
| `make seed` | Apply `db/seed/seed.sql` via psql |
| `make seed-deploy` | Apply seed data on deploy hosts (`go run ./cmd/seed`) |
| `make run` / `make river` / `make build` | Run API / run River worker / build binary |
| `make lint` / `make fmt` | golangci-lint / gofmt |
| `make check` | fmt + tidy + gen, then vet, lint, test, build — full local CI gate |
| `make tidy` / `make gen-tidy` | go mod tidy / codegen + tidy |
| `make setup` | Install API tooling (golangci-lint, atlas) |
| `make db-up` | Start the root `compose.yaml` Postgres |

---

## Key Config Files

| File | Purpose |
|---|---|
| `db/schema.hcl` | Atlas — single source of truth for entire DB schema |
| `sqlc.yaml` | sqlc — reads schema from `./db/migrations`, generates to `internal/db/sqlc/` |
| `gqlgen.yml` | gqlgen — maps GraphQL schema to resolver stubs and generated models |
| `compose.yaml` (repo root) | Local dev Postgres only — never used in production |
| `.env` | Local dev environment variables (DATABASE_URL, CLERK_SECRET_KEY, etc.) |
| `atlas.hcl` | Atlas environment config |

---

## sqlc.yaml

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "./db/queries"
    schema:  "./db/migrations"
    gen:
      go:
        package:        "sqlc"
        out:            "./internal/db/sqlc"
        sql_package:    "pgx/v5"
        emit_json_tags: true
        emit_interface: true
        emit_pointers_for_null_types: true
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
  - graph/*.graphqls

exec:
  filename: graph/generated/generated.go
  package: generated

model:
  filename: graph/model/models_gen.go
  package: model

resolver:
  layout: follow-schema
  dir: graph
  package: graph
  filename_template: "{name}.resolvers.go"

autobind: []

models:
  UUID:
    model:
      - github.com/google/uuid.UUID
```

---

## compose.yaml (repo root)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: breeze-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=breeze
    volumes:
      - breeze-postgres-data:/var/lib/postgresql/data

volumes:
  breeze-postgres-data:
```

---

## Testing

Two layers, both in `internal/service/`:

1. **Unit tests** — hand-written mock queriers (no database). Tests live alongside the service file:

```
internal/service/
├── asset.go
├── asset_test.go        # mock-based tests
├── liability.go
├── liability_test.go
├── errors.go
└── ...
```

2. **Integration tests** (`integration_test.go`) — run against a live Postgres via `DATABASE_URL`; they skip automatically when the variable is unset, so `make test` stays green without a database.

Test patterns:
- Mock the narrow querier interface for each test
- Cover happy paths for Create, GetByID, List, Update, Delete
- Cover not-found behavior (`ErrNotFound`) for read/update/delete paths
- Cover decimal, UUID, nullable, and timestamp mapping behavior
- Keep unit tests focused on service logic, not DB driver behavior

See [07 — Testing Patterns](07-testing.md) for the full mock structure.

---
