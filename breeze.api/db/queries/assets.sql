-- name: CreateAsset :one
INSERT INTO assets (
  user_id,
  name,
  asset_type,
  current_value,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
  person_ids,
  purchase_date,
  purchase_price,
  home_growth_profile,
  vehicle_depreciation_profile,
  linked_liability_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
RETURNING
  id,
  user_id,
  name,
  asset_type,
  current_value,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
  person_ids,
  purchase_date,
  purchase_price,
  home_growth_profile,
  vehicle_depreciation_profile,
  linked_liability_id,
  plaid_account_id,
  last_value_updated_at,
  created_at,
  updated_at,
  deleted_at;

-- name: GetAssetByID :one
SELECT
  id,
  user_id,
  name,
  asset_type,
  current_value,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
  person_ids,
  purchase_date,
  purchase_price,
  home_growth_profile,
  vehicle_depreciation_profile,
  linked_liability_id,
  plaid_account_id,
  last_value_updated_at,
  created_at,
  updated_at,
  deleted_at
FROM assets
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListAssetsByUserID :many
SELECT
  id,
  user_id,
  name,
  asset_type,
  current_value,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
  person_ids,
  purchase_date,
  purchase_price,
  home_growth_profile,
  vehicle_depreciation_profile,
  linked_liability_id,
  plaid_account_id,
  last_value_updated_at,
  created_at,
  updated_at,
  deleted_at
FROM assets
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateAsset :one
UPDATE assets
SET
  name = $2,
  asset_type = $3,
  current_value = $4,
  contribution_mode = $5,
  contribution_value = $6,
  employer_match_rate = $7,
  employer_match_max_percent_of_salary = $8,
  annual_rate = $9,
  person_ids = $10,
  purchase_date = $11,
  purchase_price = $12,
  home_growth_profile = $13,
  vehicle_depreciation_profile = $14,
  linked_liability_id = $15,
  last_value_updated_at = CASE
    WHEN current_value IS DISTINCT FROM $4 THEN now()
    ELSE last_value_updated_at
  END,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  name,
  asset_type,
  current_value,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
  person_ids,
  purchase_date,
  purchase_price,
  home_growth_profile,
  vehicle_depreciation_profile,
  linked_liability_id,
  plaid_account_id,
  last_value_updated_at,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteAsset :execrows
UPDATE assets
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
