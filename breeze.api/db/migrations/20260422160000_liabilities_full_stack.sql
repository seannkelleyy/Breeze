-- Create enum type "liability_type"
CREATE TYPE "liability_type" AS ENUM ('MORTGAGE', 'CREDIT_CARD', 'STUDENT_LOAN', 'AUTO_LOAN', 'PERSONAL_LOAN', 'OTHER');
-- Create "liabilities" table
CREATE TABLE "liabilities" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "liability_type" "liability_type" NOT NULL,
  "current_balance" numeric(14,2) NOT NULL,
  "interest_rate" numeric(5,4) NOT NULL,
  "minimum_payment" numeric(12,2) NOT NULL,
  "target_extra_payment" numeric(12,2) NOT NULL DEFAULT 0,
  "payoff_priority" integer NOT NULL DEFAULT 0,
  "last_balance_updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_liabilities_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_liabilities_user_active" to table: "liabilities"
CREATE INDEX "idx_liabilities_user_active" ON "liabilities" ("user_id", "created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_liabilities_user_id" to table: "liabilities"
CREATE INDEX "idx_liabilities_user_id" ON "liabilities" ("user_id");
