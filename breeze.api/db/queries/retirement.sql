-- name: CreateRetirementAccount :one
INSERT INTO retirement_accounts (
  user_id,
  name,
  account_type,
  owner,
  tax_treatment,
  current_balance,
  annual_contribution_limit
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING
  id,
  user_id,
  name,
  account_type,
  owner,
  tax_treatment,
  current_balance,
  annual_contribution_limit,
  created_at,
  updated_at,
  deleted_at;

-- name: GetRetirementAccountByID :one
SELECT
  id,
  user_id,
  name,
  account_type,
  owner,
  tax_treatment,
  current_balance,
  annual_contribution_limit,
  created_at,
  updated_at,
  deleted_at
FROM retirement_accounts
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListRetirementAccountsByUserID :many
SELECT
  id,
  user_id,
  name,
  account_type,
  owner,
  tax_treatment,
  current_balance,
  annual_contribution_limit,
  created_at,
  updated_at,
  deleted_at
FROM retirement_accounts
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateRetirementAccount :one
UPDATE retirement_accounts
SET
  name = $2,
  account_type = $3,
  owner = $4,
  tax_treatment = $5,
  current_balance = $6,
  annual_contribution_limit = $7,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  name,
  account_type,
  owner,
  tax_treatment,
  current_balance,
  annual_contribution_limit,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteRetirementAccount :execrows
UPDATE retirement_accounts
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: CreateContributionEntry :one
INSERT INTO contribution_entries (
  retirement_account_id,
  tax_year,
  contribution_date,
  amount
) VALUES ($1, $2, $3, $4)
RETURNING
  id,
  retirement_account_id,
  tax_year,
  contribution_date,
  amount,
  created_at,
  updated_at,
  deleted_at;

-- name: GetContributionLimitByAccountTypeAndTaxYear :one
SELECT
  id,
  account_type,
  tax_year,
  annual_limit,
  catch_up_age,
  catch_up_amount,
  created_at,
  updated_at,
  deleted_at
FROM contribution_limits
WHERE account_type = $1
  AND tax_year = $2
  AND deleted_at IS NULL
LIMIT 1;

-- name: GetContributionProgress :one
SELECT
  ra.id AS retirement_account_id,
  cl.tax_year,
  cl.annual_limit,
  COALESCE(SUM(ce.amount), 0)::numeric(12,2) AS contributed_ytd
FROM retirement_accounts ra
JOIN contribution_limits cl
  ON cl.account_type = ra.account_type
  AND cl.tax_year = $2
  AND cl.deleted_at IS NULL
LEFT JOIN contribution_entries ce
  ON ce.retirement_account_id = ra.id
  AND ce.tax_year = $2
  AND ce.deleted_at IS NULL
WHERE ra.id = $1
  AND ra.deleted_at IS NULL
GROUP BY ra.id, cl.tax_year, cl.annual_limit
LIMIT 1;
