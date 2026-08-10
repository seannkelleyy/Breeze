# 02 — Project Structure

## Purpose

Provide a current map of the monorepo and where new functionality should be added.

## When To Use

- Before adding a new file.
- When wiring a new slice across DB, API, and UI.
- When reviewing layering boundaries.

---

## Full Directory Tree

```
breeze.api/
│
├── cmd/
│   ├── api/                         # HTTP server entrypoint
│   │   └── main.go
│   └── river/                       # River job runner entrypoint
│       └── main.go
│
├── internal/                        # private — not importable externally
│   │
│   ├── config/
│   │   └── config.go                # typed env var config struct
│   │
│   ├── db/
│   │   └── sqlc/                    # sqlc generated — DO NOT edit manually
│   │       ├── models.go
│   │       ├── assets.sql.go
│   │       ├── liabilities.sql.go
│   │       ├── retirement.sql.go
│   │       └── ...
│   │
│   ├── dataloader/                  # DataLoaders — one per batched query
│   │   └── loaders.go
│   │
│   ├── jobs/                        # River workers (background jobs)
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.go                  # Clerk JWT — ONLY file that imports Clerk SDK
│   │   ├── logger.go                # injects slog.Logger into every request context
│   │   └── ...
│   │
│   └── service/                     # ALL business logic lives here
│       ├── errors.go                # ErrNotFound, ErrUnauthorized etc
│       ├── asset.go                 # AssetService
│       ├── asset_test.go
│       ├── liability.go             # LiabilityService
│       ├── liability_test.go
│       ├── retirement.go            # RetirementService
│       ├── retirement_test.go
│       └── ...
│
├── graph/                           # GraphQL layer
│   ├── schema.graphqls              # GraphQL schema definition
│   ├── schema.resolvers.go          # Resolver implementations
│   ├── asset_helpers.go             # Mapping helpers
│   ├── liability_helpers.go
│   ├── retirement_helpers.go
│   ├── resolver.go                  # Resolver struct + constructor
│   ├── generated/                   # gqlgen generated — DO NOT edit manually
│   │   └── generated.go
│   └── model/
│       └── models_gen.go            # gqlgen generated models
│
├── db/                              # everything database-related
│   ├── schema.hcl                   # Atlas schema — single source of truth
│   ├── queries/                     # sqlc input — you write these
│   │   ├── assets.sql
│   │   ├── liabilities.sql
│   │   └── retirement.sql
│   └── migrations/                  # Atlas generated SQL — DO NOT edit manually
│       ├── 20260401213128_*.sql
│       ├── 20260611214200_*.sql
│       ├── 20260627133813_*.sql
│       └── atlas.sum
│
├── .env                             # Local dev environment
├── .env.example
├── Makefile                         # all dev workflow commands
├── gqlgen.yml                       # gqlgen config
├── sqlc.yaml                        # sqlc config with decimal + UUID overrides
├── atlas.hcl                        # Atlas environment config
├── go.mod
└── go.sum

breeze.web/                          # Next.js 16 web app
├── app/
│   ├── future/                      # Future module (renamed from planner)
│   │   ├── components/              # UI components
│   │   ├── hooks/                   # Domain hooks (TanStack Query)
│   │   ├── lib/                     # Math, config, type mapping
│   │   ├── services/                # API calls
│   │   └── types/                   # TypeScript types
│   ├── accounts/                    # Accounts page (financial accounts)
│   ├── people/                      # People page (household members)
│   ├── goals/                       # Goals page (FOO checklist + goal CRUD)
│   ├── preferences/                 # Preferences page (user settings)
│   ├── budget/                      # Budget module
│   ├── tools/                       # Tools (mortgage calculator, etc.)
│   ├── plaid-connections/           # Plaid connect/sync UI
│   ├── layout.tsx
│   └── page.tsx                     # Dashboard
├── components/
│   ├── ui/                          # shadcn components
│   └── common/
│       ├── navigation/              # Desktop + mobile nav
│       ├── setup/                   # Setup wizard
│       └── ...
├── lib/
│   ├── providers/                   # Context providers (CurrentUserProvider)
│   ├── hooks/                       # Shared hooks (useAutoSave, useTabParam)
│   └── services/                    # Shared transport + GraphQL queries
└── package.json
```

---

## Placement Rules

- DB schema/migration/query work goes in `breeze.api/db/`.
- Service logic goes in `breeze.api/internal/service/`.
- GraphQL contract and resolver mapping go in `breeze.api/graph/`.
- Route-specific UI logic goes in `breeze.web/app/<route>/`.
- Shared web primitives go in `breeze.web/components/` and `breeze.web/lib/`.

## Generated Code — Never Edit These Three

| Directory | Generated By | Regenerate With |
|---|---|---|
| `internal/db/sqlc/` | sqlc | `make gen` |
| `graph/generated/` | gqlgen | `make gen` |
| `graph/model/models_gen.go` | gqlgen | `make gen` |
| `db/migrations/` | Atlas | `make migrate-diff` |

Run `make gen` from `breeze.api/` to regenerate sqlc + gqlgen in one step after any schema or query change.

---

## Related Docs

- `01-stack.md`
- `04-dev-workflow.md`
- `06-vertical-slice.md`
- `../ui/ui-slice-api-checklist.md`

## Import Rules (Enforced by Go compiler)

```
graph                     →  can import  →  internal/service
graph                     →  can import  →  internal/dataloader
internal/service         →  can import  →  internal/db
internal/service         →  CANNOT import  →  graph
internal/db              →  CANNOT import  →  internal/service
internal/db              →  CANNOT import  →  graph
```

If you accidentally import in the wrong direction the Go compiler refuses to build.
