# Breeze

Breeze is a personal finance planner with:

- Go API (gqlgen + sqlc + Atlas + PostgreSQL)
- Next.js web app

## Monorepo Structure

- `breeze.api/` - Go API
- `breeze.web/` - Next.js frontend

## API Quick Start

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Configure environment:

```bash
cd breeze.api
cp .env.example .env
```

3. Generate the initial migration and code:

```bash
make migrate-diff MIGRATION_NAME=initial_schema
make migrate
make gen
```

4. Run the API:

```bash
make run
```

API endpoints:

- `GET /health` - health check
- `GET /graphql` - GraphQL playground
- `POST /query` - GraphQL endpoint

## Web Quick Start

```bash
cd breeze.web
npm install
npm run dev
```

## Useful API Commands

```bash
cd breeze.api
make test
make build
make migrate-diff MIGRATION_NAME=<name>
make migrate
make gen
make check
```

## Project Docs

Start with `docs/README.md`.

Key docs:

- `docs/api/06-vertical-slice.md` - full backend slice pattern
- `docs/ui/ui-slice-api-checklist.md` - full UI slice pattern
- `docs/api/04-dev-workflow.md` - day-to-day backend workflow
- `docs/db/01-schema-conventions.md` - schema conventions

## Current Stack (Canonical)

- API: Go + GraphQL (gqlgen) + sqlc + Atlas
- Web: Next.js App Router + React Query + Clerk
- Database: PostgreSQL

The migration from legacy stacks is complete. Use docs under `docs/` as source of truth for current implementation.