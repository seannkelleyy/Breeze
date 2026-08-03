-- Modify "assets" table
ALTER TABLE "assets" ADD COLUMN "person_id" uuid NULL, ADD CONSTRAINT "fk_assets_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- Modify "expenses" table
ALTER TABLE "expenses" ADD COLUMN "person_id" uuid NULL, ADD CONSTRAINT "fk_expenses_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- Modify "income" table
ALTER TABLE "income" ADD COLUMN "person_id" uuid NULL, ADD CONSTRAINT "fk_income_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- Modify "liabilities" table
ALTER TABLE "liabilities" ADD COLUMN "person_id" uuid NULL, ADD CONSTRAINT "fk_liabilities_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- Modify "recurring_income" table
ALTER TABLE "recurring_income" ADD COLUMN "person_id" uuid NULL, ADD CONSTRAINT "fk_recurring_income_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
