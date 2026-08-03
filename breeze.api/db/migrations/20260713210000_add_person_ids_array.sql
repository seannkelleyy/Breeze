-- Drop FK constraints (can't have FK on array column)
ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "fk_assets_person";
ALTER TABLE "liabilities" DROP CONSTRAINT IF EXISTS "fk_liabilities_person";
-- Add person_ids array column and migrate existing single-person data
ALTER TABLE "assets" ADD COLUMN "person_ids" uuid[] NOT NULL DEFAULT '{}'::uuid[];
ALTER TABLE "liabilities" ADD COLUMN "person_ids" uuid[] NOT NULL DEFAULT '{}'::uuid[];
UPDATE "assets" SET "person_ids" = ARRAY["person_id"] WHERE "person_id" IS NOT NULL;
UPDATE "liabilities" SET "person_ids" = ARRAY["person_id"] WHERE "person_id" IS NOT NULL;
-- Drop old single-person column
ALTER TABLE "assets" DROP COLUMN "person_id";
ALTER TABLE "liabilities" DROP COLUMN "person_id";
