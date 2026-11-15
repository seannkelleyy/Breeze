# 01 — Product Vision

## What This Is

This is not a budget app. It is a **personal finance planner** — the single place where a user's entire financial life lives. It connects daily budgeting to long-term retirement planning in one coherent, self-hostable tool.

> **One-sentence pitch:** "The only self-hostable personal finance planner that connects your daily budget to your Roth conversion schedule, HSA ladder, and early retirement projections — on your server, private forever."

---

## Core Modules

| Module | Description |
|---|---|
| Today | Monthly budget, spending by category/tag, cash flow; conscious spending plan structure (fixed costs, savings, investments, guilt-free spending) |
| Balance Sheet | Assets with projections, liabilities with payoff plans, net worth over time |
| Retirement | Account projections, IRS contribution tracking, safe withdrawal modeling |
| Debt | Payoff strategy (avalanche/snowball), payoff timeline, interest saved |
| Planning | Goals, what-if scenarios, tax estimate, FIRE number tracking, crossover milestone (the year investment returns exceed earned income) |
| Plaid Integration | Auto-sync transactions, account discovery, balance updates |
| Tax Planning | Filing-season help: form checklist, document gathering, estimated refund/owed, effective and marginal rates. Estimates only — never files on the user's behalf |
| Early Retirement | Roth conversion ladder with tax-bracket scheduling, HSA receipt ladder, HSA+Roth contribution planning, account drawdown ordering (which accounts to use first), SEPP (Rule 72t), scenario modeling |

---

## What Makes It Different

People currently stitch together 4-6 separate tools to manage their finances:

| Job | Tool they use today |
|---|---|
| Monthly budget | YNAB / Monarch |
| Net worth tracking | Empower / Personal Capital |
| Retirement projections | ProjectionLab / Vanguard tool |
| Debt payoff | Undebt.it |
| Investment tracking | Empower / Sharesight |
| Tax planning | TurboTax once a year |

This app owns the whole picture. Key differentiators:

- **Self-hostable** — one `docker compose up`, private forever. No mainstream app offers this.
- **Full financial picture** — not just budgeting. Balance sheet, retirement, debt, tax in one place.
- **FIRE planning integrated with live budget data** — no competitor does this.
- **Roth conversion schedules + HSA ladder tracking** — deeply underserved features.
- **Scenario modeling** — compare retire at 50 vs 55, 3.5% vs 4% SWR. What ProjectionLab charges $120/year for.
- **Couples as a first-class concept** — multiple Persons per User account, joint assets and liabilities.

---

## User Personas

**Primary:** Developer or technically-minded person who values privacy, wants control over their financial data, and is thinking seriously about FIRE or early retirement.

**Secondary:** A couple sharing finances who want one place to see the complete household picture.

**Self-hosted user:** Privacy-conscious, runs their own infrastructure, willing to manage their own Postgres. Plaid dev credentials required (free tier covers them).

---

## What This App Is Not

- Not a tax filing tool — checklists, document gathering, and estimates only; never files on the user's behalf. Always recommend a CPA
- Not a financial advisor — projections are informational, not advice
- Not a replacement for a CPA for SEPP (Rule 72t) calculations — always recommend professional advice before starting
- Not a public-facing app requiring SEO — entirely auth-gated

---

## Build Order (Recommended)

Don't start with the budget. Start with what makes this different:

1. **Balance sheet** — assets, liabilities, net worth over time. Most visually impressive, establishes this isn't YNAB.
2. **Budget** — monthly envelope budgeting, categories, expense splits.
3. **Account projections** — retirement account growth, IRS limits, IsMaxing.
4. **Retirement scenarios** — FI number, FIRE progress, what-if modeling.
5. **Plaid integration** — auto-sync transactions.
6. **Tax planning** — form checklist, estimate.
7. **Roth ladder + HSA ladder** — advanced FIRE features.

A user who enters their home value, car, retirement accounts, and mortgage on day one has already invested enough that they'll come back. Start there.

## Build Status (Nov 2026)

The build order above is **complete**. Verified end-to-end (DB tables + GraphQL resolvers + UI) per module:

| # | Module | Status |
|---|---|---|
| 1 | Balance sheet | Done — all 12 asset / 6 liability types, net worth snapshots + dashboard history |
| 2 | Budget | Done — categories, expenses with splits, incomes, recurring templates that regenerate months |
| 3 | Account projections | Done — growth model, IRS limits with maxed-out detection, Coast FIRE |
| 4 | Retirement scenarios | Partial — FI number, FIRE progress, what-if knobs done; no side-by-side scenario comparison |
| 5 | Plaid integration | Done — link, connection sync, transactions with category assignment; sync is mutation-triggered, no scheduled job |
| 6 | Tax planning | Partial — estimate with effective/marginal rates done; form checklist and refund/withholding reconciliation absent |
| 7 | Roth + HSA ladders | Mostly done — ladder calculator, bracket-filling suggestions, HSA receipts/reimbursements, drawdown ordering; SEPP (Rule 72t) absent |

Shipped beyond the original build order: mortgage analyzer, debt payoff planner, dashboard, tax estimator.

All routes are reachable from the nav (`navConfig.ts` is the source of truth); `/retirement-ladder` and `/tax-planning` were previously orphaned and have been wired in. User preferences live in the `UserMenu` preferences dialog (`components/common/auth/UserMenu.tsx`).

**Remaining gaps (candidate backlog):**
1. Tax form checklist (no table/resolver/UI anywhere)
2. Estimated refund/owed with withholding reconciliation (`TaxEstimate` has `taxOwed` only)
3. Side-by-side what-if scenario comparison (retire age, SWR) — `FinancialMathScenario` type exists but unused
4. SEPP / Rule 72(t) — no code anywhere
5. Auto net-worth snapshots (currently manual only; could capture on Plaid sync)
6. Scheduled Plaid sync job (currently manual + once-per-session page-load auto-sync)
7. Crossover point (year investment returns exceed earned income) — zero code
8. Minor: multi-split expense editing (UI edits first split only), household-level "who isn't maxing" roll-up
