-- name: CreateScenarioProfile :one
INSERT INTO scenario_profiles (
  user_id,
  name,
  current_age,
  retirement_age,
  annual_spend,
  safe_withdrawal_rate,
  inflation_rate,
  return_rate,
  current_portfolio
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING
  id,
  user_id,
  name,
  current_age,
  retirement_age,
  annual_spend,
  safe_withdrawal_rate,
  inflation_rate,
  return_rate,
  current_portfolio,
  created_at,
  updated_at,
  deleted_at;

-- name: GetScenarioProfileByID :one
SELECT
  id,
  user_id,
  name,
  current_age,
  retirement_age,
  annual_spend,
  safe_withdrawal_rate,
  inflation_rate,
  return_rate,
  current_portfolio,
  created_at,
  updated_at,
  deleted_at
FROM scenario_profiles
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListScenarioProfilesByUserID :many
SELECT
  id,
  user_id,
  name,
  current_age,
  retirement_age,
  annual_spend,
  safe_withdrawal_rate,
  inflation_rate,
  return_rate,
  current_portfolio,
  created_at,
  updated_at,
  deleted_at
FROM scenario_profiles
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateScenarioProfile :one
UPDATE scenario_profiles
SET
  name = $2,
  current_age = $3,
  retirement_age = $4,
  annual_spend = $5,
  safe_withdrawal_rate = $6,
  inflation_rate = $7,
  return_rate = $8,
  current_portfolio = $9,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  name,
  current_age,
  retirement_age,
  annual_spend,
  safe_withdrawal_rate,
  inflation_rate,
  return_rate,
  current_portfolio,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteScenarioProfile :execrows
UPDATE scenario_profiles
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: UpsertScenarioResultCache :one
INSERT INTO scenario_results_cache (
  scenario_profile_id,
  portfolio_at_retirement,
  required_portfolio,
  projected_depletion_age,
  is_sustainable
) VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (scenario_profile_id) DO UPDATE SET
  portfolio_at_retirement = EXCLUDED.portfolio_at_retirement,
  required_portfolio = EXCLUDED.required_portfolio,
  projected_depletion_age = EXCLUDED.projected_depletion_age,
  is_sustainable = EXCLUDED.is_sustainable,
  updated_at = now()
RETURNING
  id,
  scenario_profile_id,
  portfolio_at_retirement,
  required_portfolio,
  projected_depletion_age,
  is_sustainable,
  created_at,
  updated_at,
  deleted_at;

-- name: GetScenarioResultCacheByScenarioProfileID :one
SELECT
  id,
  scenario_profile_id,
  portfolio_at_retirement,
  required_portfolio,
  projected_depletion_age,
  is_sustainable,
  created_at,
  updated_at,
  deleted_at
FROM scenario_results_cache
WHERE scenario_profile_id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListScenarioComparisonsByUserID :many
SELECT
  sp.id AS scenario_profile_id,
  sp.user_id,
  sp.name,
  sp.current_age,
  sp.retirement_age,
  sp.annual_spend,
  sp.safe_withdrawal_rate,
  sp.inflation_rate,
  sp.return_rate,
  sp.current_portfolio,
  sp.created_at AS profile_created_at,
  sp.updated_at AS profile_updated_at,
  src.portfolio_at_retirement,
  src.required_portfolio,
  src.projected_depletion_age,
  src.is_sustainable,
  src.created_at AS result_created_at,
  src.updated_at AS result_updated_at
FROM scenario_profiles sp
JOIN scenario_results_cache src
  ON src.scenario_profile_id = sp.id
  AND src.deleted_at IS NULL
WHERE sp.user_id = $1
  AND sp.deleted_at IS NULL
ORDER BY sp.created_at DESC;
