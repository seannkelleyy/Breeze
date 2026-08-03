-- Create "budgets" table
CREATE TABLE "public"."budgets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "date" date NOT NULL,
  "monthly_income" numeric(12,2) NOT NULL,
  "monthly_expenses" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_budgets_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "budgets_amounts_nonnegative" CHECK (monthly_income >= 0 AND monthly_expenses >= 0)
);
-- Create index "idx_budgets_user_id" to table: "budgets"
CREATE INDEX "idx_budgets_user_id" ON "public"."budgets" ("user_id");
-- Create index "idx_budgets_user_date" to table: "budgets"
CREATE UNIQUE INDEX "idx_budgets_user_date" ON "public"."budgets" ("user_id", "date");
-- Create index "idx_budgets_user_active" to table: "budgets"
CREATE INDEX "idx_budgets_user_active" ON "public"."budgets" ("user_id", "date") WHERE deleted_at IS NULL;
