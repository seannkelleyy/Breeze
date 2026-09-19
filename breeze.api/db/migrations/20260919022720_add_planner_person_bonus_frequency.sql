-- Modify "planner_people" table
ALTER TABLE "planner_people" ADD COLUMN IF NOT EXISTS "bonus_frequency" text NOT NULL DEFAULT 'annual';
