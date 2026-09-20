-- Modify "contribution_limits" table
ALTER TABLE "contribution_limits" ADD COLUMN "family_annual_limit" numeric(12,2) NULL;
