-- Modify "assets" table
ALTER TABLE "assets" ADD COLUMN "tax_treatment" text NOT NULL DEFAULT 'PRE_TAX';
