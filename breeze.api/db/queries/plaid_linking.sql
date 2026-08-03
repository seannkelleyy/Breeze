-- name: LinkAssetToPlaidAccount :exec
UPDATE assets
SET plaid_account_id = $2,
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: UnlinkAssetFromPlaidAccount :exec
UPDATE assets
SET plaid_account_id = NULL,
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: LinkLiabilityToPlaidAccount :exec
UPDATE liabilities
SET plaid_account_id = $2,
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: UnlinkLiabilityFromPlaidAccount :exec
UPDATE liabilities
SET plaid_account_id = NULL,
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetAssetsByPlaidAccountID :many
SELECT a.id, a.name, a.asset_type, a.current_value
FROM assets a
WHERE a.plaid_account_id = $1
  AND a.deleted_at IS NULL;

-- name: GetLiabilitiesByPlaidAccountID :many
SELECT l.id, l.name, l.liability_type, l.current_balance
FROM liabilities l
WHERE l.plaid_account_id = $1
  AND l.deleted_at IS NULL;

-- name: ListPlaidAccountsByConnectionID :many
SELECT id, plaid_connection_id, external_id, name, official_name, type, subtype, current_balance, iso_currency_code, created_at, updated_at
FROM plaid_accounts
WHERE plaid_connection_id = $1
ORDER BY name;
