-- Modify "contribution_limits" table
ALTER TABLE "contribution_limits" ADD COLUMN "super_catch_up_amount" numeric(12,2) NOT NULL DEFAULT 0;
