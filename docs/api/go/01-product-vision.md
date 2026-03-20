# 01 — Product Vision

## What This Is

This is not a budget app. It is a **personal finance planner** — the single place where a user's entire financial life lives. It connects daily budgeting to long-term retirement planning in one coherent, self-hostable tool.

> **One-sentence pitch:** "The only self-hostable personal finance planner that connects your daily budget to your Roth conversion schedule, HSA ladder, and early retirement projections — on your server, private forever."

---

## Core Modules

| Module | Description |
|---|---|
| Today | Monthly budget, spending by category/tag, cash flow |
| Balance Sheet | Assets with projections, liabilities with payoff plans, net worth over time |
| Retirement | Account projections, IRS contribution tracking, safe withdrawal modeling |
| Debt | Payoff strategy (avalanche/snowball), payoff timeline, interest saved |
| Planning | Goals, what-if scenarios, tax estimate, FIRE number tracking |
| Plaid Integration | Auto-sync transactions, account discovery, balance updates |
| Tax Planning | Form checklist, estimated refund/owed, effective and marginal rates |
| Early Retirement | Roth conversion ladder, HSA receipt ladder, SEPP (Rule 72t), scenario modeling |

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

- Not a tax filing tool — estimates only, always recommend a CPA
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
