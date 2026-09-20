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
