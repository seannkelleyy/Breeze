-- Modify "assets" table
ALTER TABLE "assets" ADD COLUMN "pretax_share_percent" integer NULL;

-- Backfill: payroll-deducted accounts start fully on their current treatment
-- (PRE_TAX = 100, ROTH = 0); other account types keep NULL (not applicable).
UPDATE "assets" SET "pretax_share_percent" = CASE "tax_treatment" WHEN 'ROTH' THEN 0 ELSE 100 END
WHERE "asset_type" IN ('_401K', '_403B', '_457', 'HSA') AND "deleted_at" IS NULL;
