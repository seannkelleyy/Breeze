-- name: CreateLiability :one
INSERT INTO liabilities (
  user_id,
  name,
  liability_type,
  current_balance,
  original_loan_amount,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  contribution_mode,
  contribution_value,
  person_ids
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING
  id,
  user_id,
  name,
  liability_type,
  current_balance,
  original_loan_amount,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  contribution_mode,
  contribution_value,
  person_ids,
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
  original_loan_amount,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  contribution_mode,
  contribution_value,
  person_ids,
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
  original_loan_amount,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  contribution_mode,
  contribution_value,
  person_ids,
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
  original_loan_amount = $5,
  interest_rate = $6,
  minimum_payment = $7,
  target_extra_payment = $8,
  payoff_priority = $9,
  contribution_mode = $10,
  contribution_value = $11,
  person_ids = $12,
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
  original_loan_amount,
  interest_rate,
  minimum_payment,
  target_extra_payment,
  payoff_priority,
  contribution_mode,
  contribution_value,
  person_ids,
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
