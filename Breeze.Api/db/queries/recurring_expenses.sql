-- name: CreateRecurringExpense :one
INSERT INTO recurring_expenses (
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING
  id,
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  created_at,
  updated_at,
  deleted_at;

-- name: GetRecurringExpenseByID :one
SELECT
  id,
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  created_at,
  updated_at,
  deleted_at
FROM recurring_expenses
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListRecurringExpensesByUserID :many
SELECT
  id,
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  created_at,
  updated_at,
  deleted_at
FROM recurring_expenses
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateRecurringExpense :one
UPDATE recurring_expenses
SET
  name = $2,
  amount = $3,
  recurrence_interval = $4,
  payday_day_of_month = $5,
  start_date = $6,
  end_date = $7,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteRecurringExpense :execrows
UPDATE recurring_expenses
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
