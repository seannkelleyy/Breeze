# Roadmap

## Deployment

- [ ] Deploy API to Render
- [ ] Deploy frontend to Vercel/Render
- [ ] Set up production PostgreSQL on Render
- [ ] Configure Clerk production environment
- [ ] Configure Plaid production environment

## CI Cleanup

- [ ] Update `docs/deployment/01-hosting.md` to reflect Render deployment

## Dashboard

- [ ] Add net worth history chart (past to present) — line chart showing net worth over time

## Product (from vision)

1. Balance sheet — assets, liabilities, net worth over time
2. Budget — monthly envelope budgeting, categories, expense splits
3. ~~Account projections — retirement account growth, IRS limits, IsMaxed~~ — DONE: FIRE planner equation card, per-person Maxed Out badge, per-person IRS aggregation (see #40)
4. Retirement scenarios — FI number, FIRE progress, what-if modeling
5. Plaid integration — auto-sync transactions
6. Tax planning — form checklist, estimate
7. Roth ladder + HSA ladder — advanced FIRE features

## Sean's notices

1. ~~On iphone, the area around the search bar and top bar is white instead of black.~~ (fixed — added `apple-mobile-web-app-status-bar-style` metadata)
2. ~~I created some accounts while signed in with clerk via github. then my wife created an account via clerk and apple and she saw my accounts. This is in hosted env.~~ (fixed — all resolvers now enforce authenticated userId via `resolveUserIDFromCtx`)

---

## Completed (this session)

- People page: income growth from dropdown (inflation-anchored presets + custom input), pay cadence expanded (weekly/biweekly/semimonthly/monthly), adaptive Paid On field (weekday vs day-of-month), bonus frequency (annual/quarterly/monthly), per-person waterfall (gross → pretax → taxable → taxes → post-tax → take-home), income equation card, per-person payday calendar with net amounts
- Future page: Current Snapshot rebuilt (income equation, savings deductions with account-backed 401(k)/HSA, withholding CRUD, gross/net/take-home waterfall), FIRE & Retirement Planner milestone table, per-person paycheck modeling with server-backed `paycheck_deductions` table, Monthly Expenses page feeding budget generation
- Accounts page: modal editor replacing inline expand, compact DataCards, per-person Maxed Out badge
- Data layer: `planner_people.bonus_frequency` + `paycheck_deductions` table (`name`, monthly `amount`, `pretax`, `kind`, `linked_account_id` FK→assets) + `assets.tax_treatment` (PRE_TAX/ROTH); removed dead `paycheck` JSON column, `PLANNER_BONUS_MODE_OPTIONS`, `usePlanner.ts`, `usePlannerRetirementInputs.ts`, `PLANNER_DEFAULT_MONTHLY_EXPENSES`

## Refinements (from deployed review)

### Tier 1 — Small Effort (< 30 min each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 1 | Dashboard | Remove redundant vertical scroll for blank space under cards | High | |
| 2 | Accounts | Hide the card header caret — same annoyance as People | High | |
| 3 | Accounts | Delete icon should have no red background, add confirmation dialog | High | Solution #3 pattern |
| 4 | Accounts | Fix missing pointer cursor on buttons | Medium | |
| 5 | Accounts | Add info icons (tooltips) for fields | Medium | |
| 6 | Accounts | Show purple badge for owners (border style when unselected, filled when selected) | Low | Currently plain purple text |
| 7 | Accounts | Fix error messages on invalid input (chars in number fields) — currently flash and revert | High | Need to persist validation state |
| 8 | Goals | Connect goals to accounts to track progress | Medium | |
| 9 | Goals | FOO doesn't show real FOO for user | High | |
| 10 | Tools | Remove Tools page entirely, show all tools as cards on Dashboard | Medium | |
| 11 | Tools | Tool dropdown text + icon should flex space-between | Low | |
| 12 | Future | Projection chart account name keys should match chart line colors | Medium | Currently all white |
| 13 | People | ~~Better UI for People cards — use modal editing~~ — DONE: DataCard + PersonFormModal with tabbed sections | High | |
| 14 | People | ~~Show last updated time on each People card~~ — DONE: updatedAt on DataCard | Medium | |
| 15 | People | ~~Income growth from dropdown instead of manual number input~~ — DONE: inflation-anchored presets + custom input | Medium | |
| 16 | People | ~~Confirm before removing person~~ — DONE: ConfirmDialog | High | |

### Tier 2 — Medium Effort (30 min – 2 hrs each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 17 | People | ~~Edit/add via modal~~ — DONE: PersonFormModal | Medium | |
| 18 | People | Mobile view of cards needs improvement | Medium | |
| 19 | Accounts | ~~Weekly/biweekly contribution options~~ — DONE: contribution modes on assets | Medium | |
| 20 | Accounts | ~~Show yearly total contributions~~ — DONE: Monthly total on ExpensesSummaryCard | Medium | |
| 21 | Dashboard | Allow clicking assets/liabilities for quick view | Medium | |
| 22 | Preferences | Combine profile picture + preferences + theme toggle into avatar dropdown | Medium | |
| 23 | Future | Account contribution breakdown — sortable table | Medium | |
| 24 | People | Add savings deduction → creates real account (401k/HSA) via same mutation as Accounts page | High | "Add Savings Account" button exists; needs create dialog wiring |

### Tier 3 — Large Effort (2+ hrs each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 25 | People | Per-person IRS limit tracking — shared 401(k)+403(b) limit, separate 457, catch-up 50+, super catch-up 60–63 | High | Drives Maxed Out badge |
| 26 | People | Roth vs pre-tax on account cards + editor | High | `assets.tax_treatment` column exists |
| 27 | People | Employer match modeling (vesting, dollar cap) | Medium | |
| 28 | People | HSA family vs individual limit awareness | Medium | |
| 29 | Accounts | Plaid integration — auto-sync transactions, detect recurring expenses | Medium | |

---

## Solution Patterns

1. **Modal editing** — Instead of inline card editing, click edit → opens modal → saves on confirm. Applies to: People, Accounts.
2. **Middleware pattern** — Resolver-level middleware for cascading deletes/reconciliation. Applies to: Person deletion (reconcile accounts, Plaid connections).
3. **Confirmation dialog** — Reusable delete confirmation component. Applies to: Accounts delete, People delete, Goals delete.
