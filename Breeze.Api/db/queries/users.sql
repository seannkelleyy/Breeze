-- name: CreateUser :one
INSERT INTO users (email)
VALUES ($1)
RETURNING id, email, created_at, updated_at, deleted_at;

-- name: GetUserByID :one
SELECT id, email, created_at, updated_at, deleted_at
FROM users
WHERE id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: ListUsers :many
SELECT id, email, created_at, updated_at, deleted_at
FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- name: SoftDeleteUser :exec
UPDATE users
SET deleted_at = now(),
    updated_at = now()
WHERE id = $1
  AND deleted_at IS NULL;
