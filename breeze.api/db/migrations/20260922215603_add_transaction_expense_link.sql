-- Modify "transactions" table
ALTER TABLE "transactions" ADD COLUMN "expense_id" uuid NULL, ADD CONSTRAINT "fk_transactions_expense" FOREIGN KEY ("expense_id") REFERENCES "expenses" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
