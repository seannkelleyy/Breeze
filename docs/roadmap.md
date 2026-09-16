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
3. Account projections — retirement account growth, IRS limits, IsMaxing
4. Retirement scenarios — FI number, FIRE progress, what-if modeling
5. Plaid integration — auto-sync transactions
6. Tax planning — form checklist, estimate
7. Roth ladder + HSA ladder — advanced FIRE features

## Sean's notices

1. ~~On iphone, the area around the search bar and top bar is white instead of black.~~ (fixed — added `apple-mobile-web-app-status-bar-style` metadata)
2. ~~I created some accounts while signed in with clerk via github. then my wife created an account via clerk and apple and she saw my accounts. This is in hosted env.~~ (fixed — all resolvers now enforce authenticated userId via `resolveUserIDFromCtx`)

---

## Refinements (from deployed review)

### Tier 1 — Small Effort (< 30 min each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 1 | Dashboard | Remove redundant vertical scroll for blank space under cards | High | |
| 2 | People | Remove the gray "People" card with top-right caret — not needed | High | |
| 3 | Accounts | Hide the card header caret — same annoyance as People | High | |
| 4 | Accounts | Delete icon should have no red background, add confirmation dialog | High | Solution #3 pattern |
| 5 | Accounts | Fix missing pointer cursor on buttons | Medium | |
| 6 | Accounts | Add info icons (tooltips) for fields | Medium | |
| 7 | Accounts | Show purple badge for owners (border style when unselected, filled when selected) | Low | Currently plain purple text |
| 8 | Accounts | Fix error messages on invalid input (chars in number fields) — currently flash and revert | High | Need to persist validation state |
| 9 | Goals | Connect goals to accounts to track progress | Medium | |
| 10 | Goals | FOO doesn't show real FOO for user | High | |
| 11 | Tools | Remove Tools page entirely, show all tools as cards on Dashboard | Medium | |
| 12 | Tools | Tool dropdown text + icon should flex space-between | Low | |
| 13 | Future | Projection chart account name keys should match chart line colors | Medium | Currently all white |
| 14 | Future | Basic Financial Health and Income + Savings sections can be combined | Medium | Consolidate into one card |

### Tier 2 — Medium Effort (30 min – 2 hrs each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 15 | People | Better UI for People cards — use modal editing (Solution #1) | High | Click edit → modal instead of inline edit |
| 16 | People | Show last updated time on each People card | Medium | Similar to accounts |
| 17 | People | Income growth from dropdown instead of manual number input | Medium | Like return profile |
| 18 | People | Confirm before removing person, reconcile tied accounts/items | High | Middleware pattern (Solution #2) |
| 19 | People | Mobile view of cards needs improvement | Medium | |
| 20 | People | Edit/add via modal — add edit pencil next to delete, "Save" or "Save & Create Another" | Medium | |
| 21 | Accounts | Better collapsed card UI — not a large gray box next to open card | Medium | |
| 22 | Accounts | Add buttons for each account type, sticky on scroll | Medium | |
| 23 | Accounts | Weekly/biweekly contribution options — pull pay frequency from People page | Medium | New input mode |
| 24 | Accounts | Show yearly total contributions + monthly in card | Medium | For IRS-max accounts show `$24,000/$30,000` format |
| 25 | Dashboard | Allow clicking assets/liabilities for quick view (mini drill-down) | Medium | |
| 26 | Dashboard | Replace Tools page with tool cards directly on Dashboard | Medium | (overlap with #11) |
| 27 | Preferences | Combine profile picture + preferences + theme toggle into avatar dropdown | Medium | |
| 28 | Future | Account contribution breakdown — sortable table, click account name to navigate | Medium | Need URL param routing to accounts page |
| 29 | Future | Net Worth card — show asset amounts, subtract liabilities, click account names to link | Medium | |

### Tier 3 — Large Effort (2+ hrs each)

| # | Page | Task | Priority | Notes |
|---|------|------|----------|-------|
| 30 | Future | Redesign left-side inputs — currently only inputs, needs new design | Medium | Layout rethink |
| 31 | Future | Create Expenses tab — monthly expenses, tie into budgets | High | New feature area |
| 32 | Future | Mark people as "primary" in household — spouses planning together | High | Affects retirement calc |
| 33 | Future | Retirement card rework — combine inputs + cards, show FIRE versions with scores | High | Traditional, Coast FIRE, etc. with portfolio at age, year, ages |
| 34 | Future | Gross/Net income breakdown — Gross Income + Bonus in parens, Net Income, Tax Rate, Annual Spend, Annual Investments, Annual Savings, Savings Rate (investments+savings vs income), Emergency Fund months (color-coded R/Y/G) | Medium | Consolidate multiple indicators |
| 35 | Middleware | Create reusable confirmation/delete pattern (Solution #3) | Medium | Shared across People, Accounts, Goals |

---

## Solution Patterns

1. **Modal editing** — Instead of inline card editing, click edit → opens modal → saves on confirm. Applies to: People, Accounts.
2. **Middleware pattern** — Resolver-level middleware for cascading deletes/reconciliation. Applies to: Person deletion (reconcile accounts, Plaid connections).
3. **Confirmation dialog** — Reusable delete confirmation component. Applies to: Accounts delete, People delete, Goals delete.
