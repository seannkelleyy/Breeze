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
