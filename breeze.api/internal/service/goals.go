package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Goal struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Description string
	IsCompleted bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type CreateGoalInput struct {
	UserID      uuid.UUID
	Description string
	IsCompleted bool
}

type UpdateGoalInput struct {
	ID          uuid.UUID
	Description string
	IsCompleted bool
}

type goalQuerier interface {
	CreateGoal(ctx context.Context, arg sqlc.CreateGoalParams) (sqlc.Goal, error)
	GetGoalByID(ctx context.Context, id uuid.UUID) (sqlc.Goal, error)
	ListGoalsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Goal, error)
	UpdateGoal(ctx context.Context, arg sqlc.UpdateGoalParams) (sqlc.Goal, error)
	SoftDeleteGoal(ctx context.Context, id uuid.UUID) (int64, error)
}

type GoalService struct {
	queries goalQuerier
}

func NewGoalService(queries goalQuerier) *GoalService {
	return &GoalService{queries: queries}
}

func (s *GoalService) Create(ctx context.Context, input CreateGoalInput) (*Goal, error) {
	row, err := s.queries.CreateGoal(ctx, sqlc.CreateGoalParams{
		UserID:      input.UserID,
		Description: input.Description,
		IsCompleted: input.IsCompleted,
	})
	if err != nil {
		return nil, fmt.Errorf("create goal: %w", err)
	}

	goal := mapGoalRecord(row)
	return &goal, nil
}

func (s *GoalService) GetByID(ctx context.Context, id uuid.UUID) (*Goal, error) {
	row, err := s.queries.GetGoalByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get goal by id: %w", err)
	}

	goal := mapGoalRecord(row)
	return &goal, nil
}

func (s *GoalService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]Goal, error) {
	rows, err := s.queries.ListGoalsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list goals by user id: %w", err)
	}

	goals := make([]Goal, 0, len(rows))
	for _, row := range rows {
		goals = append(goals, mapGoalRecord(row))
	}

	return goals, nil
}

func (s *GoalService) Update(ctx context.Context, input UpdateGoalInput) (*Goal, error) {
	row, err := s.queries.UpdateGoal(ctx, sqlc.UpdateGoalParams{
		ID:          input.ID,
		Description: input.Description,
		IsCompleted: input.IsCompleted,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update goal: %w", err)
	}

	goal := mapGoalRecord(row)
	return &goal, nil
}

func (s *GoalService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteGoal(ctx, id)
	if err != nil {
		return fmt.Errorf("delete goal: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapGoalRecord(row sqlc.Goal) Goal {
	return Goal{
		ID:          row.ID,
		UserID:      row.UserID,
		Description: row.Description,
		IsCompleted: row.IsCompleted,
		CreatedAt:   timestamptzToTime(row.CreatedAt),
		UpdatedAt:   timestamptzToTime(row.UpdatedAt),
	}
}
