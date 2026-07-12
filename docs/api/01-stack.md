# 01 — Stack

## Purpose

Define the current, canonical stack for Breeze after the migration to Go + GraphQL + Next.js.

## When To Use

- Use this doc when starting feature work.
- Use this doc to verify whether a tool/pattern is canonical.
- Use this doc before introducing a new dependency.

## Canonical Stack

| Concern | Tool |
|---|---|
| API language | Go 1.23+ |
| API transport | GraphQL (gqlgen) |
| DB query layer | sqlc + pgx/v5 |
| Schema + migrations | Atlas (`schema.hcl` + `db/migrations/`) |
| Money/rates | govalues/decimal |
| Auth | Clerk (API usage isolated to middleware) |
| Logging | slog |
| Jobs | riverqueue/river |
| Web framework | Next.js 16 + React 19 |
| Web data fetching | TanStack React Query |
| Web HTTP client | Axios |
| Web forms | React Hook Form + Zod |
| Web UI | shadcn/ui + Radix + Tailwind v4 |
| Database | PostgreSQL 16 |

## Architecture Principles

- Resolver -> Service -> DB only.
- No SQL in resolvers/services.
- No business logic in resolvers.
- Money/rates are never float64.
- GraphQL wire format uses strings for money/rates.

## Verification Commands

From `breeze.api`:

```bash
make gen
make check
```

From `breeze.web`:

```bash
npm run check
```

## Related Docs

- `04-dev-workflow.md`
- `06-vertical-slice.md`
- `../ui/ui-slice-api-checklist.md`
- `../db/01-schema-conventions.md`
