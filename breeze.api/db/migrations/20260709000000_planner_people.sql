CREATE TABLE "public"."planner_people" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "person_type" text NOT NULL DEFAULT 'self',
  "name" text NOT NULL DEFAULT '',
  "birthday" text NOT NULL DEFAULT '',
  "retirement_age" integer NOT NULL DEFAULT 60,
  "annual_salary" numeric(12,2) NOT NULL DEFAULT 0,
  "bonus_mode" text NOT NULL DEFAULT 'dollars',
  "annual_bonus" numeric(12,2) NOT NULL DEFAULT 0,
  "income_growth_rate" numeric(5,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_planner_people_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
CREATE INDEX "idx_planner_people_user_id" ON "public"."planner_people" ("user_id");
CREATE INDEX "idx_planner_people_user_active" ON "public"."planner_people" ("user_id", "created_at") WHERE deleted_at IS NULL;
