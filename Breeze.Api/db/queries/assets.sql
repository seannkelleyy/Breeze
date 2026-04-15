-- name: CreateAsset :one
INSERT INTO assets (
  user_id,
  name,
  asset_type,
  current_value
)
VALUES ($1, $2, $3, $4)
RETURNING
  id,
  user_id,
  name,
  asset_type,
  current_value,
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
