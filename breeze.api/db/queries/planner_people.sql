-- name: UpsertPlannerPerson :one
INSERT INTO planner_people (id, user_id, name, birthday, retirement_age, annual_salary, bonus_mode, bonus_frequency, annual_bonus, income_growth_rate, pay_type, pay_day, pay_cadence, hourly_rate, expected_hours_per_week)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    birthday = EXCLUDED.birthday,
    retirement_age = EXCLUDED.retirement_age,
    annual_salary = EXCLUDED.annual_salary,
    bonus_mode = EXCLUDED.bonus_mode,
    bonus_frequency = EXCLUDED.bonus_frequency,
    annual_bonus = EXCLUDED.annual_bonus,
    income_growth_rate = EXCLUDED.income_growth_rate,
    pay_type = EXCLUDED.pay_type,
    pay_day = EXCLUDED.pay_day,
    pay_cadence = EXCLUDED.pay_cadence,
    hourly_rate = EXCLUDED.hourly_rate,
    expected_hours_per_week = EXCLUDED.expected_hours_per_week,
    updated_at = now()
RETURNING id, user_id, name, birthday, retirement_age, annual_salary, bonus_mode, bonus_frequency, annual_bonus, income_growth_rate, pay_type, pay_day, pay_cadence, hourly_rate, expected_hours_per_week, created_at, updated_at, deleted_at;

-- name: ListPlannerPeopleByUserID :many
SELECT id, user_id, name, birthday, retirement_age, annual_salary, bonus_mode, bonus_frequency, annual_bonus, income_growth_rate, pay_type, pay_day, pay_cadence, hourly_rate, expected_hours_per_week, created_at, updated_at, deleted_at
FROM planner_people
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at ASC;

-- name: SoftDeletePlannerPerson :execrows
UPDATE planner_people
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: SoftDeletePlannerPeopleByUserID :execrows
UPDATE planner_people
SET deleted_at = now(), updated_at = now()
WHERE user_id = $1 AND deleted_at IS NULL;
