-- Modify "planner_people" table
ALTER TABLE "planner_people" ADD COLUMN IF NOT EXISTS "paycheck" text NOT NULL DEFAULT '';
