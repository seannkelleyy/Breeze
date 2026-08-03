-- Add return_profile column to assets table to persist the user's
-- selected return profile (none, money-market, bonds, stock-bond-mix, stocks, custom)
-- instead of re-deriving it from annual_rate on every load.

ALTER TABLE "assets"
  ADD COLUMN IF NOT EXISTS "return_profile" character varying(32);

