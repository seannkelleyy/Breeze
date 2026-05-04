schema "public" {}

extension "pgcrypto" {
  schema = schema.public
}

enum "filing_status" {
  schema = schema.public
  values = ["SINGLE", "MFJ", "MFS", "HOH"]
}

enum "return_type" {
  schema = schema.public
  values = ["REAL", "NOMINAL"]
}

enum "deduction_type" {
  schema = schema.public
  values = ["STANDARD", "ITEMIZED"]
}

enum "payoff_strategy" {
  schema = schema.public
  values = ["AVALANCHE", "SNOWBALL"]
}

enum "asset_type" {
  schema = schema.public
  values = ["CASH", "INVESTMENT", "RETIREMENT", "REAL_ESTATE", "VEHICLE", "OTHER"]
}

enum "liability_type" {
  schema = schema.public
  values = ["MORTGAGE", "CREDIT_CARD", "STUDENT_LOAN", "AUTO_LOAN", "PERSONAL_LOAN", "OTHER"]
}

enum "recurrence_interval" {
  schema = schema.public
  values = ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]
}

enum "income_source_type" {
  schema = schema.public
  values = ["MANUAL", "RECURRING_TEMPLATE"]
}

table "tax_brackets" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "year" {
    type = int
    null = false
  }

  column "filing_status" {
    type = enum.filing_status
    null = false
  }

  column "minimum_amount" {
    type = numeric(12,2)
    null = false
  }

  column "maximum_amount" {
    type = numeric(12,2)
    null = true
  }

  column "rate" {
    type = decimal(5,4)
    null = false
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  index "idx_tax_brackets_year_status" {
    columns = [column.year, column.filing_status]
  }

  index "idx_tax_brackets_year_status_min" {
    columns = [column.year, column.filing_status, column.minimum_amount]
  }
}

table "users" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "email" {
    type = varchar(255)
    null = false
  }

  column "identity_provider_id" {
    type = varchar(255)
    null = false
  }

  column "return_type" {
    type = enum.return_type
    null = false
  }

  column "safe_withdrawal_rate" {
    type = decimal(5,4)
    null = false
  }

  column "currency_type" {
    type = varchar(10)
    null = false
  }

  column "inflation_rate" {
    type = decimal(5,4)
    null = false
  }

  column "deduction_type" {
    type = enum.deduction_type
    null = false
  }

  column "deduction_amount" {
    type = numeric(12,2)
    null = true
  }

  column "max_tax_bracket_id" {
    type = uuid
    null = true
  }

  column "filing_status" {
    type = enum.filing_status
    null = false
  }

  column "payoff_strategy" {
    type = enum.payoff_strategy
    null = false
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  foreign_key "fk_users_max_tax_bracket" {
    columns     = [column.max_tax_bracket_id]
    ref_columns = [table.tax_brackets.column.id]
    on_delete   = SET_NULL
  }

  index "idx_users_email" {
    columns = [column.email]
    unique  = true
  }

  index "idx_users_identity_provider_id" {
    columns = [column.identity_provider_id]
    unique  = true
  }

  index "idx_users_active" {
    columns = [column.id]
    where   = "deleted_at IS NULL"
  }
}

table "assets" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }

  column "asset_type" {
    type = enum.asset_type
    null = false
  }

  column "current_value" {
    type = numeric(14,2)
    null = false
  }

  column "last_value_updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  foreign_key "fk_assets_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  index "idx_assets_user_id" {
    columns = [column.user_id]
  }

  index "idx_assets_user_active" {
    columns = [column.user_id, column.created_at]
    where   = "deleted_at IS NULL"
  }
}

table "liabilities" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }

  column "liability_type" {
    type = enum.liability_type
    null = false
  }

  column "current_balance" {
    type = numeric(14,2)
    null = false
  }

  column "interest_rate" {
    type = decimal(5,4)
    null = false
  }

  column "minimum_payment" {
    type = numeric(12,2)
    null = false
  }

  column "target_extra_payment" {
    type    = numeric(12,2)
    null    = false
    default = sql("0")
  }

  column "payoff_priority" {
    type    = int
    null    = false
    default = 0
  }

  column "last_balance_updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  foreign_key "fk_liabilities_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  index "idx_liabilities_user_id" {
    columns = [column.user_id]
  }

  index "idx_liabilities_user_active" {
    columns = [column.user_id, column.created_at]
    where   = "deleted_at IS NULL"
  }
}

table "budgets" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "date" {
    type = date
    null = false
  }

  column "monthly_income" {
    type = numeric(12,2)
    null = false
  }

  column "monthly_expenses" {
    type = numeric(12,2)
    null = false
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  foreign_key "fk_budgets_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  index "idx_budgets_user_id" {
    columns = [column.user_id]
  }

  index "idx_budgets_user_date" {
    columns = [column.user_id, column.date]
    unique  = true
  }

  index "idx_budgets_user_active" {
    columns = [column.user_id, column.date]
    where   = "deleted_at IS NULL"
  }

  check "budgets_amounts_nonnegative" {
    expr = "monthly_income >= 0 AND monthly_expenses >= 0"
  }
}

table "expense_categories" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "budget_id" {
    type = uuid
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }

  column "allocation" {
    type = numeric(12,2)
    null = false
  }

  column "current_spend" {
    type    = numeric(12,2)
    null    = false
    default = sql("0")
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

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

  index "idx_expense_categories_user_id" {
    columns = [column.user_id]
  }

  index "idx_expense_categories_budget_id" {
    columns = [column.budget_id]
  }

  index "idx_expense_categories_budget_active" {
    columns = [column.budget_id]
    where   = "deleted_at IS NULL"
  }

  check "expense_categories_amounts_nonnegative" {
    expr = "allocation >= 0 AND current_spend >= 0"
  }
}

table "expenses" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "budget_id" {
    type = uuid
    null = false
  }

  column "amount" {
    type = numeric(12,2)
    null = false
  }

  column "date" {
    type = date
    null = false
  }

  column "description" {
    type = varchar(255)
    null = false
  }

  column "recurring_source_id" {
    type = uuid
    null = true
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

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

  index "idx_expenses_budget" {
    columns = [column.budget_id]
  }

  index "idx_expenses_user_date" {
    columns = [column.user_id, column.date]
  }

  index "idx_expenses_recurring" {
    columns = [column.recurring_source_id]
  }

  index "idx_expenses_budget_active" {
    columns = [column.budget_id]
    where   = "deleted_at IS NULL"
  }

  check "expenses_amount_positive" {
    expr = "amount > 0"
  }
}

table "expense_splits" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "expense_id" {
    type = uuid
    null = false
  }

  column "category_id" {
    type = uuid
    null = false
  }

  column "amount" {
    type = numeric(12,2)
    null = false
  }

  column "description" {
    type = varchar(255)
    null = true
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

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

  index "idx_splits_expense" {
    columns = [column.expense_id]
  }

  index "idx_splits_category" {
    columns = [column.category_id]
  }

  index "idx_splits_category_active" {
    columns = [column.category_id]
    where   = "deleted_at IS NULL"
  }

  check "splits_amount_positive" {
    expr = "amount > 0"
  }
}

table "recurring_income" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }

  column "amount" {
    type = numeric(12,2)
    null = false
  }

  column "recurrence_interval" {
    type = enum.recurrence_interval
    null = false
  }

  column "payday_day_of_month" {
    type = int
    null = true
  }

  column "start_date" {
    type = date
    null = false
  }

  column "end_date" {
    type = date
    null = true
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  foreign_key "fk_recurring_income_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  index "idx_recurring_income_user" {
    columns = [column.user_id]
  }

  index "idx_recurring_income_user_dates" {
    columns = [column.user_id, column.start_date, column.end_date]
  }

  check "recurring_income_amount_positive" {
    expr = "amount > 0"
  }

  check "recurring_income_payday_valid" {
    expr = "payday_day_of_month IS NULL OR (payday_day_of_month >= 1 AND payday_day_of_month <= 31)"
  }
}

table "income" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "budget_id" {
    type = uuid
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }

  column "amount" {
    type = numeric(12,2)
    null = false
  }

  column "date" {
    type = date
    null = false
  }

  column "source_type" {
    type    = enum.income_source_type
    null    = false
    default = "MANUAL"
  }

  column "source_template_id" {
    type = uuid
    null = true
  }

  column "source_occurrence_date" {
    type = date
    null = true
  }

  column "generation_month" {
    type = date
    null = true
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

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

  foreign_key "fk_income_recur" {
    columns     = [column.source_template_id]
    ref_columns = [table.recurring_income.column.id]
    on_delete   = SET_NULL
  }

  index "idx_income_budget" {
    columns = [column.budget_id]
  }

  index "idx_income_user_date" {
    columns = [column.user_id, column.date]
  }

  index "idx_income_source_template" {
    columns = [column.source_template_id]
  }

  index "idx_income_budget_active" {
    columns = [column.budget_id]
    where   = "deleted_at IS NULL"
  }

  check "income_amount_positive" {
    expr = "amount > 0"
  }
}

table "net_worth_snapshots" {
  schema = schema.public

  column "id" {
    type    = uuid
    null    = false
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "snapshot_date" {
    type = date
    null = false
  }

  column "total_assets" {
    type = numeric(15,2)
    null = false
  }

  column "total_liabilities" {
    type = numeric(15,2)
    null = false
  }

  column "net_worth" {
    type = numeric(15,2)
    null = false
  }

  column "created_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "updated_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "deleted_at" {
    type = timestamptz
    null = true
  }

  primary_key {
    columns = [column.id]
  }

  foreign_key "fk_net_worth_snapshots_user" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  index "idx_net_worth_snapshots_user_id" {
    columns = [column.user_id]
  }

  index "idx_net_worth_snapshots_user_date" {
    columns = [column.user_id, column.snapshot_date]
    unique  = true
    where   = "deleted_at IS NULL"
  }
}
