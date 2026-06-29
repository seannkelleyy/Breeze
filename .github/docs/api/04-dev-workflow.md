# 05 — Development Workflow

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

## Makefile (actual — breeze.api/)

```makefile
# Run tests
test:
	go test ./...

test-verbose:
	go test -v ./...

test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

# Code generation
gen:
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@latest generate
	go run github.com/99designs/gqlgen@v0.17.89 generate

# Migrations
migrate:
	export $(shell cat .env | xargs) && atlas migrate apply --env local

migrate-diff:
	export $(shell cat .env | xargs) && atlas migrate diff $(MIGRATION_NAME) --env local

migrate-clean:
	export $(shell cat .env | xargs) && atlas schema clean --env local

migrate-lint:
	export $(shell cat .env | xargs) && atlas migrate lint --env local --latest 1

# Start PostgreSQL
db-up:
	docker compose -f ../compose.yaml up -d postgres

# Run the API
run:
	go run ./cmd/api/...

# Run River job runner
river:
	go run ./cmd/river/...

# Build binary
build:
	go build -o bin/api ./cmd/api/...

# Lint + format
lint:
	golangci-lint run ./...

fmt:
	go fmt ./...

clean: lint fmt

# All-in-one dev start
dev:
	@if ! docker ps --format '{{.Names}}' | grep -q 'breeze-postgres'; then \
		docker compose -f ../compose.yaml up -d postgres; \
		sleep 2; \
	fi
	make migrate
	make gen
	go run ./cmd/api/...
```

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

Service tests use **mocked `sqlc.Querier` interfaces** (not testcontainers). Tests live alongside the service file:

```
internal/service/
├── asset.go
├── asset_test.go        # mock-based tests
├── liability.go
├── liability_test.go
├── errors.go
└── ...
```

Test patterns:
- Mock the `sqlc.Querier` interface for each test
- Cover happy paths for Create, GetByID, List, Update, Delete
- Cover not-found behavior (`ErrNotFound`) for read/update/delete paths
- Cover decimal, UUID, nullable, and timestamp mapping behavior
- Keep tests focused on service logic, not DB driver behavior

---
