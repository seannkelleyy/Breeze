-- name: CreateAsset :one
INSERT INTO assets (
  user_id,
  name,
  asset_type,
  current_value,
  owner,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING
  id,
  user_id,
  name,
  asset_type,
  current_value,
  owner,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
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
  owner,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
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
  owner,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
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
  owner = $5,
  contribution_mode = $6,
  contribution_value = $7,
  employer_match_rate = $8,
  employer_match_max_percent_of_salary = $9,
  annual_rate = $10,
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
  owner,
  contribution_mode,
  contribution_value,
  employer_match_rate,
  employer_match_max_percent_of_salary,
  annual_rate,
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
