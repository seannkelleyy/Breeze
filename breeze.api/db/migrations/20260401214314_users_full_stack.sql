-- Create enum type "filing_status"
CREATE TYPE "filing_status" AS ENUM ('SINGLE', 'MFJ', 'MFS', 'HOH');
-- Create enum type "return_type"
CREATE TYPE "return_type" AS ENUM ('REAL', 'NOMINAL');
-- Create enum type "deduction_type"
CREATE TYPE "deduction_type" AS ENUM ('STANDARD', 'ITEMIZED');
-- Create enum type "payoff_strategy"
CREATE TYPE "payoff_strategy" AS ENUM ('AVALANCHE', 'SNOWBALL');
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
-- Modify "users" table
ALTER TABLE "users" ADD COLUMN "identity_provider_id" character varying(255) NOT NULL, ADD COLUMN "return_type" "return_type" NOT NULL, ADD COLUMN "safe_withdrawal_rate" numeric(5,4) NOT NULL, ADD COLUMN "currency_type" character varying(10) NOT NULL, ADD COLUMN "inflation_rate" numeric(5,4) NOT NULL, ADD COLUMN "deduction_type" "deduction_type" NOT NULL, ADD COLUMN "deduction_amount" numeric(12,2) NULL, ADD COLUMN "max_tax_bracket_id" uuid NULL, ADD COLUMN "filing_status" "filing_status" NOT NULL, ADD COLUMN "payoff_strategy" "payoff_strategy" NOT NULL, ADD CONSTRAINT "fk_users_max_tax_bracket" FOREIGN KEY ("max_tax_bracket_id") REFERENCES "tax_brackets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- Create index "idx_users_identity_provider_id" to table: "users"
CREATE UNIQUE INDEX "idx_users_identity_provider_id" ON "users" ("identity_provider_id");
