-- Extend asset_type enum with granular values matching the frontend planner's AccountType
-- Replaces old generic values (CASH, INVESTMENT, RETIREMENT, REAL_ESTATE, VEHICLE, OTHER)
-- with specific account types. Liability types remain in the separate liability_type enum.

-- 1. Rename old enum type
ALTER TYPE asset_type RENAME TO asset_type_old;

-- 2. Create new enum with granular values
CREATE TYPE asset_type AS ENUM (
  'CHECKING',
  'EMERGENCY_FUND',
  'BROKERAGE',
  '_401K',
  '_403B',
  '_457',
  'ROTH_IRA',
  'TRADITIONAL_IRA',
  'HSA',
  'HOME',
  'VEHICLE',
  'OTHER'
);

-- 3. Migrate assets table column to new enum type with value mapping
-- Old values: CASH, INVESTMENT, RETIREMENT, REAL_ESTATE, VEHICLE, OTHER
ALTER TABLE assets
  ALTER COLUMN asset_type TYPE asset_type
  USING (
    CASE asset_type::text
      WHEN 'CASH'        THEN 'CHECKING'::asset_type
      WHEN 'INVESTMENT'  THEN 'BROKERAGE'::asset_type
      WHEN 'RETIREMENT'  THEN 'TRADITIONAL_IRA'::asset_type
      WHEN 'REAL_ESTATE' THEN 'OTHER'::asset_type
      ELSE asset_type::text::asset_type
    END
  );

-- 4. Drop old enum type
DROP TYPE asset_type_old;