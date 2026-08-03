# Breeze

Personal finance planner — track assets, liabilities, budgets, retirement projections, and tax planning in one place.

## Tools

### API (`breeze.api/`)

| Concern | Tool |
|---|---|
| Language | Go 1.26 |
| GraphQL | gqlgen |
| DB queries | sqlc + pgx/v5 |
| Migrations | Atlas |
| Database | PostgreSQL 16 |
| Money math | govalues/decimal |
| Auth | Clerk |
| Background jobs | River |
| Error tracking | Sentry |
| DataLoaders | dataloadgen |
| Testing | testify + pgxmock |
| Linting | golangci-lint |

### Web (`breeze.web/`)

| Concern | Tool |
|---|---|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript |
| Data fetching | TanStack Query |
| Tables | TanStack Table |
| UI components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| HTTP client | Axios |
| Auth | Clerk |
| GraphQL codegen | graphql-codegen |
| Testing | Vitest |
| Linting | ESLint + Prettier |

### Infra

| Concern | Tool |
|---|---|
| Database | PostgreSQL 16 |
| Containers | Docker Compose |
| CI/CD | Woodpecker CI |

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. API (in breeze.api/)
make dev    # migrate → gen → run

# 3. Web (in breeze.web/)
npm run dev
```

## CI (Woodpecker)

Woodpecker CI runs locally for development. Start it alongside your database:

```bash
# Start everything (postgres + woodpecker)
./scripts/ci-local.sh

# Or just start woodpecker (postgres already running)
docker compose -f compose.yaml -f compose.woodpecker.yaml up -d woodpecker-server woodpecker-agent
```

Woodpecker UI: http://localhost:8000

To use with GitHub or Forgejo, set `WOODPECKER_GITHUB_*` or `WOODPECKER_FORGEJO_*` env vars in `compose.woodpecker.yaml`.

## Monorepo Structure

```
breeze.api/    Go API (gqlgen + sqlc + Atlas)
breeze.web/    Next.js frontend
compose.yaml   Local PostgreSQL
compose.woodpecker.yaml  Woodpecker CI (local dev)
docs/          All project documentation
```

## Key Commands

### API (`breeze.api/`)

| Command | What it does |
|---|---|
| `make dev` | Start db → migrate → gen → run |
| `make gen` | sqlc + gqlgen code generation |
| `make migrate` | Apply pending migrations |
| `make seed` | Seed tax brackets |
| `make test` | Run tests |
| `make lint` | golangci-lint |
| `make check` | Full CI pipeline (fmt → tidy → gen → vet → lint → test → build) |

### Web (`breeze.web/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest |

## API Endpoints

- `GET /health` — health check
- `GET /graphql` — GraphQL playground
- `POST /query` — GraphQL endpoint

## Documentation

Start with **[`docs/README.md`](docs/README.md)** — it maps every doc and has common workflows.

Agent instructions live in **[`AGENTS.md`](AGENTS.md)**.
