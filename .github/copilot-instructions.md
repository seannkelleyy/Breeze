# Breeze — Agent Instructions

This is a **personal finance planner** monorepo with a Go API and Next.js web app.

**Full docs:** `.github/docs/api/`, `.github/docs/db/`, `.github/docs/ui/`, `.github/docs/product/`, `.github/docs/deployment/`
**Scoped rules:** `.github/docs/api/*.instructions.md` | `.github/docs/ui/*.instructions.md`

---

## API Stack

| Concern | Tool |
|---|---|
| Language | Go 1.23+ |
| GraphQL | gqlgen |
| DB queries | sqlc + pgx/v5 |
| Schema/migrations | Atlas (`schema.hcl` → `db/migrations/`) |
| Decimal math | govalues/decimal — never float64 for money |
| Auth | Clerk (isolated to `internal/middleware/auth.go` only) |
| Background jobs | riverqueue/river |
| Logging | slog — always from context, never global |

## Web Stack

| Concern | Tool |
|---|---|
| Framework | Next.js 16 + React 19 |
| UI components | shadcn/ui + Radix + Tailwind v4 |
| Data fetching | TanStack React Query |
| HTTP client | Axios |
| Auth | Clerk (`@clerk/nextjs`) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Package manager | npm |

---

## Hard Rules — Apply Everywhere

- **Full stack, always** — every feature or edit touches DB + API + UI. No partial implementations.
- **No backward compatibility code** — pre-production. Break things, change enums, reshape schemas. No shims, no adapters, no v2 endpoints.
- **API: Three layers only** — resolver → service → db. Never skip or reverse.
- **API: No business logic in resolvers.** No SQL in resolvers or services.
- **API: Every mutation touching multiple tables** uses an explicit pgx transaction.
- **Every query filters `WHERE deleted_at IS NULL`** — no exceptions.
- **Never use float64 for money** — always `govalues/decimal` (API) or string (web).
- **Never generate UUIDs in Go** — let Postgres `gen_random_uuid()` handle it.
- **Never call `os.Getenv` in business logic** — use `internal/config/config.go`.
- **Never import Clerk SDK outside `internal/middleware/auth.go`.**
- **DataLoaders required** for any resolver field loading children of a list.
- **Always update `last_value_updated_at`** when changing `Asset.current_value`.
- **Always update `last_balance_updated_at`** when changing `Liability.current_balance`.

---

## Generated Code — Never Edit

| Directory | Tool | Regenerate |
|---|---|---|
| `breeze.api/internal/db/sqlc/` | sqlc | `make gen` |
| `breeze.api/graph/generated/` | gqlgen | `make gen` |
| `breeze.api/graph/model/models_gen.go` | gqlgen | `make gen` |
| `breeze.api/db/migrations/` | Atlas | `make migrate-diff` |
