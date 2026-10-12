-- Create "hsa_receipts" table
CREATE TABLE "hsa_receipts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "incurred_on" date NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_hsa_receipts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "hsa_receipts_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_hsa_receipts_user_active" to table: "hsa_receipts"
CREATE INDEX "idx_hsa_receipts_user_active" ON "hsa_receipts" ("user_id") WHERE (deleted_at IS NULL);
-- Create "hsa_reimbursements" table
CREATE TABLE "hsa_reimbursements" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "reimbursed_on" date NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "note" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_hsa_reimbursements_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "hsa_reimbursements_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_hsa_reimbursements_user_active" to table: "hsa_reimbursements"
CREATE INDEX "idx_hsa_reimbursements_user_active" ON "hsa_reimbursements" ("user_id") WHERE (deleted_at IS NULL);
-- Create "roth_conversions" table
CREATE TABLE "roth_conversions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "converted_on" date NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "from_asset_id" uuid NULL,
  "to_asset_id" uuid NULL,
  "note" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_roth_conversions_from_asset" FOREIGN KEY ("from_asset_id") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_roth_conversions_to_asset" FOREIGN KEY ("to_asset_id") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "fk_roth_conversions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "roth_conversions_amount_positive" CHECK (amount > (0)::numeric)
);
-- Create index "idx_roth_conversions_user_active" to table: "roth_conversions"
CREATE INDEX "idx_roth_conversions_user_active" ON "roth_conversions" ("user_id") WHERE (deleted_at IS NULL);
