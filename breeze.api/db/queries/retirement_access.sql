-- name: CreateHsaReceipt :one
INSERT INTO hsa_receipts (
    user_id,
    incurred_on,
    description,
    amount
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListHsaReceiptsByUserID :many
SELECT * FROM hsa_receipts
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY incurred_on ASC;

-- name: SoftDeleteHsaReceipt :execrows
UPDATE hsa_receipts
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: CreateHsaReimbursement :one
INSERT INTO hsa_reimbursements (
    user_id,
    reimbursed_on,
    amount,
    note
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListHsaReimbursementsByUserID :many
SELECT * FROM hsa_reimbursements
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY reimbursed_on ASC;

-- name: SoftDeleteHsaReimbursement :execrows
UPDATE hsa_reimbursements
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: CreateRothConversion :one
INSERT INTO roth_conversions (
    user_id,
    converted_on,
    amount,
    from_asset_id,
    to_asset_id,
    note
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: ListRothConversionsByUserID :many
SELECT * FROM roth_conversions
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY converted_on ASC;

-- name: SoftDeleteRothConversion :execrows
UPDATE roth_conversions
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;
