-- name: GetLatestTaxYear :one
SELECT MAX(year)::int AS year
FROM tax_brackets
WHERE deleted_at IS NULL;

-- name: ListStandardDeductionsByYear :many
SELECT
  id,
  year,
  filing_status,
  amount,
  created_at,
  updated_at,
  deleted_at
FROM standard_deductions
WHERE year = $1
  AND deleted_at IS NULL;

-- name: GetFicaParametersByYear :one
SELECT
  id,
  year,
  ss_wage_base,
  created_at,
  updated_at,
  deleted_at
FROM fica_parameters
WHERE year = $1
  AND deleted_at IS NULL
LIMIT 1;
