-- name: CreateTransaction :one
INSERT INTO transactions (
    user_id,
    plaid_account_id,
    plaid_transaction_id,
    date,
    amount,
    name,
    expense_category_id,
    pending
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: UpsertPlaidTransaction :one
INSERT INTO transactions (
    user_id,
    plaid_account_id,
    plaid_transaction_id,
    date,
    amount,
    name,
    pending
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
ON CONFLICT (plaid_transaction_id) WHERE deleted_at IS NULL DO UPDATE SET
    plaid_account_id = EXCLUDED.plaid_account_id,
    date = EXCLUDED.date,
    amount = EXCLUDED.amount,
    name = EXCLUDED.name,
    pending = EXCLUDED.pending,
    updated_at = now()
RETURNING *;

-- name: GetTransaction :one
SELECT * FROM transactions
WHERE id = $1 AND deleted_at IS NULL;

-- name: ListTransactionsByUserID :many
SELECT * FROM transactions
WHERE user_id = $1
  AND deleted_at IS NULL
  AND date >= sqlc.arg('from_date')
  AND date <= sqlc.arg('to_date')
ORDER BY date DESC;

-- name: AssignTransactionCategory :one
UPDATE transactions
SET expense_category_id = sqlc.arg('expense_category_id'),
    updated_at = now()
WHERE id = sqlc.arg('id') AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteTransaction :execrows
UPDATE transactions
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL;

-- name: ListPlaidAccountIDsByConnectionID :many
SELECT id FROM plaid_accounts
WHERE plaid_connection_id = $1 AND deleted_at IS NULL;

-- name: SetTransactionExpense :one
UPDATE transactions
SET expense_id = sqlc.arg('expense_id'),
    updated_at = now()
WHERE id = sqlc.arg('id') AND deleted_at IS NULL
RETURNING *;
