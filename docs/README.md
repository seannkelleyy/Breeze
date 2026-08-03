# Breeze Documentation Hub

This is the canonical documentation entry point for Breeze.

If you are a person or an AI agent, start here first.

## Source of Truth

- Product and engineering docs live in `docs/`
- Agent execution rules live in `AGENTS.md` and `docs/agent-instructions.md`
- Root quick start lives in `README.md`

## Documentation Map

### API

- `api/01-stack.md`
- `api/02-project-structure.md`
- `api/03-architecture.md`
- `api/04-dev-workflow.md`
- `api/05-quick-reference.md`
- `api/06-vertical-slice.md`
- `api/07-testing.md`

### UI

- `ui/01-stack.md`
- `ui/ui-slice-api-checklist.md`

### Database

- `db/01-schema-conventions.md`

### Product

- `product/01-vision.md`
- `product/02-business-model.md`

### Deployment

- `deployment/01-hosting.md`

### Roadmap

- `roadmap.md`

### Patterns

- `patterns/01-full-stack-feature.md`

### Scoped Agent Instructions

- `api/resolvers.instructions.md`
- `api/services.instructions.md`
- `api/schema.instructions.md`
- `ui/hooks.instructions.md`
- `ui/components.instructions.md`
- `ui/budget.instructions.md`

## Common Workflows

### 1. Add a Full-Stack Slice

1. Update `breeze.api/db/schema.hcl`
2. Run `make migrate-diff MIGRATION_NAME=<name>` and `make migrate`
3. Add sqlc queries in `breeze.api/db/queries/<slice>.sql`
4. Run `make gen`
5. Implement service logic in `breeze.api/internal/service/`
6. Update GraphQL schema and resolvers in `breeze.api/graph/`
7. Add/extend frontend queries/hooks/components in `breeze.web/app/...`
8. Validate: `cd breeze.api && make check`, `cd breeze.web && npm run check`

Use `api/06-vertical-slice.md` and `ui/ui-slice-api-checklist.md` together.

For a concise implementation flow, use `patterns/01-full-stack-feature.md`.

### 2. Add a UI Feature Using Existing API

1. Add GraphQL operation in `breeze.web/lib/services/queries/`
2. Add focused hooks in route-level domain hooks
3. Wire page/provider/component state
4. Keep money/rates as string over API
5. Validate with `npm run check`

### 3. Update Existing DB Fields

1. Edit `schema.hcl`
2. Create/apply migration (`migrate-diff`, `migrate`)
3. Regenerate (`make gen`)
4. Update services and GraphQL mapping
5. Update frontend types and UI

## Transition Notes

The migration from the old stack (.NET REST + Vite React) is complete.

Legacy migration docs that are still useful as historical context are intentionally marked as archival and should not be used as implementation guides.

## Documentation Maintenance Rules

- Keep docs implementation-first and command-accurate.
- If a file path in docs changes, update all links in the same PR.
- If a command changes in `Makefile` or `package.json`, update docs immediately.
- Keep migration/history notes separate from active runbooks.