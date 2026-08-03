-- name: CreateUser :one
INSERT INTO users (
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING
  id,
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy,
  created_at,
  updated_at,
  deleted_at;

-- name: GetUserByID :one
SELECT
  id,
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy,
  created_at,
  updated_at,
  deleted_at
FROM users
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: GetUserByIdentityProviderID :one
SELECT
  id,
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy,
  created_at,
  updated_at,
  deleted_at
FROM users
WHERE identity_provider_id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListUsers :many
SELECT
  id,
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy,
  created_at,
  updated_at,
  deleted_at
FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateUser :one
UPDATE users
SET
  email = $2,
  identity_provider_id = $3,
  return_type = $4,
  safe_withdrawal_rate = $5,
  currency_type = $6,
  inflation_rate = $7,
  deduction_type = $8,
  deduction_amount = $9,
  max_tax_bracket_id = $10,
  filing_status = $11,
  payoff_strategy = $12,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteUser :execrows
UPDATE users
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetOrCreateUserByEmail :one
INSERT INTO users (
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
ON CONFLICT (email) DO UPDATE
SET
  identity_provider_id = $2,
  updated_at = now()
WHERE users.deleted_at IS NULL
RETURNING
  id,
  email,
  identity_provider_id,
  return_type,
  safe_withdrawal_rate,
  currency_type,
  inflation_rate,
  deduction_type,
  deduction_amount,
  max_tax_bracket_id,
  filing_status,
  payoff_strategy,
  created_at,
  updated_at,
  deleted_at;
