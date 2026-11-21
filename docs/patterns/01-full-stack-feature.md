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

1. Add/extend typed GraphQL documents in the owning feature under `breeze.web/features/<domain>/`.
2. Put requests and React Query orchestration in feature hooks; use `useGraphql()` and `CurrentUserProvider` rather than duplicating transport or user bootstrap.
3. Include the current user in cache keys for user-owned data, followed by resource IDs or filters; the authenticated server request supplies caller identity, so do not pass `userId` solely to identify the signed-in user.
4. Add/extend route components/pages under `breeze.web/app/` and feature UI under `breeze.web/features/`.
5. Ensure loading/error/success states are explicit.

Rules:

- Keep API money/rate fields as string payloads.
- Components consume hooks or props; they do not call the GraphQL transport directly.
- Use `enabled` guards until required identity or resource IDs are available.
- On mutation success, invalidate every affected query key, scoped to the relevant user where appropriate.

### Step 5: Validation

```bash
# API
cd breeze.api
make check

# Web
cd ../breeze.web
npm run verify
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
