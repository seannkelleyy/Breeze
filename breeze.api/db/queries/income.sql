-- name: CreateIncome :one
INSERT INTO income (
  user_id,
  budget_id,
  name,
  amount,
  date,
  source_type,
  source_template_id,
  source_occurrence_date,
  generation_month,
  person_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING
  id,
  user_id,
  budget_id,
  name,
  amount,
  date,
  source_type,
  source_template_id,
  source_occurrence_date,
  generation_month,
  person_id,
  created_at,
  updated_at,
  deleted_at;

-- name: GetIncomeByID :one
SELECT
  id,
  user_id,
  budget_id,
  name,
  amount,
  date,
  source_type,
  source_template_id,
  source_occurrence_date,
  generation_month,
  person_id,
  created_at,
  updated_at,
  deleted_at
FROM income
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListIncomeByBudgetID :many
SELECT
  id,
  user_id,
  budget_id,
  name,
  amount,
  date,
  source_type,
  source_template_id,
  source_occurrence_date,
  generation_month,
  person_id,
  created_at,
  updated_at,
  deleted_at
FROM income
WHERE budget_id = $1
  AND deleted_at IS NULL
ORDER BY date DESC, created_at DESC;

-- name: UpdateIncome :one
UPDATE income
SET
  name = $2,
  amount = $3,
  date = $4,
  source_type = $5,
  source_template_id = $6,
  source_occurrence_date = $7,
  generation_month = $8,
  person_id = $9,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  budget_id,
  name,
  amount,
  date,
  source_type,
  source_template_id,
  source_occurrence_date,
  generation_month,
  person_id,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteIncome :execrows
UPDATE income
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: CreateRecurringIncome :one
INSERT INTO recurring_income (
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  person_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING
  id,
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  person_id,
  created_at,
  updated_at,
  deleted_at;

-- name: GetRecurringIncomeByID :one
SELECT
  id,
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  person_id,
  created_at,
  updated_at,
  deleted_at
FROM recurring_income
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListRecurringIncomeByUserID :many
SELECT
  id,
  user_id,
  name,
  amount,
  recurrence_interval,
  payday_day_of_month,
  start_date,
  end_date,
  person_id,
  created_at,
  updated_at,
  deleted_at
FROM recurring_income
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateRecurringIncome :one
UPDATE recurring_income
SET
  name = $2,
  amount = $3,
  recurrence_interval = $4,
  payday_day_of_month = $5,
  start_date = $6,
  end_date = $7,
  person_id = $8,
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
  person_id,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteRecurringIncome :execrows
UPDATE recurring_income
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
