-- Create "expenses" table
CREATE TABLE "expenses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "date" date NOT NULL,
  "description" character varying(255) NOT NULL,
  "recurring_source_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_expenses_budget" FOREIGN KEY ("budget_id") REFERENCES "budgets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_expenses_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "expenses_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_expenses_budget" to table: "expenses"
CREATE INDEX "idx_expenses_budget" ON "expenses" ("budget_id");
-- Create index "idx_expenses_budget_active" to table: "expenses"
CREATE INDEX "idx_expenses_budget_active" ON "expenses" ("budget_id") WHERE (deleted_at IS NULL);
-- Create index "idx_expenses_recurring" to table: "expenses"
CREATE INDEX "idx_expenses_recurring" ON "expenses" ("recurring_source_id");
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
