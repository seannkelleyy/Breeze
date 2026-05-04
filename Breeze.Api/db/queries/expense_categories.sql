-- name: CreateExpenseCategory :one
INSERT INTO expense_categories (
  user_id,
  budget_id,
  name,
  allocation,
  current_spend
) VALUES ($1, $2, $3, $4, $5)
RETURNING
  id,
  user_id,
  budget_id,
  name,
  allocation,
  current_spend,
  created_at,
  updated_at,
  deleted_at;

-- name: GetExpenseCategoryByID :one
SELECT
  id,
  user_id,
  budget_id,
  name,
  allocation,
  current_spend,
  created_at,
  updated_at,
  deleted_at
FROM expense_categories
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListExpenseCategoriesByBudgetID :many
SELECT
  id,
  user_id,
  budget_id,
  name,
  allocation,
  current_spend,
  created_at,
  updated_at,
  deleted_at
FROM expense_categories
WHERE budget_id = $1
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateExpenseCategory :one
UPDATE expense_categories
SET
  name = $2,
  allocation = $3,
  current_spend = $4,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  budget_id,
  name,
  allocation,
  current_spend,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteExpenseCategory :execrows
UPDATE expense_categories
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
