-- Create "expense_categories" table
CREATE TABLE "expense_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "allocation" numeric(12,2) NOT NULL,
  "current_spend" numeric(12,2) NOT NULL DEFAULT 0,
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
-- Create index "idx_expense_categories_user_id" to table: "expense_categories"
CREATE INDEX "idx_expense_categories_user_id" ON "expense_categories" ("user_id");
