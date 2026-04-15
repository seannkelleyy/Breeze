-- Create enum type "asset_type"
CREATE TYPE "asset_type" AS ENUM ('CASH', 'INVESTMENT', 'RETIREMENT', 'REAL_ESTATE', 'VEHICLE', 'OTHER');
-- Create "assets" table
CREATE TABLE "assets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "asset_type" "asset_type" NOT NULL,
  "current_value" numeric(14,2) NOT NULL,
  "last_value_updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_assets_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_assets_user_active" to table: "assets"
CREATE INDEX "idx_assets_user_active" ON "assets" ("user_id", "created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_assets_user_id" to table: "assets"
CREATE INDEX "idx_assets_user_id" ON "assets" ("user_id");
