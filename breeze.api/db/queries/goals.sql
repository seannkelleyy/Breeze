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
  ($1, 'Cover your highest insurance deductible', false, 'emergency-fund', 100, 'Save enough cash to cover your largest insurance deductible in a high-yield savings account', true, 1),
  ($1, 'Get employer match', false, 'retirement', 99, 'Contribute enough to your 401(k)/403(b) to receive the full employer match — free money', true, 2),
  ($1, 'Pay off high-interest debt', false, 'debt-payoff', 98, 'Pay off credit cards, car loans, and student loans with interest rates above 7%', true, 3),
  ($1, 'Build emergency fund (3-6 months)', false, 'emergency-fund', 97, 'Save 3-6 months of essential expenses in a high-yield savings account', true, 4),
  ($1, 'Max out Roth IRA and HSA', false, 'retirement', 96, 'Contribute maximum to Roth IRA ($7,000/year) and HSA ($4,150/year) if eligible', true, 5),
  ($1, 'Max out employer retirement plans', false, 'retirement', 95, 'Max out 401(k), 403(b), or 457 contributions ($23,000/year in 2024)', true, 6),
  ($1, 'Hyperaccumulation — invest 25%+ of income', false, 'investment', 94, 'Invest at least 25% of gross income across all accounts for retirement', true, 7),
  ($1, 'Prepay future expenses', false, 'other', 93, 'Save for kids college (529), vacation home, travel, or other long-term goals', true, 8),
  ($1, 'Pay off low-interest debt', false, 'debt-payoff', 92, 'Pay off remaining low-interest debt like mortgages if desired', true, 9)
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
