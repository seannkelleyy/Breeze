# 12 — Next Slices Checklist

This document prioritizes the next backend slices after Users and gives a reusable definition of done checklist for each slice.

Current baseline:

- Done: Users, TaxBrackets
- Next: Balance Sheet and Budget foundations

## Recommended Build Order

1. Assets
2. Liabilities
3. Net Worth Snapshots
4. Budgets
5. Expense Categories
6. Expenses + Expense Splits
7. Incomes + Recurring Rules
8. Goals
9. Retirement Accounts + Contribution Tracking
10. Scenario Projections (FIRE progress and what-if)
11. Plaid Connections + Account Sync
12. Tax Planning Extensions
13. Early Retirement Ladders (Roth ladder, HSA ladder, SEPP support)

## Why This Order

- Assets and liabilities quickly deliver visible value and align with product positioning.
- Net worth snapshots complete the core balance sheet loop.
- Budget and spending slices then connect short-term behavior to long-term planning.
- Retirement, scenarios, Plaid, and tax layers build on that data foundation.

## Global Slice Definition Of Done

Use this checklist for every new slice:

- [ ] Atlas schema updated in db/schema.hcl
- [ ] Migration generated with make migrate-diff MIGRATION_NAME=<slice>
- [ ] Migration applied with make migrate
- [ ] sqlc queries added in db/queries/<slice>.sql
- [ ] Read queries include deleted_at IS NULL
- [ ] Mutation queries support soft delete semantics where applicable
- [ ] Generated code refreshed with make gen
- [ ] Service implemented in internal/service/<slice>.go
- [ ] Service constructor accepts sqlc.Querier if mocking is needed
- [ ] Domain validation lives in service layer (not resolver)
- [ ] GraphQL schema updated in graph/schema.graphqls
- [ ] Resolver wiring added in graph/resolver.go
- [ ] Resolver methods implemented in graph/schema.resolvers.go
- [ ] Mapping helpers added in graph/<slice>_helpers.go
- [ ] Money and rates represented with decimal in Go and String in GraphQL
- [ ] Unit tests added in internal/service/<slice>_test.go
- [ ] Not-found, validation, and DB error paths tested
- [ ] Build passes: make build
- [ ] Tests pass: go test ./...

## Slice Checklists

### 1) Assets

Goal: Track major owned value (cash, brokerage, home value, retirement balances) with projection-ready fields.

- [ ] Table: assets
- [ ] Core fields: user_id, name, category, current_value, last_value_updated_at
- [ ] Optional projection fields: return_profile_id or annual_rate assumptions
- [ ] GraphQL: createAsset, updateAsset, deleteAsset, asset(id), assets
- [ ] Service: update last_value_updated_at whenever current_value changes
- [ ] Complete Global Slice Definition Of Done

### 2) Liabilities

Goal: Track debts with balances and payoff planning inputs.

- [ ] Table: liabilities
- [ ] Core fields: user_id, name, liability_type, current_balance, interest_rate, minimum_payment
- [ ] Planning fields: target_extra_payment, payoff_priority
- [ ] GraphQL: createLiability, updateLiability, deleteLiability, liability(id), liabilities
- [ ] Service: update last_balance_updated_at whenever current_balance changes
- [ ] Complete Global Slice Definition Of Done

### 3) Net Worth Snapshots

Goal: Time-series net worth history for charts and progress tracking.

- [ ] Table: net_worth_snapshots
- [ ] Core fields: user_id, snapshot_date, total_assets, total_liabilities, net_worth
- [ ] Service method to calculate and persist snapshot from current assets/liabilities
- [ ] GraphQL: createNetWorthSnapshot, netWorthSnapshots(range)
- [ ] Complete Global Slice Definition Of Done

### 4) Budgets

Goal: Monthly planning container for categories, income targets, and spending.

- [ ] Table: budgets
- [ ] Core fields: user_id, month, year, name or label, status
- [ ] Uniqueness: one active budget per user per month
- [ ] GraphQL: createBudget, updateBudget, deleteBudget, budget(id), budgets(month/year)
- [ ] Complete Global Slice Definition Of Done

### 5) Expense Categories

Goal: Envelope/category structure for budget allocations.

- [ ] Table: expense_categories
- [ ] Core fields: budget_id, description, allocation_amount, rollover_amount, parent_category_id
- [ ] GraphQL: createExpenseCategory, updateExpenseCategory, deleteExpenseCategory
- [ ] DataLoader coverage for category aggregate fields on list views
- [ ] Complete Global Slice Definition Of Done

### 6) Expenses + Expense Splits

Goal: Record transactions and split across categories accurately.

- [ ] Tables: expenses, expense_splits
- [ ] Service transaction: create expense and splits atomically
- [ ] Validation: split totals must equal expense amount
- [ ] GraphQL: createExpense, updateExpense, deleteExpense, expenses(filters)
- [ ] DataLoader for category spent and derived totals
- [ ] Complete Global Slice Definition Of Done

### 7) Incomes + Recurring Rules

Goal: Forecastable cash inflow supporting monthly plan realism.

- [ ] Tables: incomes, recurring_rules (or recurring_income + recurring_expense)
- [ ] Core fields: source, amount, frequency, start/end boundaries
- [ ] GraphQL CRUD for one-time and recurring entries
- [ ] Service expansion logic for recurring items into budget periods
- [ ] Complete Global Slice Definition Of Done

### 8) Goals

Goal: Savings/debt goals connected to budget and balance sheet.

- [ ] Table: goals
- [ ] Core fields: user_id, name, target_amount, target_date, linked_asset_or_liability
- [ ] GraphQL: createGoal, updateGoal, deleteGoal, goals
- [ ] Derived progress calculations (current/target)
- [ ] Complete Global Slice Definition Of Done

### 9) Retirement Accounts + Contribution Tracking

Goal: Model tax-advantaged accounts and annual contribution limits.

- [ ] Tables: retirement_accounts, contribution_entries, contribution_limits
- [ ] Core fields: account_type, owner/person, tax_treatment, annual_limit, contributed_ytd
- [ ] GraphQL: retirementAccounts, addContribution, contributionProgress
- [ ] Service validations by account type and year limits
- [ ] Complete Global Slice Definition Of Done

### 10) Scenario Projections

Goal: Compare retirement outcomes under different assumptions.

- [ ] Tables: scenario_profiles, scenario_overrides, scenario_results_cache
- [ ] Inputs: SWR, inflation, return assumptions, retirement age/date
- [ ] GraphQL: createScenario, updateScenario, compareScenarios
- [ ] Deterministic projection service with test fixtures
- [ ] Complete Global Slice Definition Of Done

### 11) Plaid Connections + Account Sync

Goal: Bring in real account balances and transactions automatically.

- [ ] Tables: plaid_items, plaid_accounts, plaid_sync_cursor, plaid_transactions
- [ ] Jobs: periodic sync and backfill through River
- [ ] GraphQL: linkPlaidAccount, syncNow, plaidConnectionStatus
- [ ] Idempotent upsert logic and retry-safe jobs
- [ ] Complete Global Slice Definition Of Done

### 12) Tax Planning Extensions

Goal: Improve tax estimate fidelity beyond baseline user/tax bracket fields.

- [ ] Tables: tax_profiles, deduction_entries, tax_estimates
- [ ] Inputs: filing state, itemized categories, withholding, credits
- [ ] GraphQL: estimateTaxes, taxProfile, updateTaxProfile
- [ ] Service: marginal/effective rate outputs and estimate explanation metadata
- [ ] Complete Global Slice Definition Of Done

### 13) Early Retirement Ladders

Goal: Support advanced FIRE drawdown planning.

- [ ] Tables: roth_conversion_plan, hsa_receipt_ladder, sepp_plan
- [ ] GraphQL: createRothConversionPlan, createHSALadder, createSEPPPlan
- [ ] Service includes compliance warning flags and assumption tracking
- [ ] UI/API disclaimer copy hooks included in payload metadata
- [ ] Complete Global Slice Definition Of Done

## Suggested Next Milestone

Milestone A (high impact, low regret):

- Assets
- Liabilities
- Net Worth Snapshots

Milestone B (budget engine):

- Budgets
- Expense Categories
- Expenses + Expense Splits
- Incomes + Recurring Rules

Milestone C (planning depth):

- Goals
- Retirement Accounts + Contribution Tracking
- Scenario Projections

Milestone D (automation and advanced planning):

- Plaid Connections + Account Sync
- Tax Planning Extensions
- Early Retirement Ladders
