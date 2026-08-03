-- Create "net_worth_snapshots" table
CREATE TABLE "public"."net_worth_snapshots" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "snapshot_date" date NOT NULL,
  "total_assets" numeric(15,2) NOT NULL,
  "total_liabilities" numeric(15,2) NOT NULL,
  "net_worth" numeric(15,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_net_worth_snapshots_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_net_worth_snapshots_user_date" to table: "net_worth_snapshots"
CREATE UNIQUE INDEX "idx_net_worth_snapshots_user_date" ON "public"."net_worth_snapshots" ("user_id", "snapshot_date") WHERE deleted_at IS NULL;
-- Create index "idx_net_worth_snapshots_user_id" to table: "net_worth_snapshots"
CREATE INDEX "idx_net_worth_snapshots_user_id" ON "public"."net_worth_snapshots" ("user_id");
