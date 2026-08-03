-- Alter income_growth_rate precision from numeric(5,2) to numeric(7,4)
ALTER TABLE "planner_people"
  ALTER COLUMN "income_growth_rate" TYPE numeric(7,4);
