# 06 — Vertical Slice Whole-Stack Playbook

This guide is the generic, reusable process for adding a new backend slice in this repo.

Use it for any domain area, for example:

- budgets
- accounts
- liabilities
- incomes
- users

The same sequence applies every time:

- DB schema (Atlas)
- SQL queries (sqlc)
- Service layer
- GraphQL schema + resolvers (gqlgen)
- Server wiring
- Auth/rate-limit behavior by environment
- Tests + smoke checks

## 1. Architecture Guardrails

Keep these rules for every slice:

- Resolver -> Service -> DB only. Never skip layers.
- No SQL in resolvers or services.
- No business logic in resolvers.
- Every read query filters active rows with `deleted_at IS NULL`.
- Every mutation that touches multiple tables uses an explicit pgx transaction.
- Never use float64 for money/rates. Use govalues/decimal.
- Never generate UUIDs in Go; let Postgres `gen_random_uuid()` do it.
- Never hand-edit generated files.

Generated boundaries in this repo:

- Do not edit `internal/db/sqlc` directly (sqlc output).
- Do not edit `graph/generated` or `graph/model/models_gen.go` directly (gqlgen output).
- Do not hand-author Atlas migration SQL unless intentional; prefer Atlas diff generation.

## 2. Naming Template for a New Slice

Use this template in your head while implementing:

- Table: `<slice_plural>` (example: `budgets`, `accounts`)
- Query file: `db/queries/<slice_plural>.sql`
- Service file: `internal/service/<slice_singular>.go`
- Helper file: `graph/<slice_singular>_helpers.go`
- GraphQL types: `<Slice>` and `<Slice>Input` style names
- Query names in sqlc: `Create<Slice>`, `Get<Slice>ByID`, `List<SlicePlural>`, `Update<Slice>`, `SoftDelete<Slice>`

## 3. End-to-End Steps

### Step A: Model the DB in Atlas

Edit `db/schema.hcl` first (source of truth).

Add what the slice needs:

- New table(s), enums, constraints, and foreign keys.
- Nullable `deleted_at` for soft delete.
- `created_at` and `updated_at` timestamps.
- Indexes for high-frequency filters/joins.
- Partial indexes for active rows when helpful.

If the slice has money/rates:

- Use numeric/decimal-compatible DB types.
- Keep GraphQL wire format as string (never float).

### Step B: Generate and Apply Migration

Run from `breeze.api`:

```bash
make migrate-diff MIGRATION_NAME=<slice_name>
make migrate
```

Expected outcome:

- New migration file under `db/migrations/`.
- `db/migrations/atlas.sum` updated.

### Step C: Add sqlc Queries

Create or update `db/queries/<slice_plural>.sql`.

At minimum, define:

- Create (usually `:one`)
- Get by ID (`:one`)
- List (`:many`)
- Update (`:one`)
- Soft delete (`:execrows`)

Query rules:

- SELECT only fields needed by API/service.
- Every read path includes `deleted_at IS NULL`.
- Soft delete sets `deleted_at` and updates `updated_at`.
- Use `:execrows` for delete/update when service must detect not-found.

### Step D: Regenerate Code

```bash
make gen
```

This regenerates sqlc and gqlgen artifacts.

If generation fails, fix source files first (`schema.hcl`, `.sql`, `schema.graphqls`), then rerun.

### Step E: Implement Service Layer

Implement business logic in `internal/service/<slice_singular>.go`.

Typical service methods:

- Create
- GetByID
- List
- Update
- Delete

Service responsibilities:

- Validate and normalize inputs.
- Convert decimal strings to/from `decimal.Decimal` and DB numeric types.
- Convert UUID wrappers and nullable fields safely.
- Map `pgx.ErrNoRows` and 0 affected rows to `ErrNotFound`.
- Handle transactions when multiple tables are mutated.
- Return clean domain structs for resolver mapping.

### Step F: Extend GraphQL Contract

Update `graph/schema.graphqls`:

- Add/extend enums and object types.
- Add create/update input types.
- Add query fields (single + list as needed).
- Add mutation fields.

Contract rules:

- Monetary and rate values are `String` in GraphQL.
- Nullable DB fields should map intentionally to nullable GraphQL fields.

### Step G: Implement Resolvers and Mappers

- Add the new service dependency in `graph/resolver.go`.
- Implement resolver methods in `graph/schema.resolvers.go`.
- Put type conversion helpers in a dedicated file (for example `graph/<slice_singular>_helpers.go`).

Resolver rules:

- Parse IDs and delegate to service.
- Keep resolvers thin.
- Return `null` for nullable not-found reads when contract allows.
- Avoid N+1 queries for child fields on list results. Prefer a batched/aggregate sqlc query; add and wire a request-scoped DataLoader only for a genuine N+1 case.

### Step H: Wire the Slice in Server Bootstrap

Update `cmd/api/main.go`:

- Instantiate sqlc queries from DB pool.
- Instantiate the new service.
- Inject service into `graph.Resolver`.
- Ensure GraphQL handlers are registered.

### Step I: Write Service Layer Tests

Create `internal/service/<slice_singular>_test.go` with unit tests that cover:

- Happy paths for Create, GetByID, List, Update, Delete.
- Not-found behavior (`ErrNotFound`) for read/update/delete paths.
- Error wrapping for unexpected DB errors.
- Decimal, UUID, nullable, and timestamp mapping behavior where relevant.

Test pattern:

- Mock the `sqlc.Querier` interface in tests.
- Keep tests focused on service logic, not DB driver behavior.

### Step J: Keep Environment-Aware Middleware Behavior

Current behavior in `cmd/api/main.go`:

- `ENV` and `CLERK_SECRET_KEY` are mandatory at startup, including in local development. Set `ENV=local` and use the Clerk secret key from a development instance in the local `.env` file.
- `/query` always uses Clerk auth; requests without a valid bearer token are rejected. There is no fixed-user development bypass.
- The per-client rate limiter is enabled outside local environments and applies to `/query`; `/health` remains public and checks database readiness.
- `TRUSTED_PROXY_CIDRS` is optional. Forwarded client IP headers are honored only when the immediate peer matches one of these configured CIDRs; otherwise the socket peer address is used. `API_RATE_LIMIT_RPS` and `API_RATE_LIMIT_BURST` configure the non-local `/query` limit.

When changing auth behavior, preserve the rule that all GraphQL traffic is authenticated in every environment, and verify the actual middleware wiring in `cmd/api/main.go`.

## 4. File Checklist by Layer

When adding a new slice, expect to touch most of these:

- `db/schema.hcl`
- `db/migrations/*` (generated)
- `db/queries/<slice_plural>.sql`
- `internal/db/sqlc/*` (generated)
- `internal/service/errors.go` (if new sentinel errors)
- `internal/service/<slice_singular>.go`
- `internal/service/<slice_singular>_test.go`
- `graph/schema.graphqls`
- `graph/resolver.go`
- `graph/schema.resolvers.go`
- `graph/<slice_singular>_helpers.go`
- `graph/generated/*` (generated)
- `graph/model/models_gen.go` (generated)
- `cmd/api/main.go`

## 5. Validation Checklist

Run from `breeze.api`:

```bash
make gen
go test ./...
make build
```

Auth behavior check in strict mode (no token should fail):

```bash
ENV=production PORT=8081 make run
curl -i -X POST http://127.0.0.1:8081/query \
  -H "Content-Type: application/json" \
  --data '{"query":"query { __typename }"}'
```

Expected: 403 Forbidden.

Local mode uses the same Clerk authentication as deployed environments. Set `ENV=local` and `CLERK_SECRET_KEY` in `.env`, then send a valid Clerk session token:

```bash
curl -i -X POST http://127.0.0.1:8080/query \
  -H "Authorization: Bearer <clerk-session-token>" \
  -H "Content-Type: application/json" \
  --data '{"query":"query { __typename }"}'
```

Without a valid token, expect `403 Forbidden`.

## 6. Smoke-Test GraphQL Flow (Generic)

Use this sequence for any slice:

1. Create entity
2. Fetch single by ID
3. List entities
4. Update entity
5. Delete entity (soft delete)
6. List/fetch again to verify soft-delete behavior

## 7. Common Pitfalls

- Editing generated files directly.
- Forgetting `deleted_at IS NULL` in read queries.
- Using float64 anywhere for money/rates.
- Making auth optional in strict env by using the wrong middleware helper.
- Leaving conversion helpers in a spot where gqlgen regeneration can overwrite them.
- Skipping transactions for multi-table mutations.

## 8. Quick Command Block

```bash
# from repo root
cd breeze.api

# schema -> migration
make migrate-diff MIGRATION_NAME=<slice_name>
make migrate

# sqlc + gqlgen
make gen

# verify
go test ./...
make build

# run local (Clerk auth required; rate limit disabled)
ENV=local make run

# run strict (Clerk auth + rate limit)
ENV=production make run
```
