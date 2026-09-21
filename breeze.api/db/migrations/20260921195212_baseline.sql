-- Recreate the public schema dropped by schema-clean
CREATE SCHEMA IF NOT EXISTS public;

-- Create enum type "filing_status"
CREATE TYPE "filing_status" AS ENUM ('SINGLE', 'MFJ', 'MFS', 'HOH');
-- Create enum type "retirement_account_type"
CREATE TYPE "retirement_account_type" AS ENUM ('ACCOUNT_401K', 'ACCOUNT_403B', 'ACCOUNT_457', 'ROTH_IRA', 'TRADITIONAL_IRA', 'HSA', 'OTHER');
-- Create enum type "return_type"
CREATE TYPE "return_type" AS ENUM ('REAL', 'NOMINAL');
-- Create enum type "deduction_type"
CREATE TYPE "deduction_type" AS ENUM ('STANDARD', 'ITEMIZED');
-- Create enum type "payoff_strategy"
CREATE TYPE "payoff_strategy" AS ENUM ('AVALANCHE', 'SNOWBALL');
-- Create enum type "asset_type"
CREATE TYPE "asset_type" AS ENUM ('CHECKING', 'EMERGENCY_FUND', 'BROKERAGE', '_401K', '_403B', '_457', 'ROTH_IRA', 'TRADITIONAL_IRA', 'HSA', 'HOME', 'VEHICLE', 'OTHER');
-- Create enum type "liability_type"
CREATE TYPE "liability_type" AS ENUM ('MORTGAGE', 'CREDIT_CARD', 'STUDENT_LOAN', 'AUTO_LOAN', 'PERSONAL_LOAN', 'OTHER');
-- Create enum type "recurrence_interval"
CREATE TYPE "recurrence_interval" AS ENUM ('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
-- Create enum type "income_source_type"
CREATE TYPE "income_source_type" AS ENUM ('MANUAL', 'RECURRING_TEMPLATE', 'PEOPLE_PAYROLL');
-- Create enum type "expense_source_type"
CREATE TYPE "expense_source_type" AS ENUM ('MANUAL', 'RECURRING_TEMPLATE');
-- Create "contribution_limits" table
CREATE TABLE "contribution_limits" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "account_type" "retirement_account_type" NOT NULL,
  "tax_year" integer NOT NULL,
  "annual_limit" numeric(12,2) NOT NULL,
  "catch_up_age" integer NOT NULL,
  "catch_up_amount" numeric(12,2) NOT NULL,
  "family_annual_limit" numeric(12,2) NULL,
  "super_catch_up_amount" numeric(12,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "contribution_limits_annual_limit_positive" CHECK (annual_limit > (0)::numeric),
  CONSTRAINT "contribution_limits_catch_up_non_negative" CHECK ((catch_up_amount >= (0)::numeric) AND (catch_up_age >= 0))
);
-- Create index "idx_contribution_limits_account_year" to table: "contribution_limits"
CREATE UNIQUE INDEX "idx_contribution_limits_account_year" ON "contribution_limits" ("account_type", "tax_year");
-- Create "fica_parameters" table
CREATE TABLE "fica_parameters" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "year" integer NOT NULL,
  "ss_wage_base" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_fica_parameters_year" to table: "fica_parameters"
CREATE INDEX "idx_fica_parameters_year" ON "fica_parameters" ("year");
-- Create "standard_deductions" table
CREATE TABLE "standard_deductions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "year" integer NOT NULL,
  "filing_status" "filing_status" NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_standard_deductions_year_status" to table: "standard_deductions"
CREATE INDEX "idx_standard_deductions_year_status" ON "standard_deductions" ("year", "filing_status");
-- Create "tax_brackets" table
CREATE TABLE "tax_brackets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "year" integer NOT NULL,
  "filing_status" "filing_status" NOT NULL,
  "minimum_amount" numeric(12,2) NOT NULL,
  "maximum_amount" numeric(12,2) NULL,
  "rate" numeric(5,4) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_tax_brackets_year_status" to table: "tax_brackets"
CREATE INDEX "idx_tax_brackets_year_status" ON "tax_brackets" ("year", "filing_status");
-- Create index "idx_tax_brackets_year_status_min" to table: "tax_brackets"
CREATE INDEX "idx_tax_brackets_year_status_min" ON "tax_brackets" ("year", "filing_status", "minimum_amount");
-- Create "users" table
CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "email" character varying(255) NOT NULL,
  "identity_provider_id" character varying(255) NOT NULL,
  "return_type" "return_type" NOT NULL,
  "safe_withdrawal_rate" numeric(5,4) NOT NULL,
  "currency_type" character varying(10) NOT NULL,
  "inflation_rate" numeric(5,4) NOT NULL,
  "deduction_type" "deduction_type" NOT NULL,
  "deduction_amount" numeric(12,2) NULL,
  "max_tax_bracket_id" uuid NULL,
  "filing_status" "filing_status" NOT NULL,
  "payoff_strategy" "payoff_strategy" NOT NULL,
  "budget_enabled" boolean NOT NULL DEFAULT false,
  "monthly_expenses" numeric(12,2) NULL,
  "setup_completed" boolean NOT NULL DEFAULT false,
  "disclaimer_accepted" boolean NOT NULL DEFAULT false,
  "disclaimer_accepted_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_users_max_tax_bracket" FOREIGN KEY ("max_tax_bracket_id") REFERENCES "tax_brackets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "idx_users_active" to table: "users"
CREATE INDEX "idx_users_active" ON "users" ("id") WHERE (deleted_at IS NULL);
-- Create index "idx_users_email" to table: "users"
CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email");
-- Create index "idx_users_identity_provider_id" to table: "users"
CREATE UNIQUE INDEX "idx_users_identity_provider_id" ON "users" ("identity_provider_id");
-- Create "plaid_connections" table
CREATE TABLE "plaid_connections" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "environment" character varying(32) NOT NULL,
  "institution_id" character varying(255) NULL,
  "institution_name" character varying(255) NULL,
  "access_token" text NOT NULL,
  "item_id" character varying(255) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_plaid_connections_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_plaid_connections_user_id" to table: "plaid_connections"
CREATE INDEX "idx_plaid_connections_user_id" ON "plaid_connections" ("user_id");
-- Create "plaid_accounts" table
CREATE TABLE "plaid_accounts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "plaid_connection_id" uuid NOT NULL,
  "external_id" character varying(255) NOT NULL,
  "name" character varying(255) NOT NULL,
  "official_name" character varying(255) NULL,
  "type" character varying(128) NULL,
  "subtype" character varying(128) NULL,
  "current_balance" numeric(14,2) NULL,
  "iso_currency_code" character varying(8) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_plaid_accounts_connection" FOREIGN KEY ("plaid_connection_id") REFERENCES "plaid_connections" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_plaid_accounts_connection_id" to table: "plaid_accounts"
CREATE INDEX "idx_plaid_accounts_connection_id" ON "plaid_accounts" ("plaid_connection_id");
-- Create index "idx_plaid_accounts_external_id" to table: "plaid_accounts"
CREATE UNIQUE INDEX "idx_plaid_accounts_external_id" ON "plaid_accounts" ("external_id");
-- Create "liabilities" table
CREATE TABLE "liabilities" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "liability_type" "liability_type" NOT NULL,
  "current_balance" numeric(14,2) NOT NULL,
  "original_loan_amount" numeric(14,2) NULL,
  "interest_rate" numeric(5,4) NOT NULL,
  "minimum_payment" numeric(12,2) NOT NULL,
  "target_extra_payment" numeric(12,2) NOT NULL DEFAULT 0,
  "payoff_priority" integer NOT NULL DEFAULT 0,
  "person_ids" uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  "contribution_mode" character varying(32) NOT NULL,
  "contribution_value" numeric(12,2) NOT NULL,
  "plaid_account_id" uuid NULL,
  "last_balance_updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_liabilities_plaid_account" FOREIGN KEY ("plaid_account_id") REFERENCES "plaid_accounts" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_liabilities_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_liabilities_user_active" to table: "liabilities"
CREATE INDEX "idx_liabilities_user_active" ON "liabilities" ("user_id", "created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_liabilities_user_id" to table: "liabilities"
CREATE INDEX "idx_liabilities_user_id" ON "liabilities" ("user_id");
-- Create "assets" table
CREATE TABLE "assets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "asset_type" "asset_type" NOT NULL,
  "tax_treatment" text NOT NULL DEFAULT 'PRE_TAX',
  "current_value" numeric(14,2) NOT NULL,
  "person_ids" uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  "contribution_mode" character varying(32) NOT NULL,
  "contribution_value" numeric(12,2) NOT NULL,
  "employer_match_rate" numeric(5,4) NOT NULL,
  "employer_match_max_percent_of_salary" numeric(5,4) NOT NULL,
  "annual_rate" numeric(5,4) NOT NULL,
  "return_profile" character varying(32) NULL,
  "purchase_date" date NULL,
  "purchase_price" numeric(14,2) NULL,
  "home_growth_profile" character varying(32) NULL,
  "vehicle_depreciation_profile" character varying(32) NULL,
  "linked_liability_id" uuid NULL,
  "plaid_account_id" uuid NULL,
  "last_value_updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_assets_linked_liability" FOREIGN KEY ("linked_liability_id") REFERENCES "liabilities" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_assets_plaid_account" FOREIGN KEY ("plaid_account_id") REFERENCES "plaid_accounts" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_assets_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_assets_user_active" to table: "assets"
CREATE INDEX "idx_assets_user_active" ON "assets" ("user_id", "created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_assets_user_id" to table: "assets"
CREATE INDEX "idx_assets_user_id" ON "assets" ("user_id");
-- Create "budgets" table
CREATE TABLE "budgets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "date" date NOT NULL,
  "monthly_income" numeric(12,2) NOT NULL,
  "monthly_expenses" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_budgets_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "budgets_amounts_nonnegative" CHECK ((monthly_income >= (0)::numeric) AND (monthly_expenses >= (0)::numeric))
);
-- Create index "idx_budgets_user_active" to table: "budgets"
CREATE INDEX "idx_budgets_user_active" ON "budgets" ("user_id", "date") WHERE (deleted_at IS NULL);
-- Create index "idx_budgets_user_date" to table: "budgets"
CREATE UNIQUE INDEX "idx_budgets_user_date" ON "budgets" ("user_id", "date");
-- Create index "idx_budgets_user_id" to table: "budgets"
CREATE INDEX "idx_budgets_user_id" ON "budgets" ("user_id");
-- Create "expense_categories" table
CREATE TABLE "expense_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "allocation" numeric(12,2) NOT NULL,
  "current_spend" numeric(12,2) NOT NULL DEFAULT 0,
  "source_type" "expense_source_type" NOT NULL DEFAULT 'MANUAL',
  "source_template_id" uuid NULL,
  "generation_month" date NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_expense_categories_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_expense_categories_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "expense_categories_amounts_nonnegative" CHECK ((allocation >= (0)::numeric) AND (current_spend >= (0)::numeric))
);
-- Create index "idx_expense_categories_budget_active" to table: "expense_categories"
CREATE INDEX "idx_expense_categories_budget_active" ON "expense_categories" ("budget_id") WHERE (deleted_at IS NULL);
-- Create index "idx_expense_categories_budget_id" to table: "expense_categories"
CREATE INDEX "idx_expense_categories_budget_id" ON "expense_categories" ("budget_id");
-- Create index "idx_expense_categories_source_template" to table: "expense_categories"
CREATE INDEX "idx_expense_categories_source_template" ON "expense_categories" ("source_template_id");
-- Create index "idx_expense_categories_user_id" to table: "expense_categories"
CREATE INDEX "idx_expense_categories_user_id" ON "expense_categories" ("user_id");
-- Create "planner_people" table
CREATE TABLE "planner_people" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL DEFAULT '',
  "birthday" text NOT NULL DEFAULT '',
  "retirement_age" integer NOT NULL DEFAULT 60,
  "annual_salary" numeric(12,2) NOT NULL DEFAULT 0,
  "bonus_mode" text NOT NULL DEFAULT 'dollars',
  "bonus_frequency" text NOT NULL DEFAULT 'annual',
  "annual_bonus" numeric(12,2) NOT NULL DEFAULT 0,
  "income_growth_rate" numeric(7,4) NOT NULL DEFAULT 0,
  "pay_type" text NOT NULL DEFAULT 'salary',
  "pay_day" integer NOT NULL DEFAULT 1,
  "pay_cadence" text NOT NULL DEFAULT 'biweekly',
  "hourly_rate" numeric(8,2) NOT NULL DEFAULT 0,
  "expected_hours_per_week" numeric(5,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_planner_people_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_planner_people_user_active" to table: "planner_people"
CREATE INDEX "idx_planner_people_user_active" ON "planner_people" ("user_id", "created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_planner_people_user_id" to table: "planner_people"
CREATE INDEX "idx_planner_people_user_id" ON "planner_people" ("user_id");
-- Create "expenses" table
CREATE TABLE "expenses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "date" date NOT NULL,
  "description" character varying(255) NOT NULL,
  "source_type" "expense_source_type" NOT NULL DEFAULT 'MANUAL',
  "source_template_id" uuid NULL,
  "generation_month" date NULL,
  "person_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_expenses_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_expenses_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_expenses_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "expenses_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_expenses_budget" to table: "expenses"
CREATE INDEX "idx_expenses_budget" ON "expenses" ("budget_id");
-- Create index "idx_expenses_budget_active" to table: "expenses"
CREATE INDEX "idx_expenses_budget_active" ON "expenses" ("budget_id") WHERE (deleted_at IS NULL);
-- Create index "idx_expenses_source_template" to table: "expenses"
CREATE INDEX "idx_expenses_source_template" ON "expenses" ("source_template_id");
-- Create index "idx_expenses_user_date" to table: "expenses"
CREATE INDEX "idx_expenses_user_date" ON "expenses" ("user_id", "date");
-- Create "expense_splits" table
CREATE TABLE "expense_splits" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "expense_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "description" character varying(255) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_splits_category" FOREIGN KEY ("category_id") REFERENCES "expense_categories" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_splits_expense" FOREIGN KEY ("expense_id") REFERENCES "expenses" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "splits_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_splits_category" to table: "expense_splits"
CREATE INDEX "idx_splits_category" ON "expense_splits" ("category_id");
-- Create index "idx_splits_category_active" to table: "expense_splits"
CREATE INDEX "idx_splits_category_active" ON "expense_splits" ("category_id") WHERE (deleted_at IS NULL);
-- Create index "idx_splits_expense" to table: "expense_splits"
CREATE INDEX "idx_splits_expense" ON "expense_splits" ("expense_id");
-- Create "goals" table
CREATE TABLE "goals" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "description" text NOT NULL,
  "is_completed" boolean NOT NULL DEFAULT false,
  "target_amount" numeric(14,2) NULL,
  "target_date" date NULL,
  "category" character varying(50) NULL,
  "custom_category" character varying(100) NULL,
  "priority" integer NOT NULL DEFAULT 0,
  "notes" text NULL,
  "connected_account_ids" uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  "is_financial_order_step" boolean NOT NULL DEFAULT false,
  "financial_order_step" integer NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_goals_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_goals_financial_order" to table: "goals"
CREATE INDEX "idx_goals_financial_order" ON "goals" ("user_id", "financial_order_step") WHERE ((is_financial_order_step = true) AND (deleted_at IS NULL));
-- Create index "idx_goals_user_active" to table: "goals"
CREATE INDEX "idx_goals_user_active" ON "goals" ("user_id", "created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_goals_user_id" to table: "goals"
CREATE INDEX "idx_goals_user_id" ON "goals" ("user_id");
-- Create "recurring_income" table
CREATE TABLE "recurring_income" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "recurrence_interval" "recurrence_interval" NOT NULL,
  "payday_day_of_month" integer NULL,
  "start_date" date NOT NULL,
  "end_date" date NULL,
  "person_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_recurring_income_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_recurring_income_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "recurring_income_amount_positive" CHECK (amount > (0)::numeric),
  CONSTRAINT "recurring_income_payday_valid" CHECK ((payday_day_of_month IS NULL) OR ((payday_day_of_month >= 1) AND (payday_day_of_month <= 31)))
);
-- Create index "idx_recurring_income_user" to table: "recurring_income"
CREATE INDEX "idx_recurring_income_user" ON "recurring_income" ("user_id");
-- Create index "idx_recurring_income_user_dates" to table: "recurring_income"
CREATE INDEX "idx_recurring_income_user_dates" ON "recurring_income" ("user_id", "start_date", "end_date");
-- Create "income" table
CREATE TABLE "income" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "date" date NOT NULL,
  "source_type" "income_source_type" NOT NULL DEFAULT 'MANUAL',
  "source_template_id" uuid NULL,
  "source_occurrence_date" date NULL,
  "generation_month" date NULL,
  "person_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_income_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_income_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_income_recur" FOREIGN KEY ("source_template_id") REFERENCES "recurring_income" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_income_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "income_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_income_budget" to table: "income"
CREATE INDEX "idx_income_budget" ON "income" ("budget_id");
-- Create index "idx_income_budget_active" to table: "income"
CREATE INDEX "idx_income_budget_active" ON "income" ("budget_id") WHERE (deleted_at IS NULL);
-- Create index "idx_income_source_template" to table: "income"
CREATE INDEX "idx_income_source_template" ON "income" ("source_template_id");
-- Create index "idx_income_user_date" to table: "income"
CREATE INDEX "idx_income_user_date" ON "income" ("user_id", "date");
-- Create "net_worth_snapshots" table
CREATE TABLE "net_worth_snapshots" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "snapshot_date" date NOT NULL,
  "total_assets" numeric(15,2) NOT NULL,
  "total_liabilities" numeric(15,2) NOT NULL,
  "net_worth" numeric(15,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_net_worth_snapshots_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_net_worth_snapshots_user_date" to table: "net_worth_snapshots"
CREATE UNIQUE INDEX "idx_net_worth_snapshots_user_date" ON "net_worth_snapshots" ("user_id", "snapshot_date") WHERE (deleted_at IS NULL);
-- Create index "idx_net_worth_snapshots_user_id" to table: "net_worth_snapshots"
CREATE INDEX "idx_net_worth_snapshots_user_id" ON "net_worth_snapshots" ("user_id");
-- Create "net_worth_snapshot_items" table
CREATE TABLE "net_worth_snapshot_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "snapshot_id" uuid NOT NULL,
  "account_id" uuid NULL,
  "label" text NOT NULL DEFAULT '',
  "amount" numeric(15,2) NOT NULL,
  "kind" text NOT NULL DEFAULT 'ASSET',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_net_worth_snapshot_items_account" FOREIGN KEY ("account_id") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_net_worth_snapshot_items_snapshot" FOREIGN KEY ("snapshot_id") REFERENCES "net_worth_snapshots" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "net_worth_snapshot_items_kind_valid" CHECK (kind = ANY (ARRAY['ASSET'::text, 'LIABILITY'::text]))
);
-- Create index "idx_net_worth_snapshot_items_snapshot" to table: "net_worth_snapshot_items"
CREATE INDEX "idx_net_worth_snapshot_items_snapshot" ON "net_worth_snapshot_items" ("snapshot_id");
-- Create "paycheck_deductions" table
CREATE TABLE "paycheck_deductions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "person_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "pretax" boolean NOT NULL DEFAULT true,
  "kind" text NOT NULL DEFAULT 'OTHER',
  "linked_account_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_paycheck_deductions_linked_account" FOREIGN KEY ("linked_account_id") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_paycheck_deductions_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_paycheck_deductions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "paycheck_deductions_amounts_nonnegative" CHECK (amount >= (0)::numeric)
);
-- Create index "idx_paycheck_deductions_linked_account" to table: "paycheck_deductions"
CREATE INDEX "idx_paycheck_deductions_linked_account" ON "paycheck_deductions" ("linked_account_id");
-- Create index "idx_paycheck_deductions_person_active" to table: "paycheck_deductions"
CREATE INDEX "idx_paycheck_deductions_person_active" ON "paycheck_deductions" ("person_id") WHERE (deleted_at IS NULL);
-- Create index "idx_paycheck_deductions_user_id" to table: "paycheck_deductions"
CREATE INDEX "idx_paycheck_deductions_user_id" ON "paycheck_deductions" ("user_id");
-- Create "recurring_expenses" table
CREATE TABLE "recurring_expenses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "recurrence_interval" "recurrence_interval" NOT NULL,
  "payday_day_of_month" integer NULL,
  "start_date" date NOT NULL,
  "end_date" date NULL,
  "person_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_recurring_expenses_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_recurring_expenses_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "recurring_expenses_amount_positive" CHECK (amount > (0)::numeric),
  CONSTRAINT "recurring_expenses_payday_valid" CHECK ((payday_day_of_month IS NULL) OR ((payday_day_of_month >= 1) AND (payday_day_of_month <= 31)))
);
-- Create index "idx_recurring_expenses_user" to table: "recurring_expenses"
CREATE INDEX "idx_recurring_expenses_user" ON "recurring_expenses" ("user_id");
-- Create index "idx_recurring_expenses_user_dates" to table: "recurring_expenses"
CREATE INDEX "idx_recurring_expenses_user_dates" ON "recurring_expenses" ("user_id", "start_date", "end_date");
-- Create "transactions" table
CREATE TABLE "transactions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "plaid_account_id" uuid NULL,
  "plaid_transaction_id" text NULL,
  "date" date NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "name" text NOT NULL DEFAULT '',
  "expense_category_id" uuid NULL,
  "pending" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_transactions_expense_category" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_transactions_plaid_account" FOREIGN KEY ("plaid_account_id") REFERENCES "plaid_accounts" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "transactions_amount_nonzero" CHECK (amount <> (0)::numeric)
);
-- Create index "idx_transactions_plaid_account" to table: "transactions"
CREATE INDEX "idx_transactions_plaid_account" ON "transactions" ("plaid_account_id");
-- Create index "idx_transactions_plaid_transaction_id" to table: "transactions"
CREATE UNIQUE INDEX "idx_transactions_plaid_transaction_id" ON "transactions" ("plaid_transaction_id") WHERE ((plaid_transaction_id IS NOT NULL) AND (deleted_at IS NULL));
-- Create index "idx_transactions_user_date" to table: "transactions"
CREATE INDEX "idx_transactions_user_date" ON "transactions" ("user_id", "date");
-- Create index "idx_transactions_user_id" to table: "transactions"
CREATE INDEX "idx_transactions_user_id" ON "transactions" ("user_id");
