-- name: CreateNetWorthSnapshot :one
INSERT INTO net_worth_snapshots (
    user_id,
    snapshot_date,
    total_assets,
    total_liabilities,
    net_worth
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetNetWorthSnapshot :one
SELECT * FROM net_worth_snapshots
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: GetNetWorthSnapshotByDate :one
SELECT * FROM net_worth_snapshots
WHERE user_id = $1 AND snapshot_date = $2 AND deleted_at IS NULL;

-- name: ListNetWorthSnapshots :many
SELECT * FROM net_worth_snapshots
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY snapshot_date ASC;

-- name: UpdateNetWorthSnapshot :one
UPDATE net_worth_snapshots
SET 
    total_assets = COALESCE(sqlc.narg('total_assets'), total_assets),
    total_liabilities = COALESCE(sqlc.narg('total_liabilities'), total_liabilities),
    net_worth = COALESCE(sqlc.narg('net_worth'), net_worth),
    updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
RETURNING *;

-- name: DeleteNetWorthSnapshot :exec
UPDATE net_worth_snapshots
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: CreateNetWorthSnapshotItem :one
INSERT INTO net_worth_snapshot_items (
    snapshot_id,
    account_id,
    label,
    amount,
    kind
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: ListNetWorthSnapshotItemsBySnapshotID :many
SELECT * FROM net_worth_snapshot_items
WHERE snapshot_id = $1 AND deleted_at IS NULL
ORDER BY kind, label;

-- name: SoftDeleteNetWorthSnapshotItems :execrows
UPDATE net_worth_snapshot_items
SET deleted_at = now(), updated_at = now()
WHERE snapshot_id = $1 AND deleted_at IS NULL;
