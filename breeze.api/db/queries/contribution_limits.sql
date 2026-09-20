-- name: GetContributionLimitByAccountTypeAndTaxYear :one
SELECT * FROM contribution_limits
WHERE account_type = $1
  AND tax_year = $2
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListContributionLimitsByTaxYear :many
SELECT * FROM contribution_limits
WHERE tax_year = $1
  AND deleted_at IS NULL
ORDER BY account_type;
