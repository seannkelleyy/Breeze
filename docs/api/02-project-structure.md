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
│   ├── river/                       # River job runner entrypoint
│   │   └── main.go
│   └── seed/                        # Seed runner for deploys (applies db/seed/seed.sql)
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
│   ├── health/                      # HTTP health endpoint and database readiness check
│   │   ├── handler.go
│   │   └── handler_test.go
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
│       ├── 20260921195212_baseline.sql
│       ├── 20260922215603_add_transaction_expense_link.sql
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
│   ├── future/                      # /future route entry point
│   ├── accounts/                    # Accounts page (financial accounts)
│   ├── people/                      # People page (household members)
│   ├── goals/                       # Goals page (FOO checklist + goal CRUD)
│   ├── budget/                      # Budget module
│   ├── expenses/                    # Expense tracking UI
│   ├── mortgage/                    # Mortgage calculator (amortization, refinance, loan compare)
│   ├── retirement-ladder/           # Retirement ladder calculator
│   ├── tax-planning/                # Tax planning UI
│   ├── layout.tsx
│   └── page.tsx                     # Dashboard
├── components/
│   ├── ui/                          # shadcn components
│   └── common/
│       ├── navigation/              # Desktop + mobile nav
│       ├── setup/                   # Setup wizard
│       ├── connections/             # Bank connections dialog + Plaid Link button
│       └── ...
├── features/                        # Reusable domain features, independent of route ownership
│   ├── expenses/                     # Expense/transaction documents, types, hooks, and UI
│   ├── income/                       # Income documents, types, hooks, and UI
│   ├── categories/                   # Category documents, types, hooks, and UI
│   ├── budget/                       # Budget operations, hooks, types, and context
│   ├── recurring/                    # Recurring operations, hooks, and UI
│   ├── goals/                        # Goal operations, API hook, types, and domain logic
│   ├── assets/                       # Asset/liability operations
│   ├── connections/                  # Plaid operations and hooks
│   ├── planning/                     # Planner UI/state/types/math/hooks and operations
│   ├── mortgage/                     # Mortgage calculations and UI
│   ├── retirement-access/            # Retirement-access operations, hook, and UI
│   ├── retirement-ladder/            # Retirement-ladder operation and hook
│   └── taxes/                        # Tax operations, hooks, logic, and UI
├── lib/
│   ├── calc/                         # Pure domain math (income, payroll taxes) — no React
│   ├── gql/                          # GraphQL Codegen output — do not edit manually
│   ├── providers/                    # Context providers (CurrentUserProvider)
│   ├── hooks/                        # Shared hooks (useAutoSave, useTabParam)
│   └── services/                     # Shared GraphQL transport (useGraphql)
└── package.json
```

---

## Placement Rules

- DB schema/migration/query work goes in `breeze.api/db/`.
- Service logic goes in `breeze.api/internal/service/`.
- GraphQL contract and resolver mapping go in `breeze.api/graph/`.
- `breeze.web/app/` owns route structure and route composition; route-only UI may stay beside its route.
- Reusable domain code (operations, fragments, feature types, hooks, and feature UI) belongs in `breeze.web/features/<feature>/`, not under another route's `app/` folder.
- Shared web primitives go in `breeze.web/components/` and `breeze.web/lib/`.
- GraphQL operation documents are owned by domain folders in `breeze.web/features/<feature>/`; generated documents/types remain in `lib/gql/`, and transport remains in `lib/services/`.
- Domain code that is reusable across routes belongs in `features/<feature>/`; route pages and page composition stay in `app/`.
- Budget now owns its context/provider and data hooks under `features/budget/`; its route page/layout stay in `app/budget/`. Expenses, recurring, income, categories, goals, taxes, and mortgage also own their reusable UI/domain code in feature folders.
- `features/planning/` owns the planner module's UI, state, types, calculations, hooks, and GraphQL operations; `app/future/page.tsx` is only the route entry point.

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
