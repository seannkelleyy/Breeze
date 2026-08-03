-- Create enum type "expense_source_type"
CREATE TYPE "expense_source_type" AS ENUM ('MANUAL', 'RECURRING_TEMPLATE');
-- Modify "assets" table
ALTER TABLE "assets" ALTER COLUMN "owner" DROP DEFAULT, ALTER COLUMN "contribution_mode" DROP DEFAULT, ALTER COLUMN "contribution_value" DROP DEFAULT, ALTER COLUMN "employer_match_rate" DROP DEFAULT, ALTER COLUMN "employer_match_max_percent_of_salary" DROP DEFAULT, ALTER COLUMN "annual_rate" DROP DEFAULT, DROP COLUMN "return_profile";
-- Modify "expense_categories" table
ALTER TABLE "expense_categories" ADD COLUMN "source_type" "expense_source_type" NOT NULL DEFAULT 'MANUAL', ADD COLUMN "source_template_id" uuid NULL, ADD COLUMN "generation_month" date NULL;
-- Create index "idx_expense_categories_source_template" to table: "expense_categories"
CREATE INDEX "idx_expense_categories_source_template" ON "expense_categories" ("source_template_id");
-- Modify "expenses" table
ALTER TABLE "expenses" DROP COLUMN "recurring_source_id", ADD COLUMN "source_type" "expense_source_type" NOT NULL DEFAULT 'MANUAL', ADD COLUMN "source_template_id" uuid NULL, ADD COLUMN "generation_month" date NULL;
-- Create index "idx_expenses_source_template" to table: "expenses"
CREATE INDEX "idx_expenses_source_template" ON "expenses" ("source_template_id");
-- Modify "liabilities" table
ALTER TABLE "liabilities" ALTER COLUMN "owner" DROP DEFAULT, ALTER COLUMN "contribution_mode" DROP DEFAULT, ALTER COLUMN "contribution_value" DROP DEFAULT;
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
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_recurring_expenses_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "recurring_expenses_amount_positive" CHECK (amount > (0)::numeric),
  CONSTRAINT "recurring_expenses_payday_valid" CHECK ((payday_day_of_month IS NULL) OR ((payday_day_of_month >= 1) AND (payday_day_of_month <= 31)))
);
-- Create index "idx_recurring_expenses_user" to table: "recurring_expenses"
CREATE INDEX "idx_recurring_expenses_user" ON "recurring_expenses" ("user_id");
-- Create index "idx_recurring_expenses_user_dates" to table: "recurring_expenses"
CREATE INDEX "idx_recurring_expenses_user_dates" ON "recurring_expenses" ("user_id", "start_date", "end_date");
-- Drop "planner_people" table
DROP TABLE "planner_people";
