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

-- 3. Migrate assets table column to new enum type
ALTER TABLE assets
  ALTER COLUMN asset_type TYPE asset_type
  USING asset_type::text::asset_type;

-- 4. Drop old enum type
DROP TYPE asset_type_old;