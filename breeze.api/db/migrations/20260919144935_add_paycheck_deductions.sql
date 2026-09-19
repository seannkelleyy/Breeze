-- Create "paycheck_deductions" table
CREATE TABLE IF NOT EXISTS "paycheck_deductions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "person_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "pretax" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_paycheck_deductions_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_paycheck_deductions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "paycheck_deductions_amounts_nonnegative" CHECK (amount >= (0)::numeric)
);
-- Create index "idx_paycheck_deductions_person_active" to table: "paycheck_deductions"
CREATE INDEX IF NOT EXISTS "idx_paycheck_deductions_person_active" ON "paycheck_deductions" ("person_id") WHERE (deleted_at IS NULL);
-- Create index "idx_paycheck_deductions_user_id" to table: "paycheck_deductions"
CREATE INDEX IF NOT EXISTS "idx_paycheck_deductions_user_id" ON "paycheck_deductions" ("user_id");
