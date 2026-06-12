-- name: CreateLiability :one
INSERT INTO liabilities (
  user_id,
  name,
  liability_type,
  current_balance,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  owner,
  contribution_mode,
  contribution_value
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING
  id,
  user_id,
  name,
  liability_type,
  current_balance,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  owner,
  contribution_mode,
  contribution_value,
  last_balance_updated_at,
  created_at,
  updated_at,
  deleted_at;

-- name: GetLiabilityByID :one
SELECT
  id,
  user_id,
  name,
  liability_type,
  current_balance,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  owner,
  contribution_mode,
  contribution_value,
  last_balance_updated_at,
  created_at,
  updated_at,
  deleted_at
FROM liabilities
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListLiabilitiesByUserID :many
SELECT
  id,
  user_id,
  name,
  liability_type,
  current_balance,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  owner,
  contribution_mode,
  contribution_value,
  last_balance_updated_at,
  created_at,
  updated_at,
  deleted_at
FROM liabilities
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateLiability :one
UPDATE liabilities
SET
  name = $2,
  liability_type = $3,
  current_balance = $4,
  interest_rate = $5,
  minimum_payment = $6,
  target_extra_payment = $7,
  payoff_priority = $8,
  owner = $9,
  contribution_mode = $10,
  contribution_value = $11,
  last_balance_updated_at = CASE
    WHEN current_balance IS DISTINCT FROM $4 THEN now()
    ELSE last_balance_updated_at
  END,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  name,
  liability_type,
  current_balance,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  owner,
  contribution_mode,
  contribution_value,
  last_balance_updated_at,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteLiability :execrows
UPDATE liabilities
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
