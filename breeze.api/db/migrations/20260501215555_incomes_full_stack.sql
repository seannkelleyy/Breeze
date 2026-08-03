-- Create enum type "income_source_type"
CREATE TYPE "income_source_type" AS ENUM ('MANUAL', 'RECURRING_TEMPLATE');
-- Create enum type "recurrence_interval"
CREATE TYPE "recurrence_interval" AS ENUM ('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
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
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
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
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_income_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
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
