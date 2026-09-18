-- Modify "assets" table
ALTER TABLE "assets" ALTER COLUMN "person_ids" SET DEFAULT ARRAY[]::uuid[];
-- Modify "goals" table
ALTER TABLE "goals" ALTER COLUMN "connected_account_ids" SET DEFAULT ARRAY[]::uuid[];
-- Modify "liabilities" table
ALTER TABLE "liabilities" ALTER COLUMN "person_ids" SET DEFAULT ARRAY[]::uuid[];
-- Modify "planner_people" table
ALTER TABLE "planner_people" ADD COLUMN "pay_type" text NOT NULL DEFAULT 'salary', ADD COLUMN "pay_day" integer NOT NULL DEFAULT 1, ADD COLUMN "pay_cadence" text NOT NULL DEFAULT 'biweekly', ADD COLUMN "hourly_rate" numeric(8,2) NOT NULL DEFAULT 0, ADD COLUMN "expected_hours_per_week" numeric(5,2) NOT NULL DEFAULT 0;
