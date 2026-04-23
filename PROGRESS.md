
# Breeze Progress

Living tracker for the Go API and database work.

## Current Status

- Done: Users, Assets, Liabilities, TaxBrackets
- Backend validation: `make gen` and `go test ./...` pass
- Last verified: April 22, 2026
- Current focus: balance sheet and budgeting foundations

## Readiness Check

- API backend: working for the current implemented slices
- Database schema: aligned for the current implemented slices
- Web app: not yet wired to all backend slices
- Deployment: local docker compose + Go test/build workflow in place

## What Is Left

Remaining backend slices from the roadmap:

1. Net Worth Snapshots
2. Budgets
3. Expense Categories
4. Expenses + Expense Splits
5. Incomes + Recurring Rules
6. Goals
7. Retirement Accounts + Contribution Tracking
8. Scenario Projections
9. Plaid Connections + Account Sync
10. Tax Planning Extensions
11. Early Retirement Ladders

## Next Best Milestone

Milestone A:
- Net Worth Snapshots

Next task:
- Build Net Worth Snapshots as the next backend slice

Milestone B:
- Budgets
- Expense Categories
- Expenses + Expense Splits
- Incomes + Recurring Rules

## Notes

- Detailed slice checklist lives in [.github/docs/api/go/12-next-slices-checklist.md](.github/docs/api/go/12-next-slices-checklist.md)
- API architecture and workflow docs live in [.github/docs/api/go/](.github/docs/api/go/)
- Update this file after each completed slice so it stays current
