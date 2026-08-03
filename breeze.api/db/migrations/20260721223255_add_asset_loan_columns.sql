-- Add asset-linked-liability columns to assets table
ALTER TABLE "assets"
  ADD COLUMN IF NOT EXISTS "purchase_date" date,
  ADD COLUMN IF NOT EXISTS "purchase_price" numeric(14,2),
  ADD COLUMN IF NOT EXISTS "home_growth_profile" varchar(32),
  ADD COLUMN IF NOT EXISTS "vehicle_depreciation_profile" varchar(32),
  ADD COLUMN IF NOT EXISTS "linked_liability_id" uuid,
  ADD CONSTRAINT "fk_assets_linked_liability"
    FOREIGN KEY ("linked_liability_id")
    REFERENCES "liabilities" ("id")
    ON UPDATE NO ACTION
    ON DELETE SET NULL;
