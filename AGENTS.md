# Breeze — Master Agent Instructions

This is the single authoritative guide for AI agents working on Breeze.
**Start here before reading any other doc.**

For full documentation navigation and workflow entry points, use `docs/README.md`.

## Repository Layout

```
breeze/
├── breeze.api/          # Go API (gqlgen + sqlc + Atlas + PostgreSQL)
│   ├── cmd/api/         # HTTP server entrypoint
│   ├── internal/        # Service, config, middleware, db (generated)
│   ├── graph/           # GraphQL schema, resolvers, helpers
│   ├── db/              # schema.hcl, migrations, sqlc queries
│   └── Makefile         # All dev commands
├── breeze.web/          # Next.js 16 + React 19 web app
│   ├── app/             # App Router pages and components
│   ├── lib/             # Shared utilities, providers, services
│   └── package.json     # npm scripts
├── compose.yaml         # Local PostgreSQL (shared across monorepo)
└── .github/
    ├── copilot-instructions.md    # Agent-facing quick ref
    └── workflows/                 # CI pipelines
```

---

## 🚨 Critical Rules — Violating These Causes Bugs

### Full Stack — Always
- **Every feature request or edit must be implemented across all three layers: DB, API, and UI.**
- No partial implementations. No "leave the frontend for later." No backend-only additions without a UI that uses them.
- If a feature changes a DB schema, it also gets a migration, API endpoints/service logic, and a UI component.
- If a feature changes an API response shape, the frontend types and UI are updated in the same change.

### No Backward Compatibility Code
- This is a **pre-production** codebase. **Do not write any code for backward compatibility.**
- Breaking changes to enums, types, schemas, and API responses are expected and acceptable.
- No migration shims, no deprecated field aliases, no "v2" endpoints alongside "v1". Just change it.
- If a migration requires a data transformation, the migration SQL handles it. No Go-level adapter code.


## API Architecture (Three-Layer Rule)
- **Resolver** → thin: extract user from context, map input, call service, map output
- **Service** → all business logic, validation, transactions, authorization
- **DB** → sqlc generated only — never hand-edit `internal/db/sqlc/`
- Never skip or reverse layers. No SQL in resolvers or services.

### Money Handling
- **Never use `float64` for money or rates.** At the API layer: `govalues/decimal`. On the web: `string` on the wire, `number` only for display.
- All GraphQL monetary fields are `String!` — never `Float`.
- Always call `.Round(2)` on monetary values before returning in GraphQL responses.

### Database
- Every table has `created_at`, `updated_at`, and nullable `deleted_at`.
- **Every read query filters `WHERE deleted_at IS NULL`** — no exceptions.
- Soft delete: sets `deleted_at = now()` and `updated_at = now()`.
- Primary keys: `UUID` with `DEFAULT gen_random_uuid()` — never generate UUIDs in Go.
- Immutable tables (no updated_at/deleted_at) should be documented in `docs/db/01-schema-conventions.md` when created.

### Enum Changes (PostgreSQL + Atlas)
- Cannot use `ALTER TYPE ... ADD VALUE` in Atlas migrations (Atlas can't reorder values).
- Use the **RENAME + CREATE NEW + MIGRATE + DROP OLD** pattern instead.
- See migration `20260611214200_extend_asset_type_enum.sql` for a worked example.

### Asset Type System
- `asset_type` enum: `CHECKING`, `EMERGENCY_FUND`, `BROKERAGE`, `_401K`, `_403B`, `_457`, `ROTH_IRA`, `TRADITIONAL_IRA`, `HSA`, `HOME`, `VEHICLE`, `OTHER`
- Numeric-prefixed values use underscore prefix (`_401K`, `_403B`, `_457`) since PostgreSQL/GraphQL enums can't start with digits.
- Liability types (`STUDENT_LOAN`, `CREDIT_CARD`, `PERSONAL_LOAN`, `AUTO_LOAN`, `MORTGAGE`, `OTHER`) live in the separate `liability_type` enum.
- Frontend mapping: `breeze.web/app/planner/lib/typeMapping.ts` handles `AccountType <-> ApiAssetType` translation.

### Auth
- Clerk SDK is imported **only** in `breeze.api/internal/middleware/auth.go`.
- Resolvers and services access the authenticated user via `middleware.UserIDFromCtx(ctx)`.
- Never call `os.Getenv` in business logic — use `internal/config/config.go`.

### Generated Code — Never Edit
| Directory | Tool | Regenerate |
|---|---|---|
| `breeze.api/internal/db/sqlc/` | sqlc | `make gen` |
| `breeze.api/graph/generated/` | gqlgen | `make gen` |
| `breeze.api/graph/model/models_gen.go` | gqlgen | `make gen` |
| `breeze.api/db/migrations/` | Atlas | `make migrate-diff` |

---

## 🏃 Quick Start (Development)

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. API (in breeze.api/)
make dev    # starts db (if needed) → migrate → gen → run

# 3. Web (in breeze.web/)
npm run dev
```

---

## 🔧 Key Commands

### API (`breeze.api/`)
| Command | What it does |
|---|---|
| `make dev` | Start db (if needed) → migrate → gen → run |
| `make gen` | sqlc generate + gqlgen generate |
| `make migrate` | Apply pending migrations |
| `make migrate-diff MIGRATION_NAME=x` | Generate migration from schema.hcl |
| `make migrate-hash` | Re-hash atlas.sum after manual migration edits |
| `make migrate-clean` | Wipe the database schema |
| `make seed` | Apply seed data (tax brackets, etc.) |
| `make test` | `go test ./...` |
| `make lint` | `golangci-lint run ./...` |

### Web (`breeze.web/`)
| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |

---

## 📚 Reference Docs

Primary index: [`docs/README.md`](docs/README.md)

### API (`docs/api/`)
| # | File | What it covers |
|---|---|---|
| 1 | [`api/01-stack.md`](docs/api/01-stack.md) | Go, gqlgen, sqlc, Atlas — toolset and rationale |
| 2 | [`api/02-project-structure.md`](docs/api/02-project-structure.md) | Directory tree, import rules, generated code boundaries |
| 3 | [`api/03-architecture.md`](docs/api/03-architecture.md) | Three-layer rule, transactions, DataLoaders, auth, error handling |
| 4 | [`api/04-dev-workflow.md`](docs/api/04-dev-workflow.md) | Makefile, commands, testing, config files |
| 5 | [`api/05-quick-reference.md`](docs/api/05-quick-reference.md) | Naming, decimal cheatsheet, context helpers, domain rules |
| 6 | [`api/06-vertical-slice.md`](docs/api/06-vertical-slice.md) | End-to-end playbook for adding a new backend slice |
| 7 | [`api/07-testing.md`](docs/api/07-testing.md) | Test patterns: mock structure, happy path, error paths |

### DB (`docs/db/`)
| # | File | What it covers |
|---|---|---|
| 1 | [`db/01-schema-conventions.md`](docs/db/01-schema-conventions.md) | All table schemas, column types, indexes, constraints |

### UI (`docs/ui/`)
| # | File | What it covers |
|---|---|---|
| 1 | [`ui/01-stack.md`](docs/ui/01-stack.md) | Next.js, TanStack Query, shadcn — stack and patterns |

### Product (`docs/product/`)
| # | File | What it covers |
|---|------|----------------|
| 1 | [`product/01-vision.md`](docs/product/01-vision.md) | Product vision, positioning, build order |
| 2 | [`product/02-business-model.md`](docs/product/02-business-model.md) | Pricing, GTM strategy, competitive landscape |

### Deployment (`docs/deployment/`)
| # | File | What it covers |
|---|---|---|
| 1 | [`deployment/01-hosting.md`](docs/deployment/01-hosting.md) | Hosting options, Docker, CI/CD |

### Scoped Agent Rules (`docs/`)
| File | Scope | Use for |
|---|---|---|
| [`resolvers.instructions.md`](docs/api/resolvers.instructions.md) | `graph/**` | Resolver patterns, error mapping, DataLoaders |
| [`schema.instructions.md`](docs/api/schema.instructions.md) | `db/**` | Atlas schema conventions, sqlc query rules |
| [`services.instructions.md`](docs/api/services.instructions.md) | `internal/service/**` | Service structure, transactions, auth, projections |
| [`hooks.instructions.md`](docs/ui/hooks.instructions.md) | `app/planner/hooks/**` | React Query hook conventions in planner module |
| [`components.instructions.md`](docs/ui/components.instructions.md) | `app/planner/components/**` | Planner component conventions and UI patterns |
| [`budget.instructions.md`](docs/ui/budget.instructions.md) | `app/budget/**` | Budget module hook/provider/component conventions |

---

## 🎯 Common Change Patterns

| Change | What to touch |
|---|---|
| **Add a field to an existing table** | `schema.hcl` → `make migrate-diff` → `db/queries/*.sql` → `make gen` → service struct → GraphQL schema → resolver helper → frontend types → frontend component |
| **Add a new enum value** | `schema.hcl` → migration (RENAME + CREATE NEW + MIGRATE + DROP OLD) → `make migrate` → `make gen` → frontend `typeMapping.ts` → frontend component |
| **Add a new GraphQL query** | `graph/schema.graphqls` → `make gen` → implement resolver stub in `graph/schema.resolvers.go` → helper in `graph/*_helpers.go` → frontend query definition → TanStack Query hook |
| **Add a new GraphQL mutation** | `graph/schema.graphqls` → `make gen` → implement resolver stub → service method → sqlc query (if needed) → frontend mutation hook → UI save flow |
| **Add a new table (full slice)** | Follow the [vertical slice playbook](docs/api/06-vertical-slice.md) |
| **Fix an Atlas checksum error** | `cd breeze.api && export $(cat .env \| xargs) && atlas migrate hash --env local` |
| **Add columns that already exist in the DB** | Migration must use `ADD COLUMN IF NOT EXISTS` with reasonable defaults — see `20260627133813_add_asset_liability_fields.sql` for an example |
| **Rename a migration value** | Change the migration SQL directly, then re-hash. Do not write adapter code |

---

## 🧹 Keeping Docs in Sync

Docs are read by every agent on every task. Stale docs cause bad code. When you make any of the following changes, update the corresponding doc in the same PR:

| If you change... | Update this doc |
|---|---|
| **Project structure** (new directories, new key files) | [`api/02-project-structure.md`](docs/api/02-project-structure.md) — directory tree |
| **Makefile targets, build commands, test setup** | [`api/04-dev-workflow.md`](docs/api/04-dev-workflow.md) — Makefile, testing |
| **Domain rules, naming conventions, decimal patterns** | [`api/05-quick-reference.md`](docs/api/05-quick-reference.md) — cheatsheets, rules |
| **Schema conventions** (new column type, new constraint pattern) | [`db/01-schema-conventions.md`](docs/db/01-schema-conventions.md) — table defs, conventions |
| **Frontend stack, data fetching, component patterns** | [`ui/01-stack.md`](docs/ui/01-stack.md) — stack, patterns, conventions |
| **Scoped `.instructions.md` rules** | The matching file in `api/` or `ui/` — update the code examples |
| **Product vision, build order, business model** | `product/01-vision.md`, `product/02-business-model.md` |
| **Test patterns** (mock structure, new testing approach) | [`api/07-testing.md`](docs/api/07-testing.md) — patterns, examples |
| **The vertical slice process** (new file types in the pipeline) | [`api/06-vertical-slice.md`](docs/api/06-vertical-slice.md) — playbook |
| **Anything else** | If it's a pattern another agent would benefit from, add a sentence or example to the most relevant doc. A one-line addition is better than a stale doc. |

**Rule of thumb:** if you had to read a doc to write your code, update that doc with what you learned.

---

## 📋 Full Slice Checklist

### Adding a new API slice (backend)
Follow the [vertical slice playbook](docs/api/06-vertical-slice.md):
1. Edit `db/schema.hcl` → `make migrate-diff`
2. Add sqlc queries in `db/queries/*.sql`
3. `make gen`
4. Implement service in `internal/service/*.go`
5. Update GraphQL schema in `graph/schema.graphqls`
6. Implement resolver helpers in `graph/*_helpers.go`
7. Wire in `cmd/api/main.go`
8. Write tests in `internal/service/*_test.go`

### Fixing a checksum error
```bash
cd breeze.api && export $(cat .env | xargs) && atlas migrate hash --env local
```

### Adding columns that already exist in the DB
Use `ADD COLUMN IF NOT EXISTS` with reasonable defaults to make the migration idempotent.



