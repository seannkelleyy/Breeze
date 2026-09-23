-- name: LinkAssetToPlaidAccount :execrows
UPDATE assets
SET plaid_account_id = $2,
    updated_at = now()
WHERE assets.id = $1
  AND assets.user_id = $3
  AND assets.deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM plaid_accounts pa
    JOIN plaid_connections pc ON pc.id = pa.plaid_connection_id
    WHERE pa.id = $2
      AND pc.user_id = $3
      AND pa.deleted_at IS NULL
      AND pc.deleted_at IS NULL
  );

-- name: UnlinkAssetFromPlaidAccount :execrows
UPDATE assets
SET plaid_account_id = NULL,
    updated_at = now()
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL;

-- name: LinkLiabilityToPlaidAccount :execrows
UPDATE liabilities
SET plaid_account_id = $2,
    updated_at = now()
WHERE liabilities.id = $1
  AND liabilities.user_id = $3
  AND liabilities.deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM plaid_accounts pa
    JOIN plaid_connections pc ON pc.id = pa.plaid_connection_id
    WHERE pa.id = $2
      AND pc.user_id = $3
      AND pa.deleted_at IS NULL
      AND pc.deleted_at IS NULL
  );

-- name: UnlinkLiabilityFromPlaidAccount :execrows
UPDATE liabilities
SET plaid_account_id = NULL,
    updated_at = now()
WHERE id = $1
  AND user_id = $2
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
