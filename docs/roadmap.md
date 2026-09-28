# Roadmap

## Next Up

1. **Debt payoff module** — the last unbuilt pillar. Avalanche/snowball strategy engine, payoff timeline, interest-saved comparison, page. Schema is ready: `liabilities.payoff_priority`, `liabilities.target_extra_payment`, and `users.payoff_strategy` exist unused.
2. **Pre-launch switchovers** — see [production-checklist.md](deployment/production-checklist.md): Clerk production instance, Plaid production approval, and rotation of the exposed credentials (old Clerk `sk_test_` key + old Azure SQL password in public git history; Render DB password from chat).
3. **Feature backlog** — People mobile layout (#18), dashboard blank scroll (#1), saved retirement scenarios, Roth conversion tracking + HSA receipt ladder, employer match vesting (#27), recurring-expense detection (#29), FOO auto-derivation from financial state, partial Intl.NumberFormat sweep.

## Deployment

- [x] Deploy API to Render — live, deploys green (native Go runtime; `make migrate-deploy` + seed in the build command)
- [x] Deploy frontend to Render
- [x] Set up production PostgreSQL on Render — squashed baseline applied, reference data seeded
- [ ] Configure Clerk production environment — dev instance (`pk_test_*`) still in use
- [ ] Configure Plaid production environment — `PLAID_ENV=sandbox`; requires Plaid approval

## CI Cleanup

- [x] Update `docs/deployment/01-hosting.md` to reflect Render deployment — Render section describes the real setup; stale `golang:1.23` Dockerfile pin fixed 2026-09-28

## Dashboard

- [x] Add net worth history chart (past to present) — line chart of user-captured snapshots (totals-only or per-account breakdown)

## Product (from vision)

1. ~~Balance sheet — assets, liabilities, net worth over time~~ — SHIPPED
2. ~~Budget — monthly envelope budgeting, categories, expense splits~~ — SHIPPED
3. ~~Account projections — retirement account growth, IRS limits, IsMaxed~~ — DONE: FIRE planner equation card, per-person Maxed Out badge, per-person IRS aggregation (see #40)
4. Retirement scenarios — FI number, FIRE progress, what-if modeling — MOSTLY DONE: FI number, FIRE progress, retirement-age + market-adjustment what-ifs shipped; saved scenarios dropped deliberately (may revisit)
5. ~~Plaid integration — auto-sync transactions~~ — SHIPPED in sandbox (production pending — see Deployment)
6. ~~Tax planning — form checklist, estimate~~ — SHIPPED
7. Roth ladder + HSA ladder — PARTIAL: Roth access/conversion ladder calculator at `/retirement-ladder` (5-year rule, early-access modeling); HSA receipt ladder + conversion tracking not started

## Sean's notices

1. ~~On iphone, the area around the search bar and top bar is white instead of black.~~ (fixed — added `apple-mobile-web-app-status-bar-style` metadata)
2. ~~I created some accounts while signed in with clerk via github. then my wife created an account via clerk and apple and she saw my accounts. This is in hosted env.~~ (fixed — all resolvers now enforce authenticated userId via `resolveUserIDFromCtx`)

---

## Recently Completed (September 2026 waves)

Condensed changelog — details in git history.

- **People & paycheck modeling**: server-backed withholdings (`paycheck_deductions` with `kind` + optional linked account), account-backed 401(k)/HSA savings with Roth/pre-tax `assets.tax_treatment`, per-person waterfall + payday calendar + income-growth presets + bonus cadence; PeopleCard split into shell / summary card / form modal.
- **Future page**: Current Snapshot rebuilt as the real income waterfall (gross → pre-tax savings → withholdings → taxes → take-home); FIRE planner + milestone table; projection chart with drawdown to 95, retirement-age and market-adjustment what-if sliders, series toggles; Maxed Out badges aggregate per-person IRS limits (shared 401(k)+403(b) deferral, own 457 limit, catch-up 50+, super catch-up 60–63); Monthly Expenses page feeds budget generation.
- **Budget**: Regenerate Month derives one income row per real payday from the People waterfall (including three-check biweekly months, `PEOPLE_PAYROLL` source); categorizing a bank transaction creates the matching budget expense (plan-vs-actual, `transactions.expense_id` link); headline numbers currency-formatted.
- **Bank data**: `transactions` table + Plaid `/transactions/get` sync (per-connection plus hourly sync-all river worker via `cmd/river`); category assignment with preservation across re-syncs; net-worth snapshots + dashboard history chart.
- **Platform**: migration squash to a single baseline (22 tables); 2026 tax reference seeds (brackets, standard deductions, FICA wage base); ownership-scoping sweep — every read and write user-scoped, with an enforcement test over the query files; test-coverage wave (API service 68.7%, jobs 83.3%, web 438 tests); docs audit + corrections; dead clusters removed (`scenario_*`, `retirement_accounts`, `contribution_entries`, unused ops).

## Refinements (from deployed review)

### Tier 1 — Small Effort (< 30 min each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 1 | Dashboard | Remove redundant vertical scroll for blank space under cards | High | |
| 2 | Accounts | ~~Hide the card header caret — same annoyance as People~~ — DONE: compact cards have no caret; pencil opens the editor | High | |
| 3 | Accounts | Delete icon should have no red background, add confirmation dialog | High | Confirmation dialog done (ConfirmDialog); red `destructive` background still present |
| 4 | Accounts | Fix missing pointer cursor on buttons | Medium | |
| 5 | Accounts | ~~Add info icons (tooltips) for fields~~ — DONE: `InfoTip` wired into the account editors (Contribution Type, Match %, Match Up To %, Tax Treatment) | Medium | |
| 6 | Accounts | ~~Show purple badge for owners~~ — DONE: filled when selected, bordered when unselected | Low | |
| 7 | Accounts | ~~Fix error messages on invalid input (chars in number fields)~~ — DONE: invalid drafts persist in `FormattedNumberInput` | High | |
| 8 | Goals | ~~Connect goals to accounts to track progress~~ — DONE: `connectedAccountIDs` + progress bars from balances vs target | Medium | |
| 9 | Goals | ~~FOO doesn't show real FOO for user~~ — DONE: 9 canonical FOO steps created per user and toggleable; auto-derivation from financial state is a separate backlog idea | High | |
| 10 | Tools | ~~Remove Tools page entirely~~ — DONE: Tools page and dropdown removed; Budget, Mortgage, Connections are direct nav bar items; calculator lives at `/mortgage` | Medium | |
| 11 | Tools | ~~Tool dropdown text + icon should flex space-between~~ — MOOT: Tools dropdown removed (see #10) | Low | |
| 12 | Future | Projection chart account name keys should match chart line colors | Medium | |
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
| 24 | People | ~~Add savings deduction → creates real account (401k/HSA) via same mutation as Accounts page~~ — DONE: full account support lives in the edit-person modal (SavingsAccountsSection with the same AccountListItem editor + autosave as the Accounts page) | High | |

### Tier 3 — Large Effort (2+ hrs each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 25 | People | ~~Per-person IRS limit tracking — shared 401(k)+403(b) limit, separate 457, catch-up 50+, super catch-up 60–63~~ — DONE: drives the Maxed Out badge; limits seeded per year in `contribution_limits` | High | |
| 26 | People | ~~Roth vs pre-tax on account cards + editor~~ — DONE: Tax Treatment select in account editor, Roth/Pre-tax badge on tax-advantaged cards | High | `assets.tax_treatment` column exists |
| 27 | People | Employer match modeling (vesting, dollar cap) | Medium | Match rate + cap columns exist; vesting not modeled |
| 28 | People | ~~HSA family vs individual limit awareness~~ — DONE: `contribution_limits.family_annual_limit` seeded and fetched by `useIrsLimits` | Medium | |
| 29 | Accounts | Plaid integration — auto-sync transactions, detect recurring expenses | Medium | Auto-sync DONE (per-connection + hourly sync-all); recurring-expense detection remains |

---

## Solution Patterns

1. **Modal editing** — Instead of inline card editing, click edit → opens modal → saves on confirm. Applies to: People, Accounts.
2. **Middleware pattern** — Resolver-level middleware for cascading deletes/reconciliation. Applies to: Person deletion (reconcile accounts, Plaid connections).
3. **Confirmation dialog** — Reusable delete confirmation component. Applies to: Accounts delete, People delete, Goals delete.
