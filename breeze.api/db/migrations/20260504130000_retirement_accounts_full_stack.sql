-- Create enum type "retirement_account_owner"
CREATE TYPE "retirement_account_owner" AS ENUM ('SELF', 'SPOUSE');
-- Create enum type "retirement_account_type"
CREATE TYPE "retirement_account_type" AS ENUM ('ACCOUNT_401K', 'ACCOUNT_403B', 'ACCOUNT_457', 'ROTH_IRA', 'TRADITIONAL_IRA', 'HSA', 'OTHER');
-- Create enum type "retirement_tax_treatment"
CREATE TYPE "retirement_tax_treatment" AS ENUM ('PRE_TAX', 'ROTH', 'TAX_DEFERRED', 'TAXABLE', 'OTHER');
-- Create "retirement_accounts" table
CREATE TABLE "public"."retirement_accounts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "account_type" "retirement_account_type" NOT NULL,
  "owner" "retirement_account_owner" NOT NULL,
  "tax_treatment" "retirement_tax_treatment" NOT NULL,
  "current_balance" numeric(14,2) NOT NULL DEFAULT 0,
  "annual_contribution_limit" numeric(12,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_retirement_accounts_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "retirement_accounts_current_balance_non_negative" CHECK (current_balance >= (0)::numeric),
  CONSTRAINT "retirement_accounts_annual_contribution_limit_non_negative" CHECK (annual_contribution_limit >= (0)::numeric)
);
-- Create index "idx_retirement_accounts_user_id" to table: "retirement_accounts"
CREATE INDEX "idx_retirement_accounts_user_id" ON "public"."retirement_accounts" ("user_id");
-- Create index "idx_retirement_accounts_user_active" to table: "retirement_accounts"
CREATE INDEX "idx_retirement_accounts_user_active" ON "public"."retirement_accounts" ("user_id", "created_at") WHERE deleted_at IS NULL;
-- Create "contribution_limits" table
CREATE TABLE "public"."contribution_limits" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "account_type" "retirement_account_type" NOT NULL,
  "tax_year" integer NOT NULL,
  "annual_limit" numeric(12,2) NOT NULL,
  "catch_up_age" integer NOT NULL,
  "catch_up_amount" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "contribution_limits_annual_limit_positive" CHECK (annual_limit > (0)::numeric),
  CONSTRAINT "contribution_limits_catch_up_non_negative" CHECK ((catch_up_amount >= (0)::numeric) AND (catch_up_age >= 0))
);
-- Create index "idx_contribution_limits_account_year" to table: "contribution_limits"
CREATE UNIQUE INDEX "idx_contribution_limits_account_year" ON "public"."contribution_limits" ("account_type", "tax_year");
-- Create "contribution_entries" table
CREATE TABLE "public"."contribution_entries" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "retirement_account_id" uuid NOT NULL,
  "tax_year" integer NOT NULL,
  "contribution_date" date NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_contribution_entries_retirement_account" FOREIGN KEY ("retirement_account_id") REFERENCES "public"."retirement_accounts" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "contribution_entries_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_contribution_entries_account_id" to table: "contribution_entries"
CREATE INDEX "idx_contribution_entries_account_id" ON "public"."contribution_entries" ("retirement_account_id");
-- Create index "idx_contribution_entries_account_year" to table: "contribution_entries"
CREATE INDEX "idx_contribution_entries_account_year" ON "public"."contribution_entries" ("retirement_account_id", "tax_year");
-- Create index "idx_contribution_entries_account_active" to table: "contribution_entries"
CREATE INDEX "idx_contribution_entries_account_active" ON "public"."contribution_entries" ("retirement_account_id", "contribution_date") WHERE deleted_at IS NULL;

INSERT INTO "public"."contribution_limits" ("account_type", "tax_year", "annual_limit", "catch_up_age", "catch_up_amount") VALUES
  ('ACCOUNT_401K', 2026, 24500.00, 50, 8000.00),
  ('ACCOUNT_403B', 2026, 24500.00, 50, 8000.00),
  ('ACCOUNT_457', 2026, 24500.00, 50, 8000.00),
  ('ROTH_IRA', 2026, 7500.00, 50, 1100.00),
  ('TRADITIONAL_IRA', 2026, 7500.00, 50, 1100.00),
  ('HSA', 2026, 4400.00, 55, 1000.00);
