-- name: UpsertPlannerPerson :one
INSERT INTO planner_people (id, user_id, person_type, name, birthday, retirement_age, annual_salary, bonus_mode, annual_bonus, income_growth_rate)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (id) DO UPDATE
SET person_type = EXCLUDED.person_type,
    name = EXCLUDED.name,
    birthday = EXCLUDED.birthday,
    retirement_age = EXCLUDED.retirement_age,
    annual_salary = EXCLUDED.annual_salary,
    bonus_mode = EXCLUDED.bonus_mode,
    annual_bonus = EXCLUDED.annual_bonus,
    income_growth_rate = EXCLUDED.income_growth_rate,
    updated_at = now()
RETURNING id, user_id, person_type, name, birthday, retirement_age, annual_salary, bonus_mode, annual_bonus, income_growth_rate, created_at, updated_at, deleted_at;

-- name: ListPlannerPeopleByUserID :many
SELECT id, user_id, person_type, name, birthday, retirement_age, annual_salary, bonus_mode, annual_bonus, income_growth_rate, created_at, updated_at, deleted_at
FROM planner_people
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at ASC;

-- name: SoftDeletePlannerPerson :execrows
UPDATE planner_people
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL;

-- name: SoftDeletePlannerPeopleByUserID :execrows
UPDATE planner_people
SET deleted_at = now(), updated_at = now()
WHERE user_id = $1 AND deleted_at IS NULL;
