-- Modify "recurring_expenses" table
ALTER TABLE "recurring_expenses" ADD COLUMN "person_id" uuid NULL, ADD CONSTRAINT "fk_recurring_expenses_person" FOREIGN KEY ("person_id") REFERENCES "planner_people" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
