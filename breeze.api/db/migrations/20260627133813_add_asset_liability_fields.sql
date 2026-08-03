-- Add fields to assets and liabilities tables that were previously applied
-- directly via atlas schema apply but not captured in migrations.

-- Modify "assets" table
ALTER TABLE "assets"
  ADD COLUMN IF NOT EXISTS "owner" character varying(64) NOT NULL DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS "contribution_mode" character varying(32) NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS "contribution_value" numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "employer_match_rate" numeric(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "employer_match_max_percent_of_salary" numeric(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "annual_rate" numeric(5,4) NOT NULL DEFAULT 0;

-- Modify "liabilities" table
ALTER TABLE "liabilities"
  ADD COLUMN IF NOT EXISTS "owner" character varying(64) NOT NULL DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS "contribution_mode" character varying(32) NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS "contribution_value" numeric(12,2) NOT NULL DEFAULT 0;
