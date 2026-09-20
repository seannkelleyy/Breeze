-- Modify "planner_people" table
ALTER TABLE "planner_people" DROP COLUMN IF EXISTS "paycheck";
-- Modify "paycheck_deductions" table
ALTER TABLE "paycheck_deductions" ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'OTHER', ADD COLUMN IF NOT EXISTS "linked_account_id" uuid NULL, ADD CONSTRAINT "fk_paycheck_deductions_linked_account" FOREIGN KEY ("linked_account_id") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- Create index "idx_paycheck_deductions_linked_account" to table: "paycheck_deductions"
CREATE INDEX IF NOT EXISTS "idx_paycheck_deductions_linked_account" ON "paycheck_deductions" ("linked_account_id");
