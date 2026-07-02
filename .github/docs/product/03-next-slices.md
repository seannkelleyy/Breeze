# 03 — Next Slices

## Purpose

Track what comes next now that core DB/API slices are implemented.

## Current Baseline

Core backend slices are in place (users, assets/liabilities, budgets, expenses/incomes, goals, retirement, scenarios, plaid, tax planning, ladders).

Current focus is product hardening and UX completion.

## Priority Roadmap

### 1. End-to-End Plaid UX Completion

- Replace local-state placeholders in the web app with live GraphQL-driven connection/account state.
- Ensure connect, sync, and disconnect flows reflect backend truth.
- Add user-visible sync status and retry states.

### 2. Planner/Budget UI Refactor

- Split orchestration-heavy pages into smaller containers.
- Standardize hook usage and mutation/refetch patterns across planner and budget modules.
- Reduce component size hotspots and improve readability/testability.

### 3. Cross-Layer Reliability

- Add regression tests for high-risk flows (Plaid sync, recurring generation, large mutation paths).
- Strengthen build/test checks as the default pre-merge path.
- Expand smoke checks for GraphQL operations used by critical UI screens.

### 4. Product-Level Enhancements

- Better spending analytics and trend visualization.
- Budget strategy/tagging support.
- UX improvements for recurring planning and monthly rollover understanding.

## Definition of Done For New Functionality

- [ ] DB schema/migration updated (if needed)
- [ ] sqlc queries updated (if needed)
- [ ] GraphQL schema + resolver + service implemented
- [ ] UI query/mutation hooks added or extended
- [ ] UI loading/error/success states implemented
- [ ] Tests added or updated for changed behavior
- [ ] `cd breeze.api && make check` passes
- [ ] `cd breeze.web && npm run check` passes
- [ ] Related docs updated in the same PR

## Related Docs

- `../api/06-vertical-slice.md`
- `../ui/ui-slice-api-checklist.md`
- `../api/07-testing.md`
