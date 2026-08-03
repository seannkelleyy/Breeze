-- name: GetTaxBracketByID :one
SELECT
  id,
  year,
  filing_status,
  minimum_amount,
  maximum_amount,
  rate,
  created_at,
  updated_at,
  deleted_at
FROM tax_brackets
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: CreateTaxBracket :one
INSERT INTO tax_brackets (
  year,
  filing_status,
  minimum_amount,
  maximum_amount,
  rate
)
VALUES ($1, $2, $3, $4, $5)
RETURNING
  id,
  year,
  filing_status,
  minimum_amount,
  maximum_amount,
  rate,
  created_at,
  updated_at,
  deleted_at;

-- name: ListTaxBracketsByYearAndFilingStatus :many
SELECT
  id,
  year,
  filing_status,
  minimum_amount,
  maximum_amount,
  rate,
  created_at,
  updated_at,
  deleted_at
FROM tax_brackets
WHERE year = $1
  AND filing_status = $2
  AND deleted_at IS NULL
ORDER BY minimum_amount ASC;

-- name: UpdateTaxBracket :one
UPDATE tax_brackets
SET
  year = $2,
  filing_status = $3,
  minimum_amount = $4,
  maximum_amount = $5,
  rate = $6,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  year,
  filing_status,
  minimum_amount,
  maximum_amount,
  rate,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteTaxBracket :execrows
UPDATE tax_brackets
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;