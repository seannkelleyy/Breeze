-- name: CreateGoal :one
INSERT INTO goals (
  user_id,
  description,
  is_completed
) VALUES ($1, $2, $3)
RETURNING
  id,
  user_id,
  description,
  is_completed,
  created_at,
  updated_at,
  deleted_at;

-- name: GetGoalByID :one
SELECT
  id,
  user_id,
  description,
  is_completed,
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
  created_at,
  updated_at,
  deleted_at
FROM goals
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY is_completed ASC, created_at DESC;

-- name: UpdateGoal :one
UPDATE goals
SET
  description = $2,
  is_completed = $3,
  updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
  id,
  user_id,
  description,
  is_completed,
  created_at,
  updated_at,
  deleted_at;

-- name: SoftDeleteGoal :execrows
UPDATE goals
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
