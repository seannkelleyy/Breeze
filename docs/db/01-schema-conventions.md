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

### users

```hcl
table "users" {
  column "id"                   { type = uuid          default = sql("gen_random_uuid()") }
  column "identity_provider_id" { type = varchar(255) }
  column "email"                { type = varchar(255) }
  column "return_type"          { type = enum("REAL","NOMINAL") }
  column "safe_withdrawal_rate" { type = decimal(5,4) }
  column "currency_type"        { type = varchar(10) }
  column "inflation_rate"       { type = decimal(5,4) }
  column "deduction_type"       { type = enum("STANDARD","ITEMIZED") }
  column "deduction_amount"     { type = numeric(12,2)  null = true }
  column "max_tax_bracket_id"   { type = uuid           null = true }
  column "filing_status"        { type = enum("SINGLE","MFJ","MFS","HOH") }
  column "payoff_strategy"      { type = enum("AVALANCHE","SNOWBALL") }
  column "created_at"           { type = timestamptz   default = sql("now()") }
  column "updated_at"           { type = timestamptz   default = sql("now()") }
  column "deleted_at"           { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_users_max_tax_bracket" {
    columns     = [column.max_tax_bracket_id]
    ref_columns = [table.tax_brackets.column.id]
    on_delete   = SET_NULL
  }
  index "idx_users_email"  { columns = [column.email]  unique = true }
  index "idx_users_active" { columns = [column.id]     where  = "deleted_at IS NULL" }
}
```

### people

```hcl
table "people" {
  column "id"                 { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"            { type = uuid }
  column "name"               { type = varchar(255) }
  column "gross_income"       { type = numeric(12,2)  note = "annual" }
  column "birth_year"         { type = int }
  column "retire_age"         { type = int }
  column "filing_status"      { type = enum("SINGLE","MFJ","MFS","HOH") }
  column "bonus_type"         { type = enum("PERCENT","CASH") }
  column "gross_bonus_amount" { type = numeric(12,2) }
  column "created_at"         { type = timestamptz   default = sql("now()") }
  column "updated_at"         { type = timestamptz   default = sql("now()") }
  column "deleted_at"         { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_people_user" {
    columns = [column.user_id]  ref_columns = [table.users.column.id]  on_delete = CASCADE
  }
  index "idx_people_user"        { columns = [column.user_id] }
  index "idx_people_user_active" { columns = [column.user_id]  where = "deleted_at IS NULL" }
}
```

### budgets

```hcl
table "budgets" {
  column "id"         { type = uuid         default = sql("gen_random_uuid()") }
  column "user_id"    { type = uuid }
  column "date"       { type = date         note = "always first-of-month" }
  column "created_at" { type = timestamptz  default = sql("now()") }
  column "updated_at" { type = timestamptz  default = sql("now()") }
  column "deleted_at" { type = timestamptz  null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_budgets_user" {
    columns = [column.user_id]  ref_columns = [table.users.column.id]  on_delete = CASCADE
  }
  index "idx_budgets_user_date" { columns = [column.user_id, column.date]  unique = true }
}
```

### tax_brackets

```hcl
table "tax_brackets" {
  column "id"             { type = uuid          default = sql("gen_random_uuid()") }
  column "year"           { type = int }
  column "filing_status"  { type = enum("SINGLE","MFJ","MFS","HOH") }
  column "minimum_amount" { type = numeric(12,2) }
  column "maximum_amount" { type = numeric(12,2)  null = true  note = "null = top bracket" }
  column "rate"           { type = decimal(5,4)   note = "e.g. 0.2200 for 22%" }
  column "created_at"     { type = timestamptz    default = sql("now()") }
  column "updated_at"     { type = timestamptz    default = sql("now()") }
  column "deleted_at"     { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  index "idx_tax_brackets_year_status"     { columns = [column.year, column.filing_status] }
  index "idx_tax_brackets_year_status_min" { columns = [column.year, column.filing_status, column.minimum_amount] }
}
```

### income

```hcl
table "income" {
  column "id"                  { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"             { type = uuid }
  column "person_id"           { type = uuid }
  column "budget_id"           { type = uuid }
  column "amount"              { type = numeric(12,2) }
  column "date"                { type = date }
  column "description"         { type = varchar(255) }
  column "recurring_source_id" { type = uuid           null = true }
  column "created_at"          { type = timestamptz    default = sql("now()") }
  column "updated_at"          { type = timestamptz    default = sql("now()") }
  column "deleted_at"          { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_income_user"   { columns = [column.user_id]             ref_columns = [table.users.column.id]           on_delete = CASCADE  }
  foreign_key "fk_income_person" { columns = [column.person_id]           ref_columns = [table.people.column.id]          on_delete = CASCADE  }
  foreign_key "fk_income_budget" { columns = [column.budget_id]           ref_columns = [table.budgets.column.id]         on_delete = CASCADE  }
  foreign_key "fk_income_recur"  { columns = [column.recurring_source_id] ref_columns = [table.recurring_income.column.id] on_delete = SET_NULL }
  index "idx_income_budget"        { columns = [column.budget_id] }
  index "idx_income_person"        { columns = [column.person_id] }
  index "idx_income_recurring"     { columns = [column.recurring_source_id] }
  index "idx_income_budget_active" { columns = [column.budget_id]  where = "deleted_at IS NULL" }
}
```

### recurring_income

```hcl
table "recurring_income" {
  column "id"          { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"     { type = uuid }
  column "person_id"   { type = uuid }
  column "amount"      { type = numeric(12,2) }
  column "description" { type = varchar(255) }
  column "start_date"  { type = date }
  column "end_date"    { type = date           null = true }
  column "created_at"  { type = timestamptz    default = sql("now()") }
  column "updated_at"  { type = timestamptz    default = sql("now()") }
  column "deleted_at"  { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_recurring_income_user"   { columns = [column.user_id]   ref_columns = [table.users.column.id]   on_delete = CASCADE }
  foreign_key "fk_recurring_income_person" { columns = [column.person_id] ref_columns = [table.people.column.id]  on_delete = CASCADE }
  index "idx_recurring_income_user_dates" { columns = [column.user_id, column.start_date, column.end_date] }
}
```

### expense_categories

```hcl
table "expense_categories" {
  column "id"                 { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"            { type = uuid }
  column "budget_id"          { type = uuid }
  column "allocation_amount"  { type = numeric(12,2) }
  column "rollover_amount"    { type = numeric(12,2)  default = 0 }
  column "description"        { type = varchar(255) }
  column "parent_category_id" { type = uuid           null = true }
  column "created_at"         { type = timestamptz    default = sql("now()") }
  column "updated_at"         { type = timestamptz    default = sql("now()") }
  column "deleted_at"         { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_categories_user"   { columns = [column.user_id]            ref_columns = [table.users.column.id]               on_delete = CASCADE  }
  foreign_key "fk_categories_budget" { columns = [column.budget_id]          ref_columns = [table.budgets.column.id]             on_delete = CASCADE  }
  foreign_key "fk_categories_parent" { columns = [column.parent_category_id] ref_columns = [table.expense_categories.column.id]  on_delete = SET_NULL }
  index "idx_categories_budget"        { columns = [column.budget_id] }
  index "idx_categories_parent"        { columns = [column.parent_category_id] }
  index "idx_categories_budget_active" { columns = [column.budget_id]  where = "deleted_at IS NULL" }
}
```

### expenses

```hcl
table "expenses" {
  column "id"                  { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"             { type = uuid }
  column "budget_id"           { type = uuid }
  column "amount"              { type = numeric(12,2)  note = "must equal SUM(expense_splits.amount)" }
  column "date"                { type = date }
  column "description"         { type = varchar(255) }
  column "recurring_source_id" { type = uuid           null = true }
  column "created_at"          { type = timestamptz    default = sql("now()") }
  column "updated_at"          { type = timestamptz    default = sql("now()") }
  column "deleted_at"          { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_expenses_user"   { columns = [column.user_id]             ref_columns = [table.users.column.id]              on_delete = CASCADE  }
  foreign_key "fk_expenses_budget" { columns = [column.budget_id]           ref_columns = [table.budgets.column.id]            on_delete = CASCADE  }
  foreign_key "fk_expenses_recur"  { columns = [column.recurring_source_id] ref_columns = [table.recurring_expenses.column.id] on_delete = SET_NULL }
  index "idx_expenses_budget"        { columns = [column.budget_id] }
  index "idx_expenses_user_date"     { columns = [column.user_id, column.date] }
  index "idx_expenses_recurring"     { columns = [column.recurring_source_id] }
  index "idx_expenses_budget_active" { columns = [column.budget_id]  where = "deleted_at IS NULL" }
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
  foreign_key "fk_splits_expense"  { columns = [column.expense_id]  ref_columns = [table.expenses.column.id]           on_delete = CASCADE  }
  foreign_key "fk_splits_category" { columns = [column.category_id] ref_columns = [table.expense_categories.column.id] on_delete = RESTRICT }
  check "splits_amount_positive" { expr = "amount > 0" }
  index "idx_splits_expense"         { columns = [column.expense_id] }
  index "idx_splits_category"        { columns = [column.category_id] }
  index "idx_splits_category_active" { columns = [column.category_id]  where = "deleted_at IS NULL" }
}
```

### recurring_expenses

```hcl
table "recurring_expenses" {
  column "id"          { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"     { type = uuid }
  column "category_id" { type = uuid           null = true  note = "may be assigned at generation time" }
  column "amount"      { type = numeric(12,2) }
  column "description" { type = varchar(255) }
  column "start_date"  { type = date }
  column "end_date"    { type = date           null = true }
  column "created_at"  { type = timestamptz    default = sql("now()") }
  column "updated_at"  { type = timestamptz    default = sql("now()") }
  column "deleted_at"  { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_recurring_expenses_user"     { columns = [column.user_id]   ref_columns = [table.users.column.id]              on_delete = CASCADE  }
  foreign_key "fk_recurring_expenses_category" { columns = [column.category_id] ref_columns = [table.expense_categories.column.id] on_delete = SET_NULL }
  index "idx_recurring_expenses_user_dates" { columns = [column.user_id, column.start_date, column.end_date] }
}
```

### tags

```hcl
table "tags" {
  column "id"         { type = uuid         default = sql("gen_random_uuid()") }
  column "user_id"    { type = uuid }
  column "name"       { type = varchar(100) }
  column "color"      { type = varchar(7)    null = true  note = "hex e.g. #FF5733" }
  column "created_at" { type = timestamptz   default = sql("now()") }
  column "updated_at" { type = timestamptz   default = sql("now()") }
  column "deleted_at" { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_tags_user" {
    columns = [column.user_id]  ref_columns = [table.users.column.id]  on_delete = CASCADE
  }
  index "idx_tags_user_name" { columns = [column.user_id, column.name]  unique = true }
}
```

### expense_tags

```hcl
table "expense_tags" {
  column "id"         { type = uuid         default = sql("gen_random_uuid()") }
  column "expense_id" { type = uuid }
  column "tag_id"     { type = uuid }
  column "created_at" { type = timestamptz   default = sql("now()") }
  column "updated_at" { type = timestamptz   default = sql("now()") }
  column "deleted_at" { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_expense_tags_expense" { columns = [column.expense_id] ref_columns = [table.expenses.column.id] on_delete = CASCADE }
  foreign_key "fk_expense_tags_tag"     { columns = [column.tag_id]     ref_columns = [table.tags.column.id]     on_delete = CASCADE }
  index "idx_expense_tags_expense" { columns = [column.expense_id] }
  index "idx_expense_tags_tag"     { columns = [column.tag_id] }
  index "idx_expense_tags_unique"  { columns = [column.expense_id, column.tag_id]  unique = true }
}
```

### transfers

```hcl
table "transfers" {
  column "id"              { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"         { type = uuid }
  column "from_account_id" { type = uuid }
  column "to_account_id"   { type = uuid }
  column "amount"          { type = numeric(12,2) }
  column "date"            { type = date }
  column "description"     { type = varchar(255)   null = true }
  column "created_at"      { type = timestamptz    default = sql("now()") }
  column "updated_at"      { type = timestamptz    default = sql("now()") }
  column "deleted_at"      { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_transfers_user" { columns = [column.user_id]         ref_columns = [table.users.column.id]    on_delete = CASCADE  }
  foreign_key "fk_transfers_from" { columns = [column.from_account_id] ref_columns = [table.accounts.column.id] on_delete = RESTRICT }
  foreign_key "fk_transfers_to"   { columns = [column.to_account_id]   ref_columns = [table.accounts.column.id] on_delete = RESTRICT }
  index "idx_transfers_user_date" { columns = [column.user_id, column.date] }
  index "idx_transfers_from"      { columns = [column.from_account_id] }
  index "idx_transfers_to"        { columns = [column.to_account_id] }
}
```

### accounts

```hcl
table "accounts" {
  column "id"                     { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                { type = uuid }
  column "person_id"              { type = uuid }
  column "irs_account_id"         { type = uuid           null = true }
  column "start_amount"           { type = numeric(12,2) }
  column "start_date"             { type = date }
  column "contribution_interval"  { type = enum("MONTHLY","BIWEEKLY","ANNUALLY") }
  column "contribution_amount"    { type = numeric(12,2) }
  column "employer_match_rate"    { type = decimal(5,4)   note = "e.g. 0.67 for 67% match" }
  column "employer_match_ceiling" { type = decimal(5,4)   note = "e.g. 1.00 for up to 100% of contribution" }
  column "return_profile_id"      { type = uuid }
  column "description"            { type = varchar(255) }
  column "created_at"             { type = timestamptz    default = sql("now()") }
  column "updated_at"             { type = timestamptz    default = sql("now()") }
  column "deleted_at"             { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_accounts_user"    { columns = [column.user_id]          ref_columns = [table.users.column.id]            on_delete = CASCADE  }
  foreign_key "fk_accounts_person"  { columns = [column.person_id]        ref_columns = [table.people.column.id]           on_delete = CASCADE  }
  foreign_key "fk_accounts_irs"     { columns = [column.irs_account_id]   ref_columns = [table.irs_accounts.column.id]     on_delete = SET_NULL }
  foreign_key "fk_accounts_profile" { columns = [column.return_profile_id] ref_columns = [table.return_profiles.column.id] on_delete = RESTRICT }
  index "idx_accounts_user_active" { columns = [column.user_id]   where = "deleted_at IS NULL" }
  index "idx_accounts_person"      { columns = [column.person_id] }
}
```

### irs_accounts

```hcl
table "irs_accounts" {
  column "id"                        { type = uuid          default = sql("gen_random_uuid()") }
  column "type"                      { type = enum("401K","ROTH_IRA","TRADITIONAL_IRA","HSA") }
  column "tax_year"                  { type = int }
  column "limit"                     { type = numeric(12,2) }
  column "catch_up_age"              { type = int }
  column "catch_up_additional_limit" { type = numeric(12,2) }
  column "created_at"                { type = timestamptz    default = sql("now()") }
  column "updated_at"                { type = timestamptz    default = sql("now()") }
  column "deleted_at"                { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  index "idx_irs_accounts_type_year" { columns = [column.type, column.tax_year]  unique = true }
}
```

### return_profiles

```hcl
table "return_profiles" {
  column "id"            { type = uuid          default = sql("gen_random_uuid()") }
  column "description"   { type = varchar(255)  note = "e.g. High Depreciation Vehicle" }
  column "profile_type"  { type = enum("LINEAR","EXPONENTIAL","FLAT","SCHEDULED") }
  column "annual_rate"   { type = decimal(7,4)   null = true  note = "LINEAR / EXPONENTIAL / FLAT" }
  column "decay_factor"  { type = decimal(7,4)   null = true  note = "EXPONENTIAL only" }
  column "fallback_rate" { type = decimal(7,4)   null = true  note = "SCHEDULED — rate after last schedule year" }
  column "created_at"    { type = timestamptz    default = sql("now()") }
  column "updated_at"    { type = timestamptz    default = sql("now()") }
  column "deleted_at"    { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  index "idx_return_profiles_type" { columns = [column.profile_type] }
}
```

### return_profile_schedules

```hcl
table "return_profile_schedules" {
  column "id"                { type = uuid         default = sql("gen_random_uuid()") }
  column "return_profile_id" { type = uuid }
  column "year_number"       { type = int          note = "1 = first year after purchase" }
  column "rate"              { type = decimal(7,4)  note = "e.g. -0.2000 for 20% depreciation" }
  column "created_at"        { type = timestamptz   default = sql("now()") }
  column "updated_at"        { type = timestamptz   default = sql("now()") }
  column "deleted_at"        { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_schedule_profile" {
    columns = [column.return_profile_id]  ref_columns = [table.return_profiles.column.id]  on_delete = CASCADE
  }
  index "idx_schedule_profile_year" { columns = [column.return_profile_id, column.year_number]  unique = true }
}
```

### assets

```hcl
table "assets" {
  column "id"                    { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"               { type = uuid }
  column "description"           { type = varchar(255) }
  column "start_value"           { type = numeric(12,2) }
  column "current_value"         { type = numeric(12,2)  note = "manually updated" }
  column "last_value_updated_at" { type = timestamptz }
  column "return_profile_id"     { type = uuid }
  column "purchase_date"         { type = date }
  column "created_at"            { type = timestamptz    default = sql("now()") }
  column "updated_at"            { type = timestamptz    default = sql("now()") }
  column "deleted_at"            { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_assets_user"    { columns = [column.user_id]          ref_columns = [table.users.column.id]           on_delete = CASCADE  }
  foreign_key "fk_assets_profile" { columns = [column.return_profile_id] ref_columns = [table.return_profiles.column.id] on_delete = RESTRICT }
  index "idx_assets_user_active"  { columns = [column.user_id]           where = "deleted_at IS NULL" }
  index "idx_assets_profile"      { columns = [column.return_profile_id] }
}
```

### asset_people

```hcl
table "asset_people" {
  column "id"         { type = uuid         default = sql("gen_random_uuid()") }
  column "asset_id"   { type = uuid }
  column "person_id"  { type = uuid }
  column "created_at" { type = timestamptz   default = sql("now()") }
  column "updated_at" { type = timestamptz   default = sql("now()") }
  column "deleted_at" { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_asset_people_asset"  { columns = [column.asset_id]  ref_columns = [table.assets.column.id]  on_delete = CASCADE }
  foreign_key "fk_asset_people_person" { columns = [column.person_id] ref_columns = [table.people.column.id]  on_delete = CASCADE }
  index "idx_asset_people_asset"  { columns = [column.asset_id] }
  index "idx_asset_people_person" { columns = [column.person_id] }
  index "idx_asset_people_unique" { columns = [column.asset_id, column.person_id]  unique = true }
}
```

### liabilities

```hcl
table "liabilities" {
  column "id"                      { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                 { type = uuid }
  column "description"             { type = varchar(255) }
  column "start_amount"            { type = numeric(12,2) }
  column "current_balance"         { type = numeric(12,2)  note = "manually updated" }
  column "last_balance_updated_at" { type = timestamptz }
  column "start_date"              { type = date }
  column "end_date"                { type = date           null = true }
  column "asset_id"                { type = uuid           null = true  note = "e.g. mortgage linked to home" }
  column "minimum_payment"         { type = numeric(12,2) }
  column "extra_payment_amount"    { type = numeric(12,2) }
  column "payment_frequency"       { type = enum("MONTHLY","BIWEEKLY","ANNUALLY") }
  column "interest_rate"           { type = decimal(7,4)   null = true  note = "null = variable — see liability_rate_history" }
  column "payoff_priority"         { type = int            null = true  note = "manual sort order override" }
  column "created_at"              { type = timestamptz    default = sql("now()") }
  column "updated_at"              { type = timestamptz    default = sql("now()") }
  column "deleted_at"              { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_liabilities_user"  { columns = [column.user_id]  ref_columns = [table.users.column.id]   on_delete = CASCADE  }
  foreign_key "fk_liabilities_asset" { columns = [column.asset_id] ref_columns = [table.assets.column.id]  on_delete = SET_NULL }
  index "idx_liabilities_user_active"  { columns = [column.user_id]                          where = "deleted_at IS NULL" }
  index "idx_liabilities_user_balance" { columns = [column.user_id, column.current_balance] }
  index "idx_liabilities_asset"        { columns = [column.asset_id] }
}
```

### liability_people

```hcl
table "liability_people" {
  column "id"           { type = uuid         default = sql("gen_random_uuid()") }
  column "liability_id" { type = uuid }
  column "person_id"    { type = uuid }
  column "created_at"   { type = timestamptz   default = sql("now()") }
  column "updated_at"   { type = timestamptz   default = sql("now()") }
  column "deleted_at"   { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_liability_people_liability" { columns = [column.liability_id] ref_columns = [table.liabilities.column.id]  on_delete = CASCADE }
  foreign_key "fk_liability_people_person"    { columns = [column.person_id]    ref_columns = [table.people.column.id]       on_delete = CASCADE }
  index "idx_liability_people_liability" { columns = [column.liability_id] }
  index "idx_liability_people_person"    { columns = [column.person_id] }
  index "idx_liability_people_unique"    { columns = [column.liability_id, column.person_id]  unique = true }
}
```

### liability_rate_history

```hcl
table "liability_rate_history" {
  column "id"             { type = uuid         default = sql("gen_random_uuid()") }
  column "liability_id"   { type = uuid }
  column "rate"           { type = decimal(7,4) }
  column "effective_date" { type = date }
  column "created_at"     { type = timestamptz   default = sql("now()") }
  column "updated_at"     { type = timestamptz   default = sql("now()") }
  column "deleted_at"     { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_rate_history_liability" {
    columns = [column.liability_id]  ref_columns = [table.liabilities.column.id]  on_delete = CASCADE
  }
  index "idx_rate_history_liability_date" { columns = [column.liability_id, column.effective_date] }
}
```

### goals

```hcl
table "goals" {
  column "id"          { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"     { type = uuid }
  column "description" { type = varchar(255) }
  column "target_date" { type = date           null = true }
  column "is_complete" { type = boolean         default = false }
  column "amount"      { type = numeric(12,2)   null = true }
  column "account_id"  { type = uuid            null = true }
  column "created_at"  { type = timestamptz     default = sql("now()") }
  column "updated_at"  { type = timestamptz     default = sql("now()") }
  column "deleted_at"  { type = timestamptz     null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_goals_user"    { columns = [column.user_id]   ref_columns = [table.users.column.id]    on_delete = CASCADE  }
  foreign_key "fk_goals_account" { columns = [column.account_id] ref_columns = [table.accounts.column.id] on_delete = SET_NULL }
  index "idx_goals_user_complete" { columns = [column.user_id, column.is_complete] }
  index "idx_goals_account"       { columns = [column.account_id] }
}
```

### net_worth_snapshots

```hcl
table "net_worth_snapshots" {
  # Immutable append-only — no updated_at, no deleted_at
  column "id"                        { type = uuid           default = sql("gen_random_uuid()") }
  column "user_id"                   { type = uuid }
  column "date"                      { type = date }
  column "total_assets"              { type = numeric(14,2) }
  column "total_liabilities"         { type = numeric(14,2) }
  column "net_worth"                 { type = numeric(14,2) }
  column "investment_accounts_value" { type = numeric(14,2) }
  column "created_at"                { type = timestamptz    default = sql("now()") }

  primary_key { columns = [column.id] }
  foreign_key "fk_snapshots_user" {
    columns = [column.user_id]  ref_columns = [table.users.column.id]  on_delete = CASCADE
  }
  index "idx_snapshots_user_date" { columns = [column.user_id, column.date]  unique = true }
}
```

### plaid_items

```hcl
table "plaid_items" {
  column "id"                   { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"              { type = uuid }
  column "plaid_item_id"        { type = varchar(255) }
  column "plaid_institution_id" { type = varchar(255) }
  column "institution_name"     { type = varchar(255) }
  column "access_token"         { type = text          note = "AES-256 encrypted — never expose via API" }
  column "status"               { type = enum("ACTIVE","ERROR","PENDING_EXPIRATION","REVOKED") }
  column "error_code"           { type = varchar(100)   null = true }
  column "consent_expires_at"   { type = timestamptz    null = true }
  column "last_synced_at"       { type = timestamptz    null = true }
  column "created_at"           { type = timestamptz    default = sql("now()") }
  column "updated_at"           { type = timestamptz    default = sql("now()") }
  column "deleted_at"           { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_plaid_items_user" {
    columns = [column.user_id]  ref_columns = [table.users.column.id]  on_delete = CASCADE
  }
  index "idx_plaid_items_user"     { columns = [column.user_id] }
  index "idx_plaid_items_plaid_id" { columns = [column.plaid_item_id]  unique = true }
}
```

### plaid_accounts

```hcl
table "plaid_accounts" {
  column "id"               { type = uuid         default = sql("gen_random_uuid()") }
  column "plaid_item_id"    { type = uuid }
  column "user_id"          { type = uuid }
  column "plaid_account_id" { type = varchar(255) }
  column "name"             { type = varchar(255) }
  column "official_name"    { type = varchar(255)  null = true }
  column "type"             { type = enum("DEPOSITORY","INVESTMENT","LOAN","CREDIT","OTHER") }
  column "subtype"          { type = varchar(100) }
  column "mask"             { type = varchar(4)    note = "last 4 digits" }
  column "current_balance"  { type = numeric(12,2)  null = true }
  column "account_id"       { type = uuid           null = true  note = "linked internal Account" }
  column "asset_id"         { type = uuid           null = true  note = "linked internal Asset" }
  column "liability_id"     { type = uuid           null = true  note = "linked internal Liability" }
  column "created_at"       { type = timestamptz    default = sql("now()") }
  column "updated_at"       { type = timestamptz    default = sql("now()") }
  column "deleted_at"       { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_plaid_accounts_item"      { columns = [column.plaid_item_id] ref_columns = [table.plaid_items.column.id]  on_delete = CASCADE  }
  foreign_key "fk_plaid_accounts_user"      { columns = [column.user_id]       ref_columns = [table.users.column.id]        on_delete = CASCADE  }
  foreign_key "fk_plaid_accounts_account"   { columns = [column.account_id]    ref_columns = [table.accounts.column.id]     on_delete = SET_NULL }
  foreign_key "fk_plaid_accounts_asset"     { columns = [column.asset_id]      ref_columns = [table.assets.column.id]       on_delete = SET_NULL }
  foreign_key "fk_plaid_accounts_liability" { columns = [column.liability_id]  ref_columns = [table.liabilities.column.id]  on_delete = SET_NULL }
  index "idx_plaid_accounts_item"     { columns = [column.plaid_item_id] }
  index "idx_plaid_accounts_plaid_id" { columns = [column.plaid_account_id]  unique = true }
}
```

### plaid_transactions

```hcl
table "plaid_transactions" {
  column "id"                   { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"              { type = uuid }
  column "plaid_account_id"     { type = uuid }
  column "plaid_transaction_id" { type = varchar(255)  note = "stable Plaid ID — use for upsert" }
  column "expense_id"           { type = uuid           null = true }
  column "income_id"            { type = uuid           null = true }
  column "amount"               { type = numeric(12,2)  note = "positive = debit, negative = credit" }
  column "date"                 { type = date }
  column "authorized_date"      { type = date           null = true }
  column "description"          { type = varchar(255) }
  column "merchant_name"        { type = varchar(255)   null = true }
  column "plaid_category"       { type = varchar(255)   null = true }
  column "pending"              { type = boolean         default = false }
  column "status"               { type = enum("UNREVIEWED","MATCHED","ACCEPTED","IGNORED")  default = "UNREVIEWED" }
  column "created_at"           { type = timestamptz    default = sql("now()") }
  column "updated_at"           { type = timestamptz    default = sql("now()") }
  column "deleted_at"           { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_plaid_txn_user"    { columns = [column.user_id]          ref_columns = [table.users.column.id]          on_delete = CASCADE  }
  foreign_key "fk_plaid_txn_account" { columns = [column.plaid_account_id] ref_columns = [table.plaid_accounts.column.id] on_delete = CASCADE  }
  foreign_key "fk_plaid_txn_expense" { columns = [column.expense_id]       ref_columns = [table.expenses.column.id]       on_delete = SET_NULL }
  foreign_key "fk_plaid_txn_income"  { columns = [column.income_id]        ref_columns = [table.income.column.id]         on_delete = SET_NULL }
  index "idx_plaid_txn_account"   { columns = [column.plaid_account_id] }
  index "idx_plaid_txn_plaid_id"  { columns = [column.plaid_transaction_id]  unique = true }
  index "idx_plaid_txn_status"    { columns = [column.plaid_account_id, column.status] }
}
```

### plaid_webhooks

```hcl
table "plaid_webhooks" {
  # Append-only — no updated_at, no deleted_at
  column "id"           { type = uuid         default = sql("gen_random_uuid()") }
  column "plaid_item_id" { type = varchar(255)  note = "from webhook payload" }
  column "webhook_type" { type = varchar(100) }
  column "webhook_code" { type = varchar(100) }
  column "payload"      { type = jsonb }
  column "processed_at" { type = timestamptz   null = true }
  column "error"        { type = text          null = true }
  column "created_at"   { type = timestamptz   default = sql("now()") }

  primary_key { columns = [column.id] }
  index "idx_webhooks_item"        { columns = [column.plaid_item_id] }
  index "idx_webhooks_unprocessed" { columns = [column.plaid_item_id]  where = "processed_at IS NULL" }
}
```

### tax_documents

```hcl
table "tax_documents" {
  column "id"               { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"          { type = uuid }
  column "person_id"        { type = uuid }
  column "tax_year"         { type = int }
  column "document_type"    { type = enum("W2","1099_NEC","1099_INT","1099_DIV","1099_B","1099_R","1098","1098_E","SSA_1099","K1") }
  column "payer_name"       { type = varchar(255) }
  column "amount"           { type = numeric(12,2)  note = "primary reported amount e.g. Box 1 wages" }
  column "federal_withheld" { type = numeric(12,2)   null = true }
  column "state_withheld"   { type = numeric(12,2)   null = true }
  column "notes"            { type = text            null = true }
  column "created_at"       { type = timestamptz     default = sql("now()") }
  column "updated_at"       { type = timestamptz     default = sql("now()") }
  column "deleted_at"       { type = timestamptz     null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_tax_docs_user"   { columns = [column.user_id]   ref_columns = [table.users.column.id]   on_delete = CASCADE }
  foreign_key "fk_tax_docs_person" { columns = [column.person_id] ref_columns = [table.people.column.id]  on_delete = CASCADE }
  index "idx_tax_docs_user_year"   { columns = [column.user_id,   column.tax_year] }
  index "idx_tax_docs_person_year" { columns = [column.person_id, column.tax_year] }
}
```

### tax_estimates

```hcl
table "tax_estimates" {
  # Immutable — no updated_at, no deleted_at
  column "id"                       { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                  { type = uuid }
  column "tax_year"                 { type = int }
  column "filing_status"            { type = enum("SINGLE","MFJ","MFS","HOH") }
  column "gross_income"             { type = numeric(12,2) }
  column "adjusted_gross_income"    { type = numeric(12,2) }
  column "taxable_income"           { type = numeric(12,2) }
  column "deduction_amount"         { type = numeric(12,2) }
  column "estimated_federal_tax"    { type = numeric(12,2) }
  column "estimated_state_tax"      { type = numeric(12,2)  null = true }
  column "total_withheld"           { type = numeric(12,2) }
  column "estimated_refund_or_owed" { type = numeric(12,2)  note = "positive = refund, negative = owed" }
  column "effective_rate"           { type = decimal(7,4) }
  column "marginal_rate"            { type = decimal(7,4) }
  column "created_at"               { type = timestamptz    default = sql("now()") }

  primary_key { columns = [column.id] }
  foreign_key "fk_tax_estimates_user" {
    columns = [column.user_id]  ref_columns = [table.users.column.id]  on_delete = CASCADE
  }
  index "idx_tax_estimates_user_year" { columns = [column.user_id, column.tax_year] }
}
```

### tax_form_guide

```hcl
table "tax_form_guide" {
  column "id"                    { type = uuid         default = sql("gen_random_uuid()") }
  column "trigger_document_type" { type = varchar(50)  note = "e.g. 1099_NEC" }
  column "required_form"         { type = varchar(50)  note = "e.g. Schedule C" }
  column "description"           { type = text }
  column "irs_url"               { type = varchar(500)  null = true }
  column "created_at"            { type = timestamptz   default = sql("now()") }
  column "updated_at"            { type = timestamptz   default = sql("now()") }

  primary_key { columns = [column.id] }
  index "idx_tax_form_guide_trigger" { columns = [column.trigger_document_type] }
}
```

### roth_conversion_schedules

```hcl
table "roth_conversion_schedules" {
  column "id"              { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"         { type = uuid }
  column "person_id"       { type = uuid }
  column "tax_year"        { type = int }
  column "from_account_id" { type = uuid }
  column "to_account_id"   { type = uuid }
  column "planned_amount"  { type = numeric(12,2) }
  column "actual_amount"   { type = numeric(12,2)  null = true  note = "set when completed" }
  column "status"          { type = enum("PLANNED","COMPLETED","SKIPPED") }
  column "notes"           { type = text           null = true }
  column "created_at"      { type = timestamptz    default = sql("now()") }
  column "updated_at"      { type = timestamptz    default = sql("now()") }
  column "deleted_at"      { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_roth_user"   { columns = [column.user_id]         ref_columns = [table.users.column.id]    on_delete = CASCADE  }
  foreign_key "fk_roth_person" { columns = [column.person_id]       ref_columns = [table.people.column.id]   on_delete = CASCADE  }
  foreign_key "fk_roth_from"   { columns = [column.from_account_id] ref_columns = [table.accounts.column.id] on_delete = RESTRICT }
  foreign_key "fk_roth_to"     { columns = [column.to_account_id]   ref_columns = [table.accounts.column.id] on_delete = RESTRICT }
  index "idx_roth_person_year" { columns = [column.person_id, column.tax_year] }
}
```

### hsa_receipts

```hcl
table "hsa_receipts" {
  column "id"                { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"           { type = uuid }
  column "person_id"         { type = uuid }
  column "hsa_account_id"    { type = uuid }
  column "expense_date"      { type = date }
  column "amount"            { type = numeric(12,2) }
  column "description"       { type = varchar(255) }
  column "provider_name"     { type = varchar(255)   null = true }
  column "receipt_url"       { type = text           null = true }
  column "reimbursed_at"     { type = timestamptz    null = true  note = "null = pending for HSA ladder" }
  column "reimbursed_amount" { type = numeric(12,2)  null = true }
  column "created_at"        { type = timestamptz    default = sql("now()") }
  column "updated_at"        { type = timestamptz    default = sql("now()") }
  column "deleted_at"        { type = timestamptz    null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_hsa_user"    { columns = [column.user_id]       ref_columns = [table.users.column.id]    on_delete = CASCADE  }
  foreign_key "fk_hsa_person"  { columns = [column.person_id]     ref_columns = [table.people.column.id]   on_delete = CASCADE  }
  foreign_key "fk_hsa_account" { columns = [column.hsa_account_id] ref_columns = [table.accounts.column.id] on_delete = RESTRICT }
  index "idx_hsa_user_unreimbursed" { columns = [column.user_id]   where = "reimbursed_at IS NULL AND deleted_at IS NULL" }
  index "idx_hsa_person"            { columns = [column.person_id] }
}
```

### retirement_strategies

```hcl
table "retirement_strategies" {
  column "id"                     { type = uuid         default = sql("gen_random_uuid()") }
  column "user_id"                { type = uuid }
  column "person_id"              { type = uuid }
  column "target_retirement_age"  { type = int }
  column "target_retirement_date" { type = date          null = true }
  column "withdrawal_order"       { type = jsonb         note = "ordered array of account IDs" }
  column "roth_ladder_start_year" { type = int           null = true }
  column "safe_withdrawal_rate"   { type = decimal(5,4)  default = 0.0400 }
  column "annual_spend_target"    { type = numeric(12,2)  null = true }
  column "notes"                  { type = text          null = true }
  column "created_at"             { type = timestamptz   default = sql("now()") }
  column "updated_at"             { type = timestamptz   default = sql("now()") }
  column "deleted_at"             { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_retirement_strategy_user"   { columns = [column.user_id]   ref_columns = [table.users.column.id]   on_delete = CASCADE }
  foreign_key "fk_retirement_strategy_person" { columns = [column.person_id] ref_columns = [table.people.column.id]  on_delete = CASCADE }
  index "idx_retirement_strategy_person" { columns = [column.person_id]  unique = true }
}
```

### retirement_scenarios

```hcl
table "retirement_scenarios" {
  # Immutable — no updated_at, no deleted_at
  column "id"                      { type = uuid          default = sql("gen_random_uuid()") }
  column "user_id"                 { type = uuid }
  column "person_id"               { type = uuid }
  column "name"                    { type = varchar(255)  note = "e.g. Retire at 50 — 3.5% SWR" }
  column "retirement_age"          { type = int }
  column "annual_spend"            { type = numeric(12,2) }
  column "safe_withdrawal_rate"    { type = decimal(5,4) }
  column "inflation_rate"          { type = decimal(5,4) }
  column "return_rate"             { type = decimal(5,4) }
  column "portfolio_at_retirement" { type = numeric(14,2)  note = "computed at creation" }
  column "required_portfolio"      { type = numeric(14,2)  note = "annual_spend / swr" }
  column "projected_depletion_age" { type = int            null = true  note = "null = portfolio is sustainable" }
  column "success_probability"     { type = decimal(5,4)   null = true  note = "Monte Carlo result if computed" }
  column "created_at"              { type = timestamptz    default = sql("now()") }

  primary_key { columns = [column.id] }
  foreign_key "fk_scenarios_user"   { columns = [column.user_id]   ref_columns = [table.users.column.id]   on_delete = CASCADE }
  foreign_key "fk_scenarios_person" { columns = [column.person_id] ref_columns = [table.people.column.id]  on_delete = CASCADE }
  index "idx_scenarios_person" { columns = [column.person_id] }
}
```

### sepp

```hcl
table "sepp" {
  column "id"                 { type = uuid         default = sql("gen_random_uuid()") }
  column "user_id"            { type = uuid }
  column "person_id"          { type = uuid }
  column "account_id"         { type = uuid }
  column "calculation_method" { type = enum("RMD","FIXED_AMORTIZATION","FIXED_ANNUITIZATION") }
  column "start_date"         { type = date }
  column "annual_amount"      { type = numeric(12,2) }
  column "modification_date"  { type = date          null = true  note = "5yrs from start or age 59½" }
  column "status"             { type = enum("ACTIVE","COMPLETED","MODIFIED") }
  column "notes"              { type = text          null = true }
  column "created_at"         { type = timestamptz   default = sql("now()") }
  column "updated_at"         { type = timestamptz   default = sql("now()") }
  column "deleted_at"         { type = timestamptz   null = true }

  primary_key { columns = [column.id] }
  foreign_key "fk_sepp_user"    { columns = [column.user_id]    ref_columns = [table.users.column.id]    on_delete = CASCADE  }
  foreign_key "fk_sepp_person"  { columns = [column.person_id]  ref_columns = [table.people.column.id]   on_delete = CASCADE  }
  foreign_key "fk_sepp_account" { columns = [column.account_id] ref_columns = [table.accounts.column.id] on_delete = RESTRICT }
  index "idx_sepp_person" { columns = [column.person_id] }
}
```

---

## Index Strategy Summary

| Type | When to use |
|---|---|
| Standard | Single-column FK lookups, simple filter columns |
| Composite | Queries that always filter by two columns together (e.g. user_id + date) |
| Unique | Enforce data integrity — one budget per user per month, no duplicate tags per user |
| Partial `WHERE deleted_at IS NULL` | Every high-traffic table — excludes soft-deleted rows from the index |
| Partial custom condition | `plaid_webhooks` unprocessed, `hsa_receipts` unreimbursed |

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
| Liability | CurrentRate | interest_rate if not null, else latest liability_rate_history.rate |
| Liability | EstimatedPayoffDate | amortization from current_balance + rate + payments |
| Liability | PayoffOrder | sorted by strategy, overridden by payoff_priority |
| Goal | Progress | linked account balance ÷ amount |
| RetirementStrategy | FINumber | annual_spend_target / safe_withdrawal_rate |
| RetirementStrategy | FIProgress | investable net worth / FINumber × 100 |
| RetirementStrategy | ProjectedFIDate | date portfolio reaches FINumber at current contribution rate |
| HSAReceipt | TotalUnreimbursed | SUM(amount) WHERE reimbursed_at IS NULL |
| NetWorthSnapshot | NetWorth* | **stored** — computed at creation, immutable after |
| TaxEstimate | EstimatedRefundOrOwed* | **stored** — computed at creation, immutable after |
| RetirementScenario | PortfolioAtRetirement* | **stored** — computed at creation, immutable after |

---

## Important Domain Rules

- `expenses.amount` must equal `SUM(expense_splits.amount)` — enforce in service layer before inserting
- `budgets.date` is always first-of-month — never store month/year as separate integers
- `liabilities.interest_rate` null means variable rate — look up `liability_rate_history`
- `assets.current_value` and `liabilities.current_balance` are manually updated — always update `last_value_updated_at` / `last_balance_updated_at` when the value changes, never rely on `updated_at`
- `expense_categories.rollover_amount` is floored at zero — never carry a negative rollover forward
- `plaid_items.access_token` must be AES-256 encrypted before storing — never log, never return via API
- `plaid_webhooks` is append-only — never update or delete rows
- `net_worth_snapshots` is append-only — never update after creation
- All tax estimates must display disclaimer — not tax advice, consult a CPA
- SEPP (Rule 72t) — always recommend a financial advisor prominently before a user starts one

---

## Seed Data Required

| Table | What to seed |
|---|---|
| `tax_brackets` | IRS brackets for current + prior years, all filing statuses, with rates |
| `irs_accounts` | 401k, Roth IRA, Traditional IRA, HSA limits for current + prior years |
| `tax_form_guide` | 1099-NEC → Schedule C, 1099-B → Schedule D + 8949, 1098 → Schedule A, etc. |
| `return_profiles` | High/Medium/Low Depreciation Vehicle, Standard Investment, Real Estate |
| `return_profile_schedules` | Year-by-year depreciation rates for each vehicle depreciation profile |
