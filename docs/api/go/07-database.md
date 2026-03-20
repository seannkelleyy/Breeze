# 07 — Database

## PostgreSQL 16 on Neon

- **Neon serverless** — scales to zero at rest, near-zero idle cost
- **Branch per environment** — main (prod), staging, dev — like git branches for your Postgres data
- **Atlas manages schema** — `schema.hcl` is the source of truth, migrations are generated never hand-written
- **sqlc reads the same schema** — one file drives both Atlas and sqlc

---

## Universal Table Conventions

| Convention | Rule |
|---|---|
| Primary key | UUID — `DEFAULT gen_random_uuid()` in Postgres, never in Go |
| Timestamps | `created_at` + `updated_at` TIMESTAMPTZ DEFAULT now() on every table |
| Soft deletes | `deleted_at TIMESTAMPTZ NULL` — every query filters `WHERE deleted_at IS NULL` |
| Immutable rows | NetWorthSnapshot, TaxEstimate, RetirementScenario — no `updated_at` or `deleted_at` |
| Money amounts | `NUMERIC(12,2)` — never FLOAT |
| Large balances | `NUMERIC(14,2)` — net worth totals |
| Rates / percentages | `DECIMAL(7,4)` — e.g. 0.2200 for 22% |
| Small rates | `DECIMAL(5,4)` — e.g. 0.0350 for 3.5% |
| Budget date | DATE always first-of-month — e.g. 2026-03-01, never separate month/year integers |

---

## Atlas Schema Template

Every table follows this pattern:

```hcl
table "table_name" {
  schema = schema.public
  column "id"         { type = uuid         default = sql("gen_random_uuid()") }
  column "user_id"    { type = uuid }
  # ... domain columns ...
  column "created_at" { type = timestamptz  default = sql("now()") }
  column "updated_at" { type = timestamptz  default = sql("now()") }
  column "deleted_at" { type = timestamptz  null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_table_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_table_user_active" {
    columns = [column.user_id]
    where   = "deleted_at IS NULL"    # partial index
  }
}
```

---

## Partial Indexes — Use on Every High-Traffic Table

PostgreSQL partial indexes only index non-deleted rows. Since most queries filter `deleted_at IS NULL`, this dramatically reduces index size and speeds up reads.

```hcl
index "idx_expenses_budget_active" {
  columns = [column.budget_id]
  where   = "deleted_at IS NULL"
}
```

---

## sqlc Query Conventions

One `.sql` file per domain. Always include the sqlc annotation comment. Query name format: `VerbNoun`.

```sql
-- name: ListCategoriesForBudget :many
SELECT *
FROM   expense_categories
WHERE  budget_id  = $1
  AND  deleted_at IS NULL
ORDER BY description;

-- name: SoftDeleteExpense :exec
UPDATE expenses
SET    deleted_at = now(),
       updated_at = now()
WHERE  id      = $1
  AND  user_id = $2
  AND  deleted_at IS NULL;
```

For DataLoader batch queries use `= ANY($1::uuid[])`:

```sql
-- name: GetCategorySpentAmounts :many
SELECT
  s.category_id,
  SUM(s.amount) AS total_spent
FROM  expense_splits s
WHERE s.category_id = ANY($1::uuid[])
  AND s.deleted_at  IS NULL
GROUP BY s.category_id;
```

---

## Key Tables Reference

| Table | Key Notes |
|---|---|
| User | PayoffStrategy (AVALANCHE/SNOWBALL), FilingStatus, MaxTaxBracketId FK |
| Person | GrossIncome = annual, BirthYear, RetireAge, FilingStatus per person |
| Budget | Date = always first-of-month. Unique constraint on (UserId, Date) |
| ExpenseCategory | AllocationAmount + RolloverAmount. ParentCategoryId for grouping |
| Expense | Amount must equal SUM(ExpenseSplit.Amount). BudgetId directly on Expense |
| ExpenseSplit | CategoryId lives here, not on Expense. CHECK amount > 0 |
| RecurringIncome / RecurringExpense | Templates — generate rows on new budget creation. RecurringSourceId on generated rows |
| Tag | User-defined labels. ExpenseTag junction for M2M |
| Transfer | FromAccountId + ToAccountId. Neutral — not income or expense |
| Account | EmployerMatchRate + EmployerMatchCeiling. ReturnProfileId |
| IRSAccount | Seed data — Type + TaxYear + Limit + CatchUpAge |
| ReturnProfile | LINEAR, EXPONENTIAL, FLAT, SCHEDULED. FallbackRate for after schedule ends |
| ReturnProfileSchedule | YearNumber + Rate. Unique (ReturnProfileId, YearNumber) |
| Asset | CurrentValue + LastValueUpdatedAt — updated manually. ReturnProfileId |
| AssetPerson | Junction — asset can belong to multiple persons |
| Liability | InterestRate null = variable (look up LiabilityRateHistory). PayoffPriority for manual ordering |
| LiabilityPerson | Junction — liability can belong to multiple persons |
| LiabilityRateHistory | Current rate = most recent EffectiveDate row for a liability |
| Goal | Optional AccountId FK to track progress automatically |
| NetWorthSnapshot | Immutable — TotalAssets, TotalLiabilities, NetWorth captured at creation |
| PlaidItem | AccessToken encrypted at rest with AES-256. Status tracks connection health |
| PlaidAccount | Links to Account, Asset, or Liability via nullable FKs — only one set per row |
| PlaidTransaction | Status: UNREVIEWED → MATCHED/ACCEPTED/IGNORED. PlaidTransactionId for upsert |
| PlaidWebhook | Append-only log. Never update or delete rows |
| TaxDocument | W2, 1099s etc. Drives form checklist and tax estimate |
| TaxEstimate | Immutable snapshot per tax year. Always show disclaimer |
| TaxFormGuide | Seed data — TriggerDocumentType → RequiredForm mapping |
| RothConversionSchedule | Multi-year ladder. PlannedAmount vs ActualAmount |
| HSAReceipt | ReimbursedAt null = pending. ReceiptUrl = cloud storage link |
| RetirementStrategy | WithdrawalOrder as JSONB ordered array. RothLadderStartYear |
| RetirementScenario | Immutable named what-if. PortfolioAtRetirement stored at creation |
| SEPP | Rule 72(t). StartDate + AnnualAmount + CalculationMethod |

---

## Derived Values — Never Stored (Exceptions Noted)

| Table | Field | Computation |
|---|---|---|
| Budget | TotalIncome | SUM(income.amount) for budget |
| Budget | TotalAllocated | SUM(expense_category.effective_allocation) |
| Budget | TotalSpent | SUM(expense_split.amount) via categories in budget |
| Budget | Surplus | TotalIncome − TotalSpent |
| Person | Age | current year − birth_year |
| Person | YearsToRetirement | (birth_year + retire_age) − current year |
| ExpenseCategory | EffectiveAllocation | allocation_amount + rollover_amount |
| ExpenseCategory | TotalSpent | SUM(expense_split.amount) for category |
| ExpenseCategory | Remaining | EffectiveAllocation − TotalSpent |
| Account | IsMaxing | annualized contribution ≥ IRSAccount.limit |
| Account | EffectiveContribution | contribution + MIN(contribution × match_rate, contribution × match_ceiling) |
| Asset | EstimatedCurrentValue | current_value projected from last_value_updated_at via ReturnProfile |
| Liability | CurrentRate | interest_rate if not null, else latest LiabilityRateHistory.rate |
| Liability | EstimatedPayoffDate | amortization from current_balance + rate + payments |
| Liability | PayoffOrder | sorted by strategy, overridden by payoff_priority |
| Goal | Progress | linked account balance ÷ amount |
| RetirementStrategy | FINumber | annual_spend_target / safe_withdrawal_rate |
| RetirementStrategy | FIProgress | investable net worth / FINumber × 100 |
| RetirementStrategy | ProjectedFIDate | date portfolio reaches FINumber at current rate |
| HSAReceipt | TotalUnreimbursed | SUM(amount) WHERE reimbursed_at IS NULL |
| NetWorthSnapshot | NetWorth* | **stored** — computed at creation, immutable after |
| TaxEstimate | EstimatedRefund* | **stored** — computed at creation, immutable after |
| RetirementScenario | PortfolioAtRetirement* | **stored** — computed at creation, immutable after |

---

## Important Domain Rules

- `Expense.amount` must equal `SUM(ExpenseSplit.amount)` — enforce in service layer before inserting
- `Budget.date` is always first-of-month — never store month/year as separate integers
- `Liability.interest_rate` null means variable rate — look up `LiabilityRateHistory`
- `Asset.current_value` and `Liability.current_balance` are manually updated — always update `last_value_updated_at` / `last_balance_updated_at` when the value changes, never rely on `updated_at`
- `RolloverAmount` is floored at zero — never carry a negative rollover forward
- `PlaidItem.access_token` must be encrypted with AES-256 before storing — never log it, never return it via API
- All tax estimates must display a disclaimer — not tax advice, consult a CPA
- SEPP (Rule 72t) — always recommend a financial advisor prominently before a user starts one
- `NetWorthSnapshot` is append-only — never update after creation
