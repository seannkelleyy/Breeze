# Breeze Progress

Living tracker for current product implementation progress.

## Purpose

Track what is done, what is next, and where to find implementation patterns.

## Last Updated

- Date: 2026-07-09
- Scope: All 4 documented defects resolved

## Current Status

- Done: Users, Assets, Liabilities, TaxBrackets, Net Worth Snapshots, Budgets, Expense Categories, Expenses + Expense Splits, Incomes + Recurring Rules, Goals, Retirement Accounts + Contribution Tracking, Scenario Projections, Plaid Connections + Account Sync, Tax Planning Extensions, Early Retirement Ladders
- Backend core slices: Complete
- Frontend wiring: In progress for remaining hardening flows
- Current focus: UX completion + reliability + consistency

## Readiness Check

- API backend: ✅ Complete for all planned slices
- Database schema: ✅ Aligned for all slices
- Web app: 🔨 Wiring in progress
- Deployment: ✅ Local docker compose + Go test/build workflow in place

## Defects Resolved

1. **Asset Return Profile Selector** ✅ — Fixes applied: removed double-conversion wrapper, corrected profile rate values (0,3,4,7,10) in `plannerMath.ts`, corrected profile thresholds. Math round-trip is now lossless.
2. **Goals Can't Be Saved (FK Constraint)** ✅ — `resolveUserIDFromCtx` in `resolver.go` extracts authenticated user UUID; `CreateGoal` resolver overrides `userId` from auth context.
3. **Household Self Person Not Editable** ✅ — `usePlannerPeople.ts` initializes default self person from `PLANNER_DEFAULT_SELF_PERSON` when people array is empty.
4. **People Data Not Persisted** ✅ — Full stack implementation: backend (`planner_people` table, service, GraphQL schema/resolvers), frontend (mutations hook, save button wiring, data loading).

## What Is Left

- Plaid connections UI end-to-end integration and sync visibility
- Planner/Budget page decomposition into smaller maintainable units
- Additional regression coverage for high-risk user flows
- UI/UX refinements and performance optimizations
- Run `make dev` in `Breeze.Api/` to apply migrations, regenerate code, and start the API

## Notes

- Docs hub: [.github/docs/README.md](.github/docs/README.md)
- Full-stack implementation flow: [.github/docs/patterns/01-full-stack-feature.md](.github/docs/patterns/01-full-stack-feature.md)
- API vertical slice runbook: [.github/docs/api/06-vertical-slice.md](.github/docs/api/06-vertical-slice.md)
- UI slice runbook: [.github/docs/ui/ui-slice-api-checklist.md](.github/docs/ui/ui-slice-api-checklist.md)
- Update this file after each completed slice so it stays current
