-- name: UpsertPaycheckDeduction :one
INSERT INTO paycheck_deductions (id, user_id, person_id, name, amount, pretax, kind, linked_account_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    amount = EXCLUDED.amount,
    pretax = EXCLUDED.pretax,
    updated_at = now()
RETURNING id, user_id, person_id, name, amount, pretax, kind, linked_account_id, created_at, updated_at, deleted_at;

-- name: ListPaycheckDeductionsByPersonID :many
SELECT * FROM paycheck_deductions
WHERE user_id = $1 AND person_id = $2 AND deleted_at IS NULL
ORDER BY created_at ASC;

-- name: ListPaycheckDeductionsByUserID :many
SELECT * FROM paycheck_deductions
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at ASC;

-- name: SoftDeletePaycheckDeduction :execrows
UPDATE paycheck_deductions
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL;
