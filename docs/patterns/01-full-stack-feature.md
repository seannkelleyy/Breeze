# 01 — Full-Stack Feature Pattern

## Purpose

Provide a single repeatable pattern for adding functionality across DB, API, and UI.

Use this doc for both human contributors and AI agents.

## When To Use

- New feature slices
- Changes to existing domain behavior
- Schema updates that impact API/UI contracts

## Full Pattern

### Step 1: Define Behavior

- Write the behavior in one sentence.
- Identify whether it is read-only, write-only, or read+write.
- Identify affected domains (DB table(s), GraphQL type(s), UI screen(s)).

### Step 2: Database Layer

1. Update `breeze.api/db/schema.hcl`.
2. Generate migration:

```bash
cd breeze.api
make migrate-diff MIGRATION_NAME=<feature_name>
make migrate
```

3. Add/update queries in `breeze.api/db/queries/*.sql`.
4. Regenerate code: `make gen`.

### Step 3: API Layer

1. Add/extend service logic in `breeze.api/internal/service/`.
2. Add/extend GraphQL schema in `breeze.api/graph/schema.graphqls`.
3. Regenerate code: `make gen`.
4. Implement resolver wiring in `breeze.api/graph/schema.resolvers.go`.
5. Put mapping/conversion helpers in `breeze.api/graph/*_helpers.go`.

Rules:

- Resolver stays thin.
- Service owns validation/business logic/transactions.
- Money uses `govalues/decimal` in API and string on GraphQL wire.

### Step 4: UI Layer

1. Add/extend GraphQL operation in `breeze.web/lib/services/queries/`.
2. Add/extend domain hooks under route module (`breeze.web/app/<route>/hooks/`).
3. Add/extend route components/pages and provider orchestration.
4. Ensure loading/error/success states are explicit.

Rules:

- Keep API money/rate fields as string payloads.
- Use stable query keys.
- Use `enabled` guards for ID-dependent queries.
- On mutation success, invalidate/refetch affected query state.

### Step 5: Validation

```bash
# API
cd breeze.api
make check

# Web
cd ../breeze.web
npm run check
```

### Step 6: Documentation

- Update affected docs in `docs/` in the same PR.
- If paths/commands changed, update docs immediately.
- If migration history is relevant, keep it in archival docs only.

## Feature Checklist

- [ ] DB contract updated
- [ ] API contract updated
- [ ] UI contract updated
- [ ] Test coverage updated
- [ ] Docs updated
- [ ] End-to-end behavior manually verified

## Related Docs

- `../api/06-vertical-slice.md`
- `../api/04-dev-workflow.md`
- `../ui/ui-slice-api-checklist.md`
- `../README.md`