-- name: CreateBudget :one
INSERT INTO budgets (
  user_id,
  date,
  monthly_income,
  monthly_expenses
) VALUES ($1, $2, $3, $4)
RETURNING
  id,
  user_id,
  date,
  monthly_income,
  monthly_expenses,
  created_at,
  updated_at,
  deleted_at;

-- name: GetBudgetByID :one
SELECT
  id,
  user_id,
  date,
  monthly_income,
  monthly_expenses,
  created_at,
  updated_at,
  deleted_at
FROM budgets
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: GetBudgetByDate :one
SELECT
  id,
  user_id,
  date,
  monthly_income,
  monthly_expenses,
  created_at,
  updated_at,
  deleted_at
FROM budgets
WHERE user_id = $1
  AND date = $2
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListBudgetsByUserID :many
SELECT
  id,
  user_id,
  date,
  monthly_income,
  monthly_expenses,
  created_at,
  updated_at,
  deleted_at
FROM budgets
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY date DESC;

-- name: UpdateBudget :one
UPDATE budgets
SET
  monthly_income = $2,
  monthly_expenses = $3,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  date,
  monthly_income,
  monthly_expenses,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteBudget :execrows
UPDATE budgets
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
