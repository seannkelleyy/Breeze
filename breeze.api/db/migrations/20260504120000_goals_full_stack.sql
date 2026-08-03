-- Create "goals" table
CREATE TABLE "public"."goals" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "description" text NOT NULL,
  "is_completed" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_goals_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_goals_user_id" to table: "goals"
CREATE INDEX "idx_goals_user_id" ON "public"."goals" ("user_id");
-- Create index "idx_goals_user_active" to table: "goals"
CREATE INDEX "idx_goals_user_active" ON "public"."goals" ("user_id", "created_at") WHERE deleted_at IS NULL;
