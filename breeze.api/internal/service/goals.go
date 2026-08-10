package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type Goal struct {
	ID                   uuid.UUID
	UserID               uuid.UUID
	Description          string
	IsCompleted          bool
	TargetAmount         *decimal.Decimal
	TargetDate           *time.Time
	Category             *string
	CustomCategory       *string
	Priority             int32
	Notes                *string
	ConnectedAccountIDs  []uuid.UUID
	IsFinancialOrderStep bool
	FinancialOrderStep   *int32
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type CreateGoalInput struct {
	UserID               uuid.UUID
	Description          string
	IsCompleted          bool
	TargetAmount         *decimal.Decimal
	TargetDate           *time.Time
	Category             *string
	CustomCategory       *string
	Priority             int32
	Notes                *string
	ConnectedAccountIDs  []uuid.UUID
	IsFinancialOrderStep bool
	FinancialOrderStep   *int32
}

type UpdateGoalInput struct {
	ID                   uuid.UUID
	Description          string
	IsCompleted          bool
	TargetAmount         *decimal.Decimal
	TargetDate           *time.Time
	Category             *string
	CustomCategory       *string
	Priority             int32
	Notes                *string
	ConnectedAccountIDs  []uuid.UUID
	IsFinancialOrderStep bool
	FinancialOrderStep   *int32
}

type goalQuerier interface {
	CreateGoal(ctx context.Context, arg sqlc.CreateGoalParams) (sqlc.CreateGoalRow, error)
	GetGoalByID(ctx context.Context, id uuid.UUID) (sqlc.GetGoalByIDRow, error)
	ListGoalsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListGoalsByUserIDRow, error)
	UpdateGoal(ctx context.Context, arg sqlc.UpdateGoalParams) (sqlc.UpdateGoalRow, error)
	SoftDeleteGoal(ctx context.Context, id uuid.UUID) (int64, error)
	ListFinancialOrderStepsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListFinancialOrderStepsByUserIDRow, error)
	CreateFinancialOrderSteps(ctx context.Context, userID uuid.UUID) ([]sqlc.CreateFinancialOrderStepsRow, error)
}

type GoalService struct {
	queries goalQuerier
}

func NewGoalService(queries goalQuerier) *GoalService {
	return &GoalService{queries: queries}
}

func (s *GoalService) Create(ctx context.Context, input CreateGoalInput) (*Goal, error) {
	targetAmount, err := decimalToPGNumeric(input.TargetAmount)
	if err != nil {
		return nil, fmt.Errorf("encode target amount: %w", err)
	}

	var targetDate pgtype.Date
	if input.TargetDate != nil {
		targetDate = pgtype.Date{Time: *input.TargetDate, Valid: true}
	}

	row, err := s.queries.CreateGoal(ctx, sqlc.CreateGoalParams{
		UserID:               input.UserID,
		Description:          input.Description,
		IsCompleted:          input.IsCompleted,
		TargetAmount:         targetAmount,
		TargetDate:           targetDate,
		Category:             input.Category,
		CustomCategory:       input.CustomCategory,
		Priority:             input.Priority,
		Notes:                input.Notes,
		ConnectedAccountIds:  input.ConnectedAccountIDs,
		IsFinancialOrderStep: input.IsFinancialOrderStep,
		FinancialOrderStep:   input.FinancialOrderStep,
	})
	if err != nil {
		return nil, fmt.Errorf("create goal: %w", err)
	}

	goal := mapGoalRecord(
		row.ID,
		row.UserID,
		row.Description,
		row.IsCompleted,
		row.TargetAmount,
		row.TargetDate,
		row.Category,
		row.CustomCategory,
		row.Priority,
		row.Notes,
		row.ConnectedAccountIds,
		row.IsFinancialOrderStep,
		row.FinancialOrderStep,
		row.CreatedAt,
		row.UpdatedAt,
	)
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

	goal := mapGoalRecord(
		row.ID,
		row.UserID,
		row.Description,
		row.IsCompleted,
		row.TargetAmount,
		row.TargetDate,
		row.Category,
		row.CustomCategory,
		row.Priority,
		row.Notes,
		row.ConnectedAccountIds,
		row.IsFinancialOrderStep,
		row.FinancialOrderStep,
		row.CreatedAt,
		row.UpdatedAt,
	)
	return &goal, nil
}

func (s *GoalService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]Goal, error) {
	rows, err := s.queries.ListGoalsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list goals by user id: %w", err)
	}

	goals := make([]Goal, 0, len(rows))
	for _, row := range rows {
		goal := mapGoalRecord(
			row.ID,
			row.UserID,
			row.Description,
			row.IsCompleted,
			row.TargetAmount,
			row.TargetDate,
			row.Category,
			row.CustomCategory,
			row.Priority,
			row.Notes,
			row.ConnectedAccountIds,
			row.IsFinancialOrderStep,
			row.FinancialOrderStep,
			row.CreatedAt,
			row.UpdatedAt,
		)
		goals = append(goals, goal)
	}

	return goals, nil
}

func (s *GoalService) Update(ctx context.Context, input UpdateGoalInput) (*Goal, error) {
	targetAmount, err := decimalToPGNumeric(input.TargetAmount)
	if err != nil {
		return nil, fmt.Errorf("encode target amount: %w", err)
	}

	var targetDate pgtype.Date
	if input.TargetDate != nil {
		targetDate = pgtype.Date{Time: *input.TargetDate, Valid: true}
	}

	row, err := s.queries.UpdateGoal(ctx, sqlc.UpdateGoalParams{
		ID:                   input.ID,
		Description:          input.Description,
		IsCompleted:          input.IsCompleted,
		TargetAmount:         targetAmount,
		TargetDate:           targetDate,
		Category:             input.Category,
		CustomCategory:       input.CustomCategory,
		Priority:             input.Priority,
		Notes:                input.Notes,
		ConnectedAccountIds:  input.ConnectedAccountIDs,
		IsFinancialOrderStep: input.IsFinancialOrderStep,
		FinancialOrderStep:   input.FinancialOrderStep,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update goal: %w", err)
	}

	goal := mapGoalRecord(
		row.ID,
		row.UserID,
		row.Description,
		row.IsCompleted,
		row.TargetAmount,
		row.TargetDate,
		row.Category,
		row.CustomCategory,
		row.Priority,
		row.Notes,
		row.ConnectedAccountIds,
		row.IsFinancialOrderStep,
		row.FinancialOrderStep,
		row.CreatedAt,
		row.UpdatedAt,
	)
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

func (s *GoalService) ListFinancialOrderSteps(ctx context.Context, userID uuid.UUID) ([]Goal, error) {
	rows, err := s.queries.ListFinancialOrderStepsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list financial order steps: %w", err)
	}

	goals := make([]Goal, 0, len(rows))
	for _, row := range rows {
		goal := mapGoalRecord(
			row.ID,
			row.UserID,
			row.Description,
			row.IsCompleted,
			row.TargetAmount,
			row.TargetDate,
			row.Category,
			row.CustomCategory,
			row.Priority,
			row.Notes,
			row.ConnectedAccountIds,
			row.IsFinancialOrderStep,
			row.FinancialOrderStep,
			row.CreatedAt,
			row.UpdatedAt,
		)
		goals = append(goals, goal)
	}

	return goals, nil
}

func (s *GoalService) CreateFinancialOrderSteps(ctx context.Context, userID uuid.UUID) ([]Goal, error) {
	rows, err := s.queries.CreateFinancialOrderSteps(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("create financial order steps: %w", err)
	}

	goals := make([]Goal, 0, len(rows))
	for _, row := range rows {
		goal := mapGoalRecord(
			row.ID,
			row.UserID,
			row.Description,
			row.IsCompleted,
			row.TargetAmount,
			row.TargetDate,
			row.Category,
			row.CustomCategory,
			row.Priority,
			row.Notes,
			row.ConnectedAccountIds,
			row.IsFinancialOrderStep,
			row.FinancialOrderStep,
			row.CreatedAt,
			row.UpdatedAt,
		)
		goals = append(goals, goal)
	}

	return goals, nil
}

func mapGoalRecord(
	id uuid.UUID,
	userID uuid.UUID,
	description string,
	isCompleted bool,
	targetAmount pgtype.Numeric,
	targetDate pgtype.Date,
	category *string,
	customCategory *string,
	priority int32,
	notes *string,
	connectedAccountIds []uuid.UUID,
	isFinancialOrderStep bool,
	financialOrderStep *int32,
	createdAt pgtype.Timestamptz,
	updatedAt pgtype.Timestamptz,
) Goal {
	targetAmountValue, _ := decimalFromPGNumeric(targetAmount)

	var targetDateValue *time.Time
	if targetDate.Valid {
		t := targetDate.Time
		targetDateValue = &t
	}

	return Goal{
		ID:                   id,
		UserID:               userID,
		Description:          description,
		IsCompleted:          isCompleted,
		TargetAmount:         targetAmountValue,
		TargetDate:           targetDateValue,
		Category:             category,
		CustomCategory:       customCategory,
		Priority:             priority,
		Notes:                notes,
		ConnectedAccountIDs:  connectedAccountIds,
		IsFinancialOrderStep: isFinancialOrderStep,
		FinancialOrderStep:   financialOrderStep,
		CreatedAt:            timestamptzToTime(createdAt),
		UpdatedAt:            timestamptzToTime(updatedAt),
	}
}
