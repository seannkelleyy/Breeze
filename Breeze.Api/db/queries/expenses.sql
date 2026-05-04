-- name: CreateExpense :one
INSERT INTO expenses (
  user_id,
  budget_id,
  amount,
  date,
  description,
  recurring_source_id
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
  id,
  user_id,
  budget_id,
  amount,
  date,
  description,
  recurring_source_id,
  created_at,
  updated_at,
  deleted_at;

-- name: GetExpenseByID :one
SELECT
  id,
  user_id,
  budget_id,
  amount,
  date,
  description,
  recurring_source_id,
  created_at,
  updated_at,
  deleted_at
FROM expenses
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListExpensesByBudgetID :many
SELECT
  id,
  user_id,
  budget_id,
  amount,
  date,
  description,
  recurring_source_id,
  created_at,
  updated_at,
  deleted_at
FROM expenses
WHERE budget_id = $1
  AND deleted_at IS NULL
ORDER BY date DESC, created_at DESC;

-- name: UpdateExpense :one
UPDATE expenses
SET
  amount = $2,
  date = $3,
  description = $4,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  budget_id,
  amount,
  date,
  description,
  recurring_source_id,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteExpense :execrows
UPDATE expenses
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: CreateExpenseSplit :one
INSERT INTO expense_splits (
  expense_id,
  category_id,
  amount,
  description
) VALUES ($1, $2, $3, $4)
RETURNING
  id,
  expense_id,
  category_id,
  amount,
  description,
  created_at,
  updated_at,
  deleted_at;

-- name: ListExpenseSplitsByExpenseIDs :many
SELECT
  id,
  expense_id,
  category_id,
  amount,
  description,
  created_at,
  updated_at,
  deleted_at
FROM expense_splits
WHERE expense_id = ANY($1::uuid[])
  AND deleted_at IS NULL
ORDER BY created_at ASC;

-- name: SoftDeleteExpenseSplitsByExpenseID :execrows
UPDATE expense_splits
SET deleted_at = now(),
    updated_at = now()
WHERE expense_id = $1
  AND deleted_at IS NULL;
