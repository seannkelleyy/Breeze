# 03 — Project Structure

## Single Module Philosophy

Go does not require multiple projects to enforce boundaries the way .NET does. Everything lives in one `go.mod`. The `internal/` directory enforces the same boundaries as .NET project references — packages inside `internal/` cannot be imported by code outside the module.

---

## Mapping from Breeze Solution

| Breeze Project | Go Equivalent |
|---|---|
| Breeze.API | `cmd/api/` + `internal/graph/` + `internal/middleware/` |
| Breeze.Data | `internal/db/` (sqlc generated) + `db/queries/` |
| Breeze.Domain | `internal/service/` + `internal/graph/model/` |
| Breeze.SQL | `db/schema.hcl` + `db/migrations/` |
| Breeze.Web | Separate repo — Vite + React + shadcn/ui |

---

## Full Directory Tree

```
budget-api/
│
├── cmd/
│   └── api/
│       └── main.go                  # entrypoint — wires everything together
│
├── internal/                        # private — not importable externally
│   │
│   ├── config/
│   │   └── config.go                # typed env var config struct
│   │
│   ├── db/                          # sqlc generated — DO NOT edit manually
│   │   ├── db.go
│   │   ├── models.go                # generated structs from schema
│   │   ├── budgets.sql.go
│   │   ├── expenses.sql.go
│   │   └── ...
│   │
│   ├── graph/
│   │   ├── schema.graphqls          # GraphQL schema definition
│   │   ├── generated/               # gqlgen generated — DO NOT edit manually
│   │   │   └── generated.go
│   │   ├── model/
│   │   │   └── models_gen.go
│   │   └── resolver/
│   │       ├── resolver.go          # Resolver struct + constructor
│   │       ├── mapping.go           # mapExpense(), mapBudget() etc
│   │       ├── budget.resolvers.go
│   │       ├── expense.resolvers.go
│   │       ├── account.resolvers.go
│   │       ├── asset.resolvers.go
│   │       ├── liability.resolvers.go
│   │       ├── tax.resolvers.go
│   │       ├── retirement.resolvers.go
│   │       └── plaid.resolvers.go
│   │
│   ├── service/                     # ALL business logic lives here
│   │   ├── errors.go                # ErrNotFound, ErrSplitMismatch, ErrUnauthorized etc
│   │   ├── budget.go                # BudgetService
│   │   ├── expense.go               # ExpenseService
│   │   ├── account.go               # AccountService
│   │   ├── asset.go                 # AssetService
│   │   ├── liability.go             # LiabilityService
│   │   ├── networth.go              # NetWorthService
│   │   ├── tax.go                   # TaxService
│   │   ├── retirement.go            # RetirementService
│   │   ├── plaid.go                 # PlaidService
│   │   └── projection/
│   │       └── asset.go             # return profile projection math
│   │
│   ├── loader/                      # DataLoaders — one per batched query
│   │   ├── loaders.go               # Loaders struct + NewLoaders()
│   │   ├── category_spent.go
│   │   └── ...
│   │
│   └── middleware/
│       ├── auth.go                  # Clerk JWT — ONLY file that imports Clerk SDK
│       ├── logger.go                # injects slog.Logger into every request context
│       ├── requestid.go             # generates + injects request ID
│       └── ratelimit.go             # per-user token bucket rate limiter
│
├── db/                              # everything database-related
│   ├── schema.hcl                   # Atlas schema — single source of truth
│   ├── migrations/                  # Atlas generated SQL — DO NOT edit manually
│   │   ├── 20260101_initial.sql
│   │   └── atlas.sum
│   └── queries/                     # sqlc input — you write these
│       ├── budgets.sql
│       ├── expenses.sql
│       ├── expense_splits.sql
│       ├── expense_categories.sql
│       ├── accounts.sql
│       ├── assets.sql
│       ├── liabilities.sql
│       ├── people.sql
│       ├── goals.sql
│       ├── tags.sql
│       ├── transfers.sql
│       ├── plaid.sql
│       ├── tax.sql
│       └── retirement.sql
│
├── infra/                           # Pulumi IaC in Go
│   └── main.go
│
├── .github/
│   ├── copilot-instructions.md      # repo-wide Copilot context — always loaded
│   ├── workflows/
│   │   └── deploy.yml
│   └── instructions/                # scoped Copilot context
│       ├── 01-product-vision.md     ← this file's siblings
│       ├── 02-tech-stack.md
│       ├── 03-project-structure.md
│       ├── 04-architecture.md
│       ├── 05-dev-workflow.md
│       ├── 06-deployment.md
│       ├── 07-database.md
│       ├── 08-frontend.md
│       ├── 09-business.md
│       ├── 10-quick-reference.md
│       ├── schema.instructions.md       # applyTo: db/**
│       ├── resolvers.instructions.md    # applyTo: internal/graph/**
│       └── services.instructions.md    # applyTo: internal/service/**
│
├── .vscode/
│   ├── settings.json                # Copilot codegen, test, review instructions
│   └── extensions.json              # recommended extensions
│
├── docker-compose.yml               # local dev postgres only
├── Dockerfile                       # scratch base — ~15MB image
├── fly.toml                         # Fly.io deployment config
├── Makefile                         # all dev workflow commands
├── gqlgen.yml                       # gqlgen config
├── sqlc.yaml                        # sqlc config with decimal + UUID overrides
├── .editorconfig
├── go.mod
└── go.sum
```

---

## Generated Code — Never Edit These Three

| Directory | Generated By | Regenerate With |
|---|---|---|
| `internal/db/` | sqlc | `sqlc generate` |
| `internal/graph/generated/` | gqlgen | `go run github.com/99designs/gqlgen generate` |
| `db/migrations/` | Atlas | `atlas migrate diff <name>` |

Run `make gen` to regenerate all three in one step after any schema or query change.

---

## Import Rules (Enforced by Go compiler)

```
internal/graph/resolver  →  can import  →  internal/service
internal/graph/resolver  →  can import  →  internal/loader
internal/service         →  can import  →  internal/db
internal/service         →  CANNOT import  →  internal/graph
internal/db              →  CANNOT import  →  internal/service
internal/db              →  CANNOT import  →  internal/graph
```

If you accidentally import in the wrong direction the Go compiler refuses to build. Same guarantee as .NET project references, no configuration needed.
