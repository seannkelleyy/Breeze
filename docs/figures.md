# User-Facing Figures Reference

Every number the app displays, how it is calculated, and where. When adding or
changing a displayed figure, update this doc and reuse the canonical function —
most inconsistencies below exist because a second computation was written
instead of reusing the first.

**Status legend:** ✅ canonical/consistent · ⚠️ inconsistent duplicates exist · 🐛 active bug

---

## Canonical functions (reuse these)

| Function | File | Definition |
|---|---|---|
| `getPersonBaseAnnualIncome` | `breeze.web/app/future/lib/plannerMath.ts` | hourly: `hourlyRate × hours × 52`; else `annualSalary` |
| `getPersonBonusPerYear` | plannerMath.ts | dollars: `annualBonus` (yearly total); percent: `base × annualBonus × perYear / 100` |
| `getTotalAnnualIncome` | plannerMath.ts | **CANONICAL household/person annual income** = `annualSalary + getPersonBonusPerYear` |
| `getPersonTotalIncome` | plannerMath.ts | hourly-aware variant used by the People page |
| `getPersonsAnnualIncome` | plannerMath.ts | Σ owners' `annualSalary` — **contribution/match math only** (deliberately bonus-free) |
| `getEmployeeMonthlyContribution` | plannerMath.ts | per-mode normalization (weekly ×52/12, biweekly ×26/12, yearly ÷12, salary-% of owner income) |
| `getLiabilityPrincipalMonthly` | plannerMath.ts | `max(0, payment − balance × rate/12)` |
| `getEmployerMatchMonthly` | plannerMath.ts | `min(contrib×12, income × matchMax) × matchRate ÷ 12` |
| `getPretaxShare` | `future/lib/paycheck.ts` | `pretaxSharePercent ?? (taxTreatment === 'ROTH' ? 0 : 1)`, clamped 0–1 |
| `getFederalTax` / `getFicaTax` / `getEffectiveTaxRate` | `future/lib/tax.ts` | bracket walk; `min(income, ssWageBase)×6.2% + income×1.45%`; `(federal+fica)/income` |
| `getSuggestedAnnualLimit` | plannerMath.ts | IRS base + catch-up (50+) / super catch-up (60–63); family HSA limit when household >1 |

---

## Future page

| Figure | Shown | Formula |
|---|---|---|
| Income tile | Current Snapshot | `household.annualHouseholdIncome ÷ 12` — Σ `getTotalAnnualIncome` ⚠️ hourly-blind (see I-1) |
| Waterfall Gross | Income Waterfall | `computeHouseholdWaterfall` → `(hourly-aware base + bonus) ÷ 12` ✅ |
| − Pre-tax savings | Income Waterfall | Σ contribution × `getPretaxShare` ✅ |
| − Pre-tax withholdings | Income Waterfall | Σ pretax withholdings per person ✅ |
| Taxes (est. X% effective) | Income Waterfall | `taxableMonthly × getEffectiveTaxRate(taxableAnnual)` ⚠️ I-2/I-3: subtracts the standard deduction from already-reduced income, applies it per person, and FICA is computed on the reduced income |
| − Roth savings · post-tax withholdings | Income Waterfall | Σ roth contributions + post-tax withholdings ✅ |
| Take-home | Income Waterfall | `gross − taxes − savings − post-tax withholdings` ✅ |
| − Debt principal paydown | Income Waterfall | Σ `getLiabilityPrincipalMonthly` (principal only) ✅ but ⚠️ I-5 |
| Free after expenses | Income Waterfall | `takeHome − profile monthlyExpenses` ⚠️ I-6 |
| Savings rate (of gross income) | Income Waterfall | `(totalPlannedMonthlyInvestment × 12) ÷ snapshot.grossIncome`, capped at 100 🐛 I-5, ⚠️ I-7 |
| Net Worth / Assets / Liabilities | Current Snapshot | equity-based for combined assets ⚠️ I-8 |
| Progress to target | Current Snapshot | `totalStartingBalance ÷ projectedNetWorthAtTargetAge` ✅ |
| Wealth by tax treatment | Taxes page | pre-tax/Roth/taxable via `getPretaxShare`, property+liabilities excluded ✅ |

## People page

| Figure | Shown | Formula |
|---|---|---|
| Household header (Base Pay / Bonus / Total / Taxes / Savings / Withholdings / Take-home) | People page header | Σ `getPersonTotalIncome` (hourly-aware) with bonus split out ✅ except ⚠️ I-3 (inline effective-rate recompute) |
| Payday calendar amounts | Payday Calendar | `takeHomeAnnual ÷ paychecksPerYear`, unrounded ⚠️ I-12 |
| Person card "Total: X/yr" | Person card | ⚠️ I-1: local salary-only computation — disagrees with the header for hourly workers |
| Person modal waterfall | Edit person | per-person `computePersonWaterfall` ✅ except ⚠️ I-3 (effective rate = tax ÷ *taxable*) |

## Accounts page

| Figure | Shown | Formula |
|---|---|---|
| Personal contributions | Page footer | Σ full employee contributions + liability principal 🐛 I-5 (double count with Total), ⚠️ I-6 |
| Employer match | Page footer | Σ `getEmployerMatchMonthly` ⚠️ I-4 |
| Debt payments | Page footer | Σ **full payments** (principal + interest) ⚠️ I-5 — different from the principal-only figure elsewhere |
| Total | Page footer | `plannerSummary.totalPlannedMonthlyInvestment ?? computedTotal` 🐛 I-5 — the four footer lines are not additive |
| Per-account "$X/mo ($Y/yr) · Z% return" | Account card | `getEmployeeMonthlyContribution` + real-mode Fisher conversion of the rate ⚠️ I-9 (APR deflated in real mode) |
| incl. $X/mo employer match | Account card | `getEmployerMatchMonthlyFromAnnual` with the **oldest owner's** salary ⚠️ I-4 |
| Maxed Out / Over Limit / IRS hint | Account card | `getPersonGroupAnnualContribution` vs `getSuggestedAnnualLimit` with the **oldest owner's** age ⚠️ I-4 |
| Projected at target-age (tables) | Future → Projection tables | per-account balances of the target-age projection row ✅ |

## Taxes page

| Figure | Shown | Formula |
|---|---|---|
| Scenario columns (total tax) | Pre-tax effect | bracket walk + FICA on **full gross** ⚠️ I-2 (differs from the waterfall's FICA basis) |
| Effective rate | Pre-tax effect | `totalTax ÷ gross` ⚠️ I-3 |
| "You're in the N% bracket… $Y more…" | Pre-tax effect | `buildBracketLadder(current.taxableIncome)` ✅ |
| Bracket ladder table | Pre-tax effect | every bracket: range, used, remaining, tax ✅ |
| Tax saved per year | Summary strip | `baseline.totalTax − current.totalTax` — equals federal-bracket savings only (FICA cancels) ✅ |
| Wealth by tax treatment | Taxes page | balances split via `getPretaxShare`; property + liabilities excluded ✅ |

## Other pages

| Figure | Shown | Formula |
|---|---|---|
| Dashboard Net Worth / Assets / Liabilities | Dashboard | server `currentValue − currentBalance` sums (full home value, loans subtracted) ⚠️ I-8 |
| Net worth history | Dashboard | stored snapshots only |
| Budget Income / Expenses / Difference | Budget page | server Σ income rows (NET take-home per payday) vs Σ category allocations (planned) |
| Goal progress | Goals page | Σ connected accounts' `startingBalance` ÷ target 🐛 I-10 (connected liabilities would *add*) |
| Expenses Monthly/Yearly Total | Expenses page | Σ recurring templates normalized (weekly ×52/12 …) ✅ |
| Mortgage payment/interest/payoff | Mortgage page | standard annuity `P·r/(1−(1+r)⁻ⁿ)` + amortization simulation ⚠️ I-11 |
| Retirement ladder | Retirement ladder page | server simulation: 5-year Roth rule, 10% penalty under 59, **no standard deduction, no growth** ⚠️ I-11 |

---

## Known inconsistencies

### 🐛 Bugs (wrong numbers displayed)

1. **Debt-principal double count in `totalPlannedMonthlyInvestment`.**
   `usePlannerModel.ts` passes principal of **all** liabilities as `linkedDebtPrincipalMonthly` into `usePortfolioCalculation`, which adds it on top of `investedFromAccounts` that already contains unlinked liability principal. Unlinked loans are counted twice — inflating the Savings tile, both savings rates, "Planned Monthly", `monthlyGap`, and `savingsRateGap`. (`usePlannerModel.ts:82-95` vs `usePortfolioCalculation.ts:77-85` + `plannerMath.ts:67-71`.)
2. **Tax-planning page shows effective/marginal rates 100× too small.**
   The API returns fractions (0.1695) and the page renders `0.17%` instead of `16.96%`. Also "Total Income" is mislabeled — it displays *taxable* income — and STANDARD sends a $0 deduction. (`TaxForm.tsx:53`, `TaxResults.tsx:44-45`, `tax_planning.go:134-141`.)
3. **Goal progress adds connected liabilities.**
   `goals/page.tsx:351-353` sums connected accounts' balances without checking the account is an asset — a connected loan would *increase* progress.
4. **Accounts footer not additive.**
   "Personal contributions" already includes liability principal, "Debt payments" shows it again (at full payment), and "Total" switches formula depending on whether `plannerSummary` is populated (`usePlannerAccounts.ts:92-93`). The four lines cannot be summed as displayed.

### ⚠️ Inconsistent duplicates (same concept, different formulas)

- **I-1 Income**: `getTotalAnnualIncome` (canonical, salary-blind for hourly) vs `getPersonTotalIncome` (hourly-aware, People page) vs `PersonSummaryCard`'s local salary-only copy. Hourly households see three different "income" numbers.
- **I-2 FICA basis**: waterfall applies FICA to *post-reduction* income (pre-tax contributions save FICA); the Taxes page applies it to *full gross* — so the Taxes page overstates FICA for anyone with pre-tax elections, and its "Tax saved" figure is federal-only while the Future waterfall's tax line responds to both.
- **I-3 "Effective rate" has five meanings**: (a) Taxes page `(federal+fica on gross)/gross`; (b) per-person waterfall `(federal on (taxable − deduction) + fica)/taxable` — which also subtracts the standard deduction from already-reduced income; (c) household `Σtaxes/Σgross`; (d) HouseholdPayPanel recomputes inline; (e) tax-planning API `federal/taxable`, no FICA.
- **I-4 Employer match, four ways**: account card (oldest owner's salary, no IRS cap), footer/breakdown totals (Σ all owners' salaries, monthly basis), projection engine (first owner, grown salary, IRS-capped contribution). Multi-owner households see different match numbers for the same account.
- **I-5 Debt figures**: full payment (Accounts footer) vs principal-only (savings rate, waterfall) vs the double count in bug 1.
- **I-6 "Monthly expenses"**: budget headline = Σ allocations (planned); Future snapshot = recurring-template total; Dashboard setup = profile field. Three sources, no single definition.
- **I-7 Savings rate caps**: one display caps at 100%, another (same card) doesn't.
- **I-8 Net worth**: Dashboard = full value − loans; Future = equity for combined assets, 0 for detail-less home/vehicle; Taxes wealth map excludes property entirely; goal progress sums raw `startingBalance`.
- **I-9 Real-mode rate conversion** applies the Fisher deflation to liability APR too (a loan's stated rate displayed as a real rate).
- **I-10 IRS owner-age**: oldest owner (cards) vs max age (tables) vs first owner aged +growth (projections) — catch-up eligibility can differ per view.
- **I-11 Mortgage/retirement-ladder conventions**: closing costs financed *and* counted upfront; 720-month simulation cap; ladder applies no standard deduction, no growth, and a 59 (not 59½) penalty threshold.
- **I-12 Currency**: Budget tables and the Taxes bracket ladder hardcode `'USD'`; headlines use the user's currency.
- **I-13 Bonus percent-mode storage**: the modal stores annual-equivalent, the canonical annualizer multiplies by frequency again — quarterly/monthly *percent* bonuses are inflated 4×/12× (dollars mode is consistent).

### 🗑️ Dead code (computed or defined, never shown)

`getPersonPaycheckAmount`, `getYearsUntilGoalEstimate`, `FIREVariantCard`, `computeRefinanceNpv`, `computeBreakEvenMonths`, `loanPaidDownPercent` (lib copy), `PLANNER_SAFE_WITHDRAWAL_RATE_SUGGESTIONS`, `currentSavingsRateEmployee` (computed + synced, never rendered), snapshot fields `yearlySavings`/`netIncome`/`emergencyFund3/6/12Months`, BudgetProvider `totalSpent`, retirement ladder `earlyWithdrawalPenalty` (fetched, never rendered).

---

## Convention decisions this doc encodes

1. **Household income = salaries + ALL bonuses** (both modes, all frequencies), via `getTotalAnnualIncome`. Hourly households should use the hourly-aware base — `getTotalAnnualIncome` needs the hourly fix (I-1).
2. **Savings rate counts loan principal, not interest**, and the denominator is canonical household income.
3. **Employer match never appears in tax or waterfall figures** — it isn't paycheck cash flow and isn't taxable income.
4. **Debt "payments" vs "principal" must be labeled explicitly** — they are different numbers by intent.
