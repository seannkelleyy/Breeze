-- name: CreatePlaidConnection :one
INSERT INTO plaid_connections (
  user_id, environment, institution_id, institution_name, access_token, item_id
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, user_id, environment, institution_id, institution_name, access_token, item_id, created_at, updated_at, deleted_at;

-- name: GetPlaidConnectionByID :one
SELECT id, user_id, environment, institution_id, institution_name, access_token, item_id, created_at, updated_at, deleted_at
FROM plaid_connections
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListPlaidConnectionsByUserID :many
SELECT id, user_id, environment, institution_id, institution_name, access_token, item_id, created_at, updated_at, deleted_at
FROM plaid_connections
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdatePlaidConnection :one
UPDATE plaid_connections SET
  institution_id = $2,
  institution_name = $3,
  access_token = $4,
  item_id = $5,
  updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING id, user_id, environment, institution_id, institution_name, access_token, item_id, created_at, updated_at, deleted_at;

-- name: SoftDeletePlaidConnection :execrows
UPDATE plaid_connections SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL;

-- name: CreatePlaidAccount :one
INSERT INTO plaid_accounts (
  plaid_connection_id, external_id, name, official_name, type, subtype, current_balance, iso_currency_code
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, plaid_connection_id, external_id, name, official_name, type, subtype, current_balance, iso_currency_code, created_at, updated_at, deleted_at;

-- name: UpsertPlaidAccount :one
INSERT INTO plaid_accounts (
  plaid_connection_id, external_id, name, official_name, type, subtype, current_balance, iso_currency_code
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (external_id) DO UPDATE SET
  name = EXCLUDED.name,
  official_name = EXCLUDED.official_name,
  type = EXCLUDED.type,
  subtype = EXCLUDED.subtype,
  current_balance = EXCLUDED.current_balance,
  iso_currency_code = EXCLUDED.iso_currency_code,
  updated_at = now()
RETURNING id, plaid_connection_id, external_id, name, official_name, type, subtype, current_balance, iso_currency_code, created_at, updated_at, deleted_at;

-- name: GetPlaidAccountsByConnectionID :many
SELECT id, plaid_connection_id, external_id, name, official_name, type, subtype, current_balance, iso_currency_code, created_at, updated_at, deleted_at
FROM plaid_accounts
WHERE plaid_connection_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: SoftDeletePlaidAccount :execrows
UPDATE plaid_accounts SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL;
