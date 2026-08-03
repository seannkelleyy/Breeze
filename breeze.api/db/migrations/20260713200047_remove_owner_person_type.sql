-- Modify "assets" table
ALTER TABLE "assets" DROP COLUMN "owner";
-- Modify "liabilities" table
ALTER TABLE "liabilities" DROP COLUMN "owner";
-- Modify "planner_people" table
ALTER TABLE "planner_people" DROP COLUMN "person_type";
