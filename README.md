# Breeze

Personal finance planner — track assets, liabilities, budgets, retirement projections, and tax planning in one place.

## Stack

- **API:** Go + GraphQL (gqlgen) + sqlc + Atlas + PostgreSQL
- **Web:** Next.js 16 App Router + React 19 + TanStack Query + Clerk
- **DB:** PostgreSQL 16

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. API (in breeze.api/)
make dev    # migrate → gen → run

# 3. Web (in breeze.web/)
npm run dev
```

## Monorepo Structure

```
breeze.api/    Go API (gqlgen + sqlc + Atlas)
breeze.web/    Next.js frontend
compose.yaml   Local PostgreSQL
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
