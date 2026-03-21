# API — Copilot Instructions

Go 1.23 + gqlgen + sqlc + Atlas + PostgreSQL personal finance planner.
Full docs in .github/instructions/.

## Stack

- GraphQL server: gqlgen
- DB queries: sqlc + pgx/v5
- Schema/migrations: Atlas (schema.hcl is source of truth)
- Decimal math: govalues/decimal — never float64 for money
- Auth: Clerk (isolated to internal/middleware/auth.go only)
- Background jobs: riverqueue/river
- Logging: slog — always from context, never global

## Hard rules — apply everywhere

- Three layers only: resolver → service → db. Never skip or reverse.
- No business logic in resolvers. No SQL in resolvers or services.
- Every mutation touching multiple tables uses an explicit pgx transaction.
- Every query filters WHERE deleted_at IS NULL — no exceptions.
- Never use float64 for money — always govalues/decimal.
- Never generate UUIDs in Go — let Postgres gen_random_uuid() handle it.
- Never call os.Getenv in business logic — use internal/config/config.go.
- Never import Clerk SDK outside internal/middleware/auth.go.
- DataLoaders required for any resolver field loading children of a list.
- Always update last_value_updated_at when changing Asset.current_value.
- Always update last_balance_updated_at when changing Liability.current_balance.

## Generated code — never edit

- internal/db/ sqlc output — run: make gen
- internal/graph/generated/ gqlgen output — run: make gen
- db/migrations/ Atlas output — run: make migrate-diff

# Web - Copilot Instructions
