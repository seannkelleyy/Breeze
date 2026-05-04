
# Breeze Progress

Living tracker for the Go API and database work.

## Current Status

- Done: Users, Assets, Liabilities, TaxBrackets, Net Worth Snapshots, Budgets, Expense Categories, Expenses + Expense Splits, Incomes + Recurring Rules, Goals, Retirement Accounts + Contribution Tracking, Scenario Projections
- Backend validation: `make gen` and `go test ./...` pass
- Last verified: May 4, 2026
- Current focus: Plaid connections + account sync

## Readiness Check

- API backend: working for the current implemented slices
- Database schema: aligned for the current implemented slices
- Web app: not yet wired to all backend slices
- Deployment: local docker compose + Go test/build workflow in place

## What Is Left

Remaining backend slices from the roadmap:

1. Plaid Connections + Account Sync
2. Tax Planning Extensions
3. Early Retirement Ladders

## Next Best Milestone

Milestone A:
- Net Worth Snapshots
- Budgets

Next task:
- Build Plaid Connections + Account Sync as the next backend slice

Milestone B:
- Incomes + Recurring Rules
- Goals
- Retirement Accounts + Contribution Tracking

## Notes

- Detailed slice checklist lives in [.github/docs/api/go/12-next-slices-checklist.md](.github/docs/api/go/12-next-slices-checklist.md)
- API architecture and workflow docs live in [.github/docs/api/go/](.github/docs/api/go/)
- Update this file after each completed slice so it stays current
