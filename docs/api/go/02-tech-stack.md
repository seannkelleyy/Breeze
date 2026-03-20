# 02 — Tech Stack

## Complete Toolset

| Concern | Tool | Status |
|---|---|---|
| Language | Go 1.23+ | ✓ Chosen |
| Schema management | Atlas (Ariga) | ✓ Chosen |
| Type-safe queries | sqlc + pgx/v5 | ✓ Chosen |
| GraphQL server | gqlgen | ✓ Chosen |
| Decimal math | govalues/decimal | ✓ Chosen |
| Auth | Clerk | ✓ Chosen |
| Logging | slog (stdlib) | ✓ Chosen |
| Config | caarlos0/env | ✓ Chosen |
| DataLoaders | graph-gophers/dataloader | ✓ Chosen |
| Error tracking | Sentry | Add now |
| Background jobs | riverqueue/river | Add now |
| Testing | testcontainers-go | Add now |
| Rate limiting | golang.org/x/time/rate | Add now |
| File storage | Tigris or Cloudflare R2 | Decide before HSA feature |
| Encryption | AES-256-GCM (stdlib) | Add before Plaid feature |
| IaC | Pulumi (Go) | ✓ Chosen |
| Database | PostgreSQL 16 (Neon serverless) | ✓ Chosen |
| Hosting | Fly.io or Hetzner VPS | ✓ Chosen |
| Frontend build | Vite | ✓ Chosen |
| Frontend UI | React + shadcn/ui + Tailwind | ✓ Chosen |
| Frontend GraphQL | urql + graphql-codegen | ✓ Chosen |

---

## Why Go

- Single static binary — no runtime, no framework, copy and run anywhere
- ~15MB Docker image vs 200-300MB for .NET
- Millisecond cold starts vs 1-3 seconds for .NET
- No cloud platform gravity — runs identically on Fly.io, Hetzner, AWS, a bare VPS
- ARM64 support is first-class — run on cheaper Hetzner CAX instances
- Cross-compile with two env vars: `GOOS=linux GOARCH=arm64 go build`
- Kubernetes ecosystem is written in Go — tooling aligns naturally

## Why GraphQL over REST

- Data is deeply relational — budgets own categories own expenses with splits
- Client requests exactly the shape it needs — no over/under fetching
- Derived fields (TotalSpent, Remaining, EstimatedCurrentValue) are computed resolver fields
- graphql-codegen generates TypeScript types + React hooks from the Go schema — end-to-end type safety

## Why Atlas

- Schema-as-code — `schema.hcl` is the single source of truth for DB structure
- Declarative diffing — edit the file, Atlas generates the SQL migration
- sqlc reads the same `schema.hcl` — one file drives both migrations and Go type generation
- `atlas migrate lint` catches destructive changes before they reach production
- Mental model: "Terraform for your database schema"

## Why govalues/decimal

- Never use `float64` for money — silent precision errors on financial calculations
- govalues is faster than shopspring, cleaner API than ericlagergren
- Immutable fluent style: `allocation.Add(rollover).Sub(spent)`
- Purpose-built for transactional financial systems, cross-validated via fuzz testing
- Always call `.Round(2)` on monetary values before returning in a GraphQL response

## Why urql over Apollo Client

- Lighter and simpler — less config for a solo dev
- Per-user financial data doesn't need aggressive cross-component caching
- Apollo is better when you have complex shared cache needs across many components

---

## Open Source & Lock-in Risk

Every tool is MIT or Apache 2.0 licensed, or has a clean migration path.

**One genuine lock-in risk: Clerk.** Mitigated by isolating it entirely behind `internal/middleware/auth.go`. Resolvers and services never import the Clerk SDK directly — they only call `middleware.UserIDFromCtx(ctx)`. Swapping auth providers is then a single file change.

**File storage (Tigris / R2)** — both are S3-compatible. Your Go code uses the standard AWS S3 SDK pointed at their endpoint. Switching providers is one config change, zero code change.

---

## Install Everything

```bash
# Atlas
curl -sSf https://atlasgo.sh | sh

# sqlc
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# gqlgen
go install github.com/99designs/gqlgen@latest

# Go packages
go get github.com/99designs/gqlgen
go get github.com/jackc/pgx/v5/pgxpool
go get github.com/govalues/decimal
go get github.com/google/uuid
go get github.com/caarlos0/env/v11
go get github.com/graph-gophers/dataloader/v7
go get github.com/riverqueue/river
go get github.com/riverqueue/river/riverdriver/riverpgxv5
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
go get github.com/getsentry/sentry-go
go get golang.org/x/time/rate
go get github.com/aws/aws-sdk-go-v2/service/s3
```
