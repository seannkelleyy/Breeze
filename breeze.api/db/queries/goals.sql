-- name: CreateGoal :one
INSERT INTO goals (
  user_id,
  description,
  is_completed,
  target_amount,
  target_date,
  category,
  custom_category,
  priority,
  notes,
  connected_account_ids,
  is_financial_order_step,
  financial_order_step
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING
  id,
  user_id,
  description,
  is_completed,
  target_amount,
  target_date,
  category,
  custom_category,
  priority,
  notes,
  connected_account_ids,
  is_financial_order_step,
  financial_order_step,
  created_at,
  updated_at,
  deleted_at;

-- name: GetGoalByID :one
SELECT
  id,
  user_id,
  description,
  is_completed,
  target_amount,
  target_date,
  category,
  custom_category,
  priority,
  notes,
  connected_account_ids,
  is_financial_order_step,
  financial_order_step,
  created_at,
  updated_at,
  deleted_at
FROM goals
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListGoalsByUserID :many
SELECT
  id,
  user_id,
  description,
  is_completed,
  target_amount,
  target_date,
  category,
  custom_category,
  priority,
  notes,
  connected_account_ids,
  is_financial_order_step,
  financial_order_step,
  created_at,
  updated_at,
  deleted_at
FROM goals
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY
  is_financial_order_step DESC,
  financial_order_step ASC NULLS LAST,
  is_completed ASC,
  priority DESC,
  created_at DESC;

-- name: UpdateGoal :one
UPDATE goals
SET
  description = $2,
  is_completed = $3,
  target_amount = $4,
  target_date = $5,
  category = $6,
  custom_category = $7,
  priority = $8,
  notes = $9,
  connected_account_ids = $10,
  is_financial_order_step = $11,
  financial_order_step = $12,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  description,
  is_completed,
  target_amount,
  target_date,
  category,
  custom_category,
  priority,
  notes,
  connected_account_ids,
  is_financial_order_step,
  financial_order_step,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteGoal :execrows
UPDATE goals
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: ListFinancialOrderStepsByUserID :many
SELECT
  id,
  user_id,
  description,
  is_completed,
  target_amount,
  target_date,
  category,
  custom_category,
  priority,
  notes,
  connected_account_ids,
  is_financial_order_step,
  financial_order_step,
  created_at,
  updated_at,
  deleted_at
FROM goals
WHERE user_id = $1
  AND is_financial_order_step = true
  AND deleted_at IS NULL
ORDER BY financial_order_step ASC;

-- name: CreateFinancialOrderSteps :many
INSERT INTO goals (
  user_id,
  description,
  is_completed,
  category,
  priority,
  notes,
  is_financial_order_step,
  financial_order_step
) VALUES
  ($1, 'Build emergency fund (3-6 months expenses)', false, 'emergency-fund', 100, 'Save 3-6 months of essential expenses in a high-yield savings account', true, 1),
  ($1, 'Get employer 401k match', false, 'retirement', 99, 'Contribute enough to get full employer match', true, 2),
  ($1, 'Pay off high-interest debt', false, 'debt-payoff', 98, 'Pay off credit cards and loans with interest rates above 7%', true, 3),
  ($1, 'Max out HSA', false, 'retirement', 97, 'Max out Health Savings Account if eligible', true, 4),
  ($1, 'Max out Roth IRA', false, 'retirement', 96, 'Contribute maximum to Roth IRA ($7,000/year in 2024)', true, 5),
  ($1, 'Pay off medium-interest debt', false, 'debt-payoff', 95, 'Pay off student loans and car loans (5-7% interest)', true, 6),
  ($1, 'Max out 401k', false, 'retirement', 94, 'Max out 401k contributions ($23,000/year in 2024)', true, 7),
  ($1, 'Mega backdoor Roth', false, 'retirement', 93, 'If available through employer plan', true, 8),
  ($1, 'Invest in taxable brokerage', false, 'investment', 92, 'Invest in taxable accounts after tax-advantaged accounts are maxed', true, 9),
  ($1, 'Other financial goals', false, 'other', 91, 'Real estate, business, or other goals', true, 10)
RETURNING
  id,
  user_id,
  description,
  is_completed,
  target_amount,
  target_date,
  category,
  custom_category,
  priority,
  notes,
  connected_account_ids,
  is_financial_order_step,
  financial_order_step,
  created_at,
  updated_at,
  deleted_at;
