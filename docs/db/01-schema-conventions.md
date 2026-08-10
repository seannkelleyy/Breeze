# 01 — Database

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
| All tables mutable | Every table has `created_at`, `updated_at`, and `deleted_at` — no immutable tables |
| Money amounts | `NUMERIC(12,2)` — never FLOAT |
| Large balances | `NUMERIC(14,2)` for asset/liability values; `NUMERIC(15,2)` for net worth totals |
| Rates / percentages | `DECIMAL(5,4)` — e.g. 0.0350 for 3.5% |
| Override values | `DECIMAL(12,4)` — scenario override values with higher precision |
| Tax bracket rates | `DECIMAL(5,4)` — e.g. 0.2200 for 22% |
| Budget date | DATE always first-of-month — e.g. 2026-03-01, never separate month/year integers |
| Person arrays | `list(uuid)` with `DEFAULT ARRAY[]::uuid[]` — used on assets and liabilities for multi-person assignment |
| Enums | Named types defined once in schema — see enum table below |

---

## Enums

```hcl
enum "filing_status"            { values = ["SINGLE", "MFJ", "MFS", "HOH"] }
enum "return_type"              { values = ["REAL", "NOMINAL"] }
enum "deduction_type"           { values = ["STANDARD", "ITEMIZED"] }
enum "payoff_strategy"          { values = ["AVALANCHE", "SNOWBALL"] }
enum "asset_type"               { values = ["CHECKING", "EMERGENCY_FUND", "BROKERAGE", "_401K", "_403B", "_457", "ROTH_IRA", "TRADITIONAL_IRA", "HSA", "HOME", "VEHICLE", "OTHER"] }
enum "liability_type"           { values = ["MORTGAGE", "CREDIT_CARD", "STUDENT_LOAN", "AUTO_LOAN", "PERSONAL_LOAN", "OTHER"] }
enum "recurrence_interval"      { values = ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] }
enum "income_source_type"       { values = ["MANUAL", "RECURRING_TEMPLATE"] }
enum "expense_source_type"      { values = ["MANUAL", "RECURRING_TEMPLATE"] }
enum "retirement_account_owner" { values = ["SELF", "SPOUSE"] }
enum "retirement_account_type"  { values = ["ACCOUNT_401K", "ACCOUNT_403B", "ACCOUNT_457", "ROTH_IRA", "TRADITIONAL_IRA", "HSA", "OTHER"] }
enum "retirement_tax_treatment" { values = ["PRE_TAX", "ROTH", "TAX_DEFERRED", "TAXABLE", "OTHER"] }
```

Asset types with numeric prefixes use underscore: `_401K`, `_403B`, `_457` (PostgreSQL enums can't start with digits).

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
    where   = "deleted_at IS NULL"
  }
}
```

---

## Partial Indexes

PostgreSQL partial indexes only index non-deleted rows. Since most queries filter `deleted_at IS NULL` this dramatically reduces index size and speeds up reads. Use on every high-traffic table.

```hcl
index "idx_expenses_budget_active" {
  columns = [column.budget_id]
  where   = "deleted_at IS NULL"
}
```

---

## Full Schema — All Tables

### tax_brackets

```hcl
table "tax_brackets" {
  column "id"             { type = uuid          default = sql("gen_random_uuid()") }
  column "year"           { type = int }
  column "filing_status"  { type = enum.filing_status }
  column "minimum_amount" { type = numeric(12,2) }
  column "maximum_amount" { type = numeric(12,2)  null = true }
  column "rate"           { type = decimal(5,4) }
  column "created_at"     { type = timestamptz    default = sql("now()") }
  column "updated_at"     { type = timestamptz    default = sql("now()") }
  column "deleted_at"     { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  index "idx_tax_brackets_year_status"     { columns = [column.year, column.filing_status] }
  index "idx_tax_brackets_year_status_min" { columns = [column.year, column.filing_status, column.minimum_amount] }
}
```

### users

```hcl
table "users" {
  column "id"                   { type = uuid          default = sql("gen_random_uuid()") }
  column "email"                { type = varchar(255) }
  column "identity_provider_id" { type = varchar(255) }
  column "return_type"          { type = enum.return_type }
  column "safe_withdrawal_rate" { type = decimal(5,4) }
  column "currency_type"        { type = varchar(10) }
  column "inflation_rate"       { type = decimal(5,4) }
  column "deduction_type"       { type = enum.deduction_type }
  column "deduction_amount"     { type = numeric(12,2)  null = true }
  column "max_tax_bracket_id"   { type = uuid           null = true }
  column "filing_status"        { type = enum.filing_status }
  column "payoff_strategy"      { type = enum.payoff_strategy }
  column "budget_enabled"       { type = boolean       default = false }
  column "monthly_expenses"     { type = numeric(12,2)  null = true }
  column "setup_completed"      { type = boolean       default = false }
  column "disclaimer_accepted"  { type = boolean       default = false }
  column "disclaimer_accepted_at" { type = timestamptz  null = true }
  column "created_at"           { type = timestamptz    default = sql("now()") }
  column "updated_at"           { type = timestamptz    default = sql("now()") }
  column "deleted_at"           { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_users_max_tax_bracket" {
    columns     = [column.max_tax_bracket_id]
    ref_columns = [table.tax_brackets.column.id]
    on_delete   = SET_NULL
  }
  index "idx_users_email"               { columns = [column.email]                 unique = true }
  index "idx_users_identity_provider_id" { columns = [column.identity_provider_id] unique = true }
  index "idx_users_active"              { columns = [column.id]  where = "deleted_at IS NULL" }
}
```

### planner_people

```hcl
table "planner_people" {
  column "id"                { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"           { type = uuid }
  column "name"              { type = text           default = "" }
  column "birthday"          { type = text           default = "" }
  column "retirement_age"    { type = integer        default = 60 }
  column "annual_salary"     { type = numeric(12,2)  default = 0 }
  column "bonus_mode"        { type = text           default = "dollars" }
  column "annual_bonus"      { type = numeric(12,2)  default = 0 }
  column "income_growth_rate" { type = numeric(5,2)  default = 0 }
  column "created_at"        { type = timestamptz    default = sql("now()") }
  column "updated_at"        { type = timestamptz    default = sql("now()") }
  column "deleted_at"        { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_planner_people_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_planner_people_user_id"     { columns = [column.user_id] }
  index "idx_planner_people_user_active" { columns = [column.user_id, column.created_at]  where = "deleted_at IS NULL" }
}
```

### assets

```hcl
table "assets" {
  column "id"                                    { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                               { type = uuid }
  column "name"                                  { type = varchar(255) }
  column "asset_type"                            { type = enum.asset_type }
  column "current_value"                         { type = numeric(14,2) }
  column "person_ids"                            { type = list(uuid)    default = sql("ARRAY[]::uuid[]") }
  column "contribution_mode"                     { type = varchar(32) }
  column "contribution_value"                    { type = decimal(12,2) }
  column "employer_match_rate"                   { type = decimal(5,4) }
  column "employer_match_max_percent_of_salary"  { type = decimal(5,4) }
  column "annual_rate"                           { type = decimal(5,4) }
  column "purchase_date"                         { type = date          null = true }
  column "purchase_price"                        { type = numeric(14,2) null = true }
  column "home_growth_profile"                   { type = varchar(32)   null = true }
  column "vehicle_depreciation_profile"          { type = varchar(32)   null = true }
  column "linked_liability_id"                   { type = uuid          null = true }
  column "last_value_updated_at"                 { type = timestamptz   default = sql("now()") }
  column "created_at"                            { type = timestamptz   default = sql("now()") }
  column "updated_at"                            { type = timestamptz   default = sql("now()") }
  column "deleted_at"                            { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_assets_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_assets_linked_liability" {
    columns     = [column.linked_liability_id]
    ref_columns = [table.liabilities.column.id]
    on_delete   = SET_NULL
  }
  index "idx_assets_user_id"     { columns = [column.user_id] }
  index "idx_assets_user_active" { columns = [column.user_id, column.created_at]  where = "deleted_at IS NULL" }
}
```

### liabilities

```hcl
table "liabilities" {
  column "id"                      { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                 { type = uuid }
  column "name"                    { type = varchar(255) }
  column "liability_type"          { type = enum.liability_type }
  column "current_balance"         { type = numeric(14,2) }
  column "original_loan_amount"    { type = numeric(14,2)  null = true }
  column "interest_rate"           { type = decimal(5,4) }
  column "minimum_payment"         { type = numeric(12,2) }
  column "target_extra_payment"    { type = numeric(12,2)  default = sql("0") }
  column "payoff_priority"         { type = int            default = 0 }
  column "person_ids"              { type = list(uuid)     default = sql("ARRAY[]::uuid[]") }
  column "contribution_mode"       { type = varchar(32) }
  column "contribution_value"      { type = decimal(12,2) }
  column "last_balance_updated_at" { type = timestamptz    default = sql("now()") }
  column "created_at"              { type = timestamptz    default = sql("now()") }
  column "updated_at"              { type = timestamptz    default = sql("now()") }
  column "deleted_at"              { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_liabilities_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_liabilities_user_id"     { columns = [column.user_id] }
  index "idx_liabilities_user_active" { columns = [column.user_id, column.created_at]  where = "deleted_at IS NULL" }
}
```

### budgets

```hcl
table "budgets" {
  column "id"             { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"        { type = uuid }
  column "date"           { type = date }
  column "monthly_income" { type = numeric(12,2) }
  column "monthly_expenses" { type = numeric(12,2) }
  column "created_at"     { type = timestamptz    default = sql("now()") }
  column "updated_at"     { type = timestamptz    default = sql("now()") }
  column "deleted_at"     { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_budgets_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_budgets_user_id"     { columns = [column.user_id] }
  index "idx_budgets_user_date"   { columns = [column.user_id, column.date]  unique = true }
  index "idx_budgets_user_active" { columns = [column.user_id, column.date]  where = "deleted_at IS NULL" }
  check "budgets_amounts_nonnegative" {
    expr = "monthly_income >= 0 AND monthly_expenses >= 0"
  }
}
```

### expense_categories

```hcl
table "expense_categories" {
  column "id"                 { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"            { type = uuid }
  column "budget_id"          { type = uuid }
  column "name"               { type = varchar(255) }
  column "allocation"         { type = numeric(12,2) }
  column "current_spend"      { type = numeric(12,2)  default = sql("0") }
  column "source_type"        { type = enum.expense_source_type  default = "MANUAL" }
  column "source_template_id" { type = uuid           null = true }
  column "generation_month"   { type = date           null = true }
  column "created_at"         { type = timestamptz    default = sql("now()") }
  column "updated_at"         { type = timestamptz    default = sql("now()") }
  column "deleted_at"         { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_expense_categories_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_expense_categories_budget" {
    columns     = [column.budget_id]
    ref_columns = [table.budgets.column.id]
    on_delete   = CASCADE
  }
  index "idx_expense_categories_user_id"          { columns = [column.user_id] }
  index "idx_expense_categories_budget_id"        { columns = [column.budget_id] }
  index "idx_expense_categories_budget_active"    { columns = [column.budget_id]  where = "deleted_at IS NULL" }
  index "idx_expense_categories_source_template"  { columns = [column.source_template_id] }
  check "expense_categories_amounts_nonnegative" {
    expr = "allocation >= 0 AND current_spend >= 0"
  }
}
```

### expenses

```hcl
table "expenses" {
  column "id"                  { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"             { type = uuid }
  column "budget_id"           { type = uuid }
  column "amount"              { type = numeric(12,2) }
  column "date"                { type = date }
  column "description"         { type = varchar(255) }
  column "source_type"         { type = enum.expense_source_type  default = "MANUAL" }
  column "source_template_id"  { type = uuid           null = true }
  column "generation_month"    { type = date           null = true }
  column "person_id"           { type = uuid           null = true }
  column "created_at"          { type = timestamptz    default = sql("now()") }
  column "updated_at"          { type = timestamptz    default = sql("now()") }
  column "deleted_at"          { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_expenses_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_expenses_budget" {
    columns     = [column.budget_id]
    ref_columns = [table.budgets.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_expenses_person" {
    columns     = [column.person_id]
    ref_columns = [table.planner_people.column.id]
    on_delete   = SET_NULL
  }
  index "idx_expenses_budget"         { columns = [column.budget_id] }
  index "idx_expenses_user_date"      { columns = [column.user_id, column.date] }
  index "idx_expenses_source_template" { columns = [column.source_template_id] }
  index "idx_expenses_budget_active"  { columns = [column.budget_id]  where = "deleted_at IS NULL" }
  check "expenses_amount_positive" {
    expr = "amount > 0"
  }
}
```

### expense_splits

```hcl
table "expense_splits" {
  column "id"          { type = uuid          default = sql("gen_random_uuid()") }
  column "expense_id"  { type = uuid }
  column "category_id" { type = uuid }
  column "amount"      { type = numeric(12,2) }
  column "description" { type = varchar(255)   null = true }
  column "created_at"  { type = timestamptz    default = sql("now()") }
  column "updated_at"  { type = timestamptz    default = sql("now()") }
  column "deleted_at"  { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_splits_expense" {
    columns     = [column.expense_id]
    ref_columns = [table.expenses.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_splits_category" {
    columns     = [column.category_id]
    ref_columns = [table.expense_categories.column.id]
    on_delete   = RESTRICT
  }
  index "idx_splits_expense"         { columns = [column.expense_id] }
  index "idx_splits_category"        { columns = [column.category_id] }
  index "idx_splits_category_active" { columns = [column.category_id]  where = "deleted_at IS NULL" }
  check "splits_amount_positive" {
    expr = "amount > 0"
  }
}
```

### recurring_expenses

```hcl
table "recurring_expenses" {
  column "id"                  { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"             { type = uuid }
  column "name"                { type = varchar(255) }
  column "amount"              { type = numeric(12,2) }
  column "recurrence_interval" { type = enum.recurrence_interval }
  column "payday_day_of_month" { type = int            null = true }
  column "start_date"          { type = date }
  column "end_date"            { type = date           null = true }
  column "person_id"           { type = uuid           null = true }
  column "created_at"          { type = timestamptz    default = sql("now()") }
  column "updated_at"          { type = timestamptz    default = sql("now()") }
  column "deleted_at"          { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_recurring_expenses_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_recurring_expenses_person" {
    columns     = [column.person_id]
    ref_columns = [table.planner_people.column.id]
    on_delete   = SET_NULL
  }
  index "idx_recurring_expenses_user"       { columns = [column.user_id] }
  index "idx_recurring_expenses_user_dates" { columns = [column.user_id, column.start_date, column.end_date] }
  check "recurring_expenses_amount_positive" {
    expr = "amount > 0"
  }
  check "recurring_expenses_payday_valid" {
    expr = "payday_day_of_month IS NULL OR (payday_day_of_month >= 1 AND payday_day_of_month <= 31)"
  }
}
```

### income

```hcl
table "income" {
  column "id"                    { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"               { type = uuid }
  column "budget_id"             { type = uuid }
  column "name"                  { type = varchar(255) }
  column "amount"                { type = numeric(12,2) }
  column "date"                  { type = date }
  column "source_type"           { type = enum.income_source_type  default = "MANUAL" }
  column "source_template_id"    { type = uuid           null = true }
  column "source_occurrence_date" { type = date          null = true }
  column "generation_month"      { type = date           null = true }
  column "person_id"             { type = uuid           null = true }
  column "created_at"            { type = timestamptz    default = sql("now()") }
  column "updated_at"            { type = timestamptz    default = sql("now()") }
  column "deleted_at"            { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_income_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_income_budget" {
    columns     = [column.budget_id]
    ref_columns = [table.budgets.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_income_person" {
    columns     = [column.person_id]
    ref_columns = [table.planner_people.column.id]
    on_delete   = SET_NULL
  }
  foreign_key "fk_income_recur" {
    columns     = [column.source_template_id]
    ref_columns = [table.recurring_income.column.id]
    on_delete   = SET_NULL
  }
  index "idx_income_budget"         { columns = [column.budget_id] }
  index "idx_income_user_date"      { columns = [column.user_id, column.date] }
  index "idx_income_source_template" { columns = [column.source_template_id] }
  index "idx_income_budget_active"  { columns = [column.budget_id]  where = "deleted_at IS NULL" }
  check "income_amount_positive" {
    expr = "amount > 0"
  }
}
```

### recurring_income

```hcl
table "recurring_income" {
  column "id"                  { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"             { type = uuid }
  column "name"                { type = varchar(255) }
  column "amount"              { type = numeric(12,2) }
  column "recurrence_interval" { type = enum.recurrence_interval }
  column "payday_day_of_month" { type = int            null = true }
  column "start_date"          { type = date }
  column "end_date"            { type = date           null = true }
  column "person_id"           { type = uuid           null = true }
  column "created_at"          { type = timestamptz    default = sql("now()") }
  column "updated_at"          { type = timestamptz    default = sql("now()") }
  column "deleted_at"          { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_recurring_income_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  foreign_key "fk_recurring_income_person" {
    columns     = [column.person_id]
    ref_columns = [table.planner_people.column.id]
    on_delete   = SET_NULL
  }
  index "idx_recurring_income_user"       { columns = [column.user_id] }
  index "idx_recurring_income_user_dates" { columns = [column.user_id, column.start_date, column.end_date] }
  check "recurring_income_amount_positive" {
    expr = "amount > 0"
  }
  check "recurring_income_payday_valid" {
    expr = "payday_day_of_month IS NULL OR (payday_day_of_month >= 1 AND payday_day_of_month <= 31)"
  }
}
```

### goals

```hcl
table "goals" {
  column "id"                     { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                { type = uuid }
  column "description"            { type = text }
  column "is_completed"           { type = boolean       default = sql("false") }
  column "target_amount"          { type = numeric(12,2)  null = true }
  column "target_date"            { type = date           null = true }
  column "category"               { type = text           null = true }
  column "custom_category"        { type = text           null = true }
  column "priority"               { type = integer        default = 0 }
  column "notes"                  { type = text           null = true }
  column "connected_account_ids"  { type = "uuid[]"       default = sql("ARRAY[]::uuid[]") }
  column "is_financial_order_step" { type = boolean       default = false }
  column "financial_order_step"   { type = integer        null = true }
  column "created_at"             { type = timestamptz   default = sql("now()") }
  column "updated_at"             { type = timestamptz   default = sql("now()") }
  column "deleted_at"             { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_goals_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_goals_user_id"             { columns = [column.user_id] }
  index "idx_goals_user_active"         { columns = [column.user_id, column.created_at]  where = "deleted_at IS NULL" }
  index "idx_goals_financial_order"     { columns = [column.user_id, column.financial_order_step]  where = "deleted_at IS NULL AND is_financial_order_step = true" }
}
```

### net_worth_snapshots

```hcl
table "net_worth_snapshots" {
  column "id"              { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"         { type = uuid }
  column "snapshot_date"   { type = date }
  column "total_assets"    { type = numeric(15,2) }
  column "total_liabilities" { type = numeric(15,2) }
  column "net_worth"       { type = numeric(15,2) }
  column "created_at"      { type = timestamptz   default = sql("now()") }
  column "updated_at"      { type = timestamptz   default = sql("now()") }
  column "deleted_at"      { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_net_worth_snapshots_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_net_worth_snapshots_user_id"   { columns = [column.user_id] }
  index "idx_net_worth_snapshots_user_date" { columns = [column.user_id, column.snapshot_date]  unique = true  where = "deleted_at IS NULL" }
}
```

### retirement_accounts

```hcl
table "retirement_accounts" {
  column "id"                        { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                   { type = uuid }
  column "name"                      { type = varchar(255) }
  column "account_type"              { type = enum.retirement_account_type }
  column "owner"                     { type = enum.retirement_account_owner }
  column "tax_treatment"             { type = enum.retirement_tax_treatment }
  column "current_balance"           { type = numeric(14,2)  default = sql("0") }
  column "annual_contribution_limit" { type = numeric(12,2)  default = sql("0") }
  column "created_at"                { type = timestamptz    default = sql("now()") }
  column "updated_at"                { type = timestamptz    default = sql("now()") }
  column "deleted_at"                { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_retirement_accounts_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_retirement_accounts_user_id"     { columns = [column.user_id] }
  index "idx_retirement_accounts_user_active" { columns = [column.user_id, column.created_at]  where = "deleted_at IS NULL" }
  check "retirement_accounts_current_balance_non_negative" {
    expr = "current_balance >= 0"
  }
  check "retirement_accounts_annual_contribution_limit_non_negative" {
    expr = "annual_contribution_limit >= 0"
  }
}
```

### contribution_limits

```hcl
table "contribution_limits" {
  column "id"             { type = uuid          default = sql("gen_random_uuid()") }
  column "account_type"   { type = enum.retirement_account_type }
  column "tax_year"       { type = int }
  column "annual_limit"   { type = numeric(12,2) }
  column "catch_up_age"   { type = int }
  column "catch_up_amount" { type = numeric(12,2) }
  column "created_at"     { type = timestamptz    default = sql("now()") }
  column "updated_at"     { type = timestamptz    default = sql("now()") }
  column "deleted_at"     { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  index "idx_contribution_limits_account_year" { columns = [column.account_type, column.tax_year]  unique = true }
  check "contribution_limits_annual_limit_positive" {
    expr = "annual_limit > 0"
  }
  check "contribution_limits_catch_up_non_negative" {
    expr = "catch_up_amount >= 0 AND catch_up_age >= 0"
  }
}
```

### contribution_entries

```hcl
table "contribution_entries" {
  column "id"                   { type = uuid          default = sql("gen_random_uuid()") }
  column "retirement_account_id" { type = uuid }
  column "tax_year"             { type = int }
  column "contribution_date"    { type = date }
  column "amount"               { type = numeric(12,2) }
  column "created_at"           { type = timestamptz    default = sql("now()") }
  column "updated_at"           { type = timestamptz    default = sql("now()") }
  column "deleted_at"           { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_contribution_entries_retirement_account" {
    columns     = [column.retirement_account_id]
    ref_columns = [table.retirement_accounts.column.id]
    on_delete   = CASCADE
  }
  index "idx_contribution_entries_account_id"     { columns = [column.retirement_account_id] }
  index "idx_contribution_entries_account_year"   { columns = [column.retirement_account_id, column.tax_year] }
  index "idx_contribution_entries_account_active" { columns = [column.retirement_account_id, column.contribution_date]  where = "deleted_at IS NULL" }
  check "contribution_entries_amount_positive" {
    expr = "amount > 0"
  }
}
```

### scenario_profiles

```hcl
table "scenario_profiles" {
  column "id"                  { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"             { type = uuid }
  column "name"                { type = varchar(255) }
  column "current_age"         { type = int }
  column "retirement_age"      { type = int }
  column "annual_spend"        { type = numeric(12,2) }
  column "safe_withdrawal_rate" { type = decimal(5,4) }
  column "inflation_rate"      { type = decimal(5,4) }
  column "return_rate"         { type = decimal(5,4) }
  column "current_portfolio"   { type = numeric(14,2) }
  column "created_at"          { type = timestamptz    default = sql("now()") }
  column "updated_at"          { type = timestamptz    default = sql("now()") }
  column "deleted_at"          { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_scenario_profiles_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_scenario_profiles_user_id"     { columns = [column.user_id] }
  index "idx_scenario_profiles_user_active" { columns = [column.user_id, column.created_at]  where = "deleted_at IS NULL" }
  check "scenario_profiles_current_age_non_negative" {
    expr = "current_age >= 0 AND retirement_age >= current_age"
  }
  check "scenario_profiles_money_positive" {
    expr = "annual_spend > 0 AND current_portfolio >= 0"
  }
}
```

### scenario_overrides

```hcl
table "scenario_overrides" {
  column "id"                 { type = uuid          default = sql("gen_random_uuid()") }
  column "scenario_profile_id" { type = uuid }
  column "override_key"       { type = varchar(255) }
  column "override_value"     { type = decimal(12,4) }
  column "created_at"         { type = timestamptz    default = sql("now()") }
  column "updated_at"         { type = timestamptz    default = sql("now()") }
  column "deleted_at"         { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_scenario_overrides_profile" {
    columns     = [column.scenario_profile_id]
    ref_columns = [table.scenario_profiles.column.id]
    on_delete   = CASCADE
  }
  index "idx_scenario_overrides_profile_id"     { columns = [column.scenario_profile_id] }
  index "idx_scenario_overrides_profile_active" { columns = [column.scenario_profile_id, column.override_key]  where = "deleted_at IS NULL" }
}
```

### scenario_results_cache

```hcl
table "scenario_results_cache" {
  column "id"                     { type = uuid          default = sql("gen_random_uuid()") }
  column "scenario_profile_id"    { type = uuid }
  column "portfolio_at_retirement" { type = numeric(14,2) }
  column "required_portfolio"     { type = numeric(14,2) }
  column "projected_depletion_age" { type = int           null = true }
  column "is_sustainable"         { type = boolean }
  column "created_at"             { type = timestamptz    default = sql("now()") }
  column "updated_at"             { type = timestamptz    default = sql("now()") }
  column "deleted_at"             { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_scenario_results_cache_profile" {
    columns     = [column.scenario_profile_id]
    ref_columns = [table.scenario_profiles.column.id]
    on_delete   = CASCADE
  }
  index "idx_scenario_results_cache_profile_id"     { columns = [column.scenario_profile_id]  unique = true }
  index "idx_scenario_results_cache_profile_active" { columns = [column.scenario_profile_id, column.created_at]  where = "deleted_at IS NULL" }
}
```

### plaid_connections

```hcl
table "plaid_connections" {
  column "id"               { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"          { type = uuid }
  column "environment"      { type = varchar(32) }
  column "institution_id"   { type = varchar(255)  null = true }
  column "institution_name" { type = varchar(255)  null = true }
  column "access_token"     { type = text }
  column "item_id"          { type = varchar(255) }
  column "created_at"       { type = timestamptz    default = sql("now()") }
  column "updated_at"       { type = timestamptz    default = sql("now()") }
  column "deleted_at"       { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_plaid_connections_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }
  index "idx_plaid_connections_user_id" { columns = [column.user_id] }
}
```

### plaid_accounts

```hcl
table "plaid_accounts" {
  column "id"                 { type = uuid          default = sql("gen_random_uuid()") }
  column "plaid_connection_id" { type = uuid }
  column "external_id"       { type = varchar(255) }
  column "name"              { type = varchar(255) }
  column "official_name"     { type = varchar(255)  null = true }
  column "type"              { type = varchar(128)  null = true }
  column "subtype"           { type = varchar(128)  null = true }
  column "current_balance"   { type = numeric(14,2) null = true }
  column "iso_currency_code" { type = varchar(8)    null = true }
  column "created_at"        { type = timestamptz    default = sql("now()") }
  column "updated_at"        { type = timestamptz    default = sql("now()") }
  column "deleted_at"        { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_plaid_accounts_connection" {
    columns     = [column.plaid_connection_id]
    ref_columns = [table.plaid_connections.column.id]
    on_delete   = CASCADE
  }
  index "idx_plaid_accounts_connection_id" { columns = [column.plaid_connection_id] }
  index "idx_plaid_accounts_external_id"   { columns = [column.external_id]  unique = true }
}
```

---

## Index Strategy Summary

| Type | When to use |
|---|---|
| Standard | Single-column FK lookups, simple filter columns |
| Composite | Queries that always filter by two columns together (e.g. user_id + date) |
| Unique | Enforce data integrity — one budget per user per month, no duplicate external IDs |
| Partial `WHERE deleted_at IS NULL` | Every high-traffic table — excludes soft-deleted rows from the index |
| Partial custom condition | Net worth snapshots unique per user+date only when not deleted |

Composite index column order matters — put the equality filter column first, range/sort column second. `(user_id, date)` works for `WHERE user_id = ? ORDER BY date` but the reverse would not.

---

## sqlc Query Conventions

One `.sql` file per domain. Always include the sqlc annotation comment. Query name format: `VerbNoun`.

```sql
-- name: ListCategoriesForBudget :many
SELECT *
FROM   expense_categories
WHERE  budget_id  = $1
  AND  deleted_at IS NULL
ORDER BY name;

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

## Seed Data Requirements

### tax_brackets

The `tax_brackets` table is seeded with IRS tax bracket data per year and filing status. This data drives tax estimation and planning calculations. Seed data should be loaded via migrations or a seed script for each supported tax year.

Each row represents one bracket: the `minimum_amount` and `maximum_amount` define the income range, and `rate` is the marginal tax rate for that bracket (e.g. `0.2200` for 22%). The top bracket has `maximum_amount = NULL`.
