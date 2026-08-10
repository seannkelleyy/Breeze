-- name: CreateExpense :one
INSERT INTO expenses (
  user_id,
  budget_id,
  amount,
  date,
  description,
  source_type,
  source_template_id,
  generation_month,
  person_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING
  id,
  user_id,
  budget_id,
  amount,
  date,
  description,
  source_type,
  source_template_id,
  generation_month,
  person_id,
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
  source_type,
  source_template_id,
  generation_month,
  person_id,
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
  source_type,
  source_template_id,
  generation_month,
  person_id,
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
  person_id = $5,
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
  source_type,
  source_template_id,
  generation_month,
  person_id,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteExpense :execrows
UPDATE expenses
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: SoftDeleteGeneratedExpensesByBudget :execrows
UPDATE expenses
SET deleted_at = now(),
    updated_at = now()
WHERE budget_id = $1
  AND source_type = 'RECURRING_TEMPLATE'
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

-- name: GetWeightedMonthlyExpenses :one
WITH monthly_totals AS (
  SELECT
    date_trunc('month', e.date) AS month,
    SUM(e.amount) AS total
  FROM expenses e
  WHERE e.user_id = $1
    AND e.deleted_at IS NULL
    AND e.date >= (CURRENT_DATE - INTERVAL '12 months')
  GROUP BY date_trunc('month', e.date)
),
weighted AS (
  SELECT
    month,
    total,
    ROW_NUMBER() OVER (ORDER BY month DESC) AS weight
  FROM monthly_totals
)
SELECT
  COALESCE(SUM(total * weight)::numeric / NULLIF(SUM(weight), 0), 0)::numeric AS weighted_monthly_expenses
FROM weighted;
