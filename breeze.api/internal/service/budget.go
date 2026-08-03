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

type Budget struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	Date            time.Time
	MonthlyIncome   decimal.Decimal
	MonthlyExpenses decimal.Decimal
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type CreateBudgetInput struct {
	UserID          uuid.UUID
	Date            time.Time
	MonthlyIncome   decimal.Decimal
	MonthlyExpenses decimal.Decimal
}

type UpdateBudgetInput struct {
	ID              uuid.UUID
	MonthlyIncome   decimal.Decimal
	MonthlyExpenses decimal.Decimal
}

type budgetQuerier interface {
	CreateBudget(ctx context.Context, arg sqlc.CreateBudgetParams) (sqlc.Budget, error)
	GetBudgetByID(ctx context.Context, id uuid.UUID) (sqlc.Budget, error)
	GetBudgetByDate(ctx context.Context, arg sqlc.GetBudgetByDateParams) (sqlc.Budget, error)
	ListBudgetsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Budget, error)
	UpdateBudget(ctx context.Context, arg sqlc.UpdateBudgetParams) (sqlc.Budget, error)
	SoftDeleteBudget(ctx context.Context, id uuid.UUID) (int64, error)
}

type BudgetService struct {
	queries budgetQuerier
}

func NewBudgetService(queries budgetQuerier) *BudgetService {
	return &BudgetService{queries: queries}
}

func (s *BudgetService) Create(ctx context.Context, input CreateBudgetInput) (*Budget, error) {
	row, err := s.queries.CreateBudget(ctx, sqlc.CreateBudgetParams{
		UserID:          input.UserID,
		Date:            pgtype.Date{Time: input.Date, Valid: true},
		MonthlyIncome:   input.MonthlyIncome,
		MonthlyExpenses: input.MonthlyExpenses,
	})
	if err != nil {
		return nil, fmt.Errorf("create budget: %w", err)
	}

	budget := mapBudgetRecord(row)
	return &budget, nil
}

func (s *BudgetService) GetByID(ctx context.Context, id uuid.UUID) (*Budget, error) {
	row, err := s.queries.GetBudgetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get budget by id: %w", err)
	}

	budget := mapBudgetRecord(row)
	return &budget, nil
}

func (s *BudgetService) GetByDate(ctx context.Context, userID uuid.UUID, date time.Time) (*Budget, error) {
	row, err := s.queries.GetBudgetByDate(ctx, sqlc.GetBudgetByDateParams{
		UserID: userID,
		Date:   pgtype.Date{Time: date, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get budget by date: %w", err)
	}

	budget := mapBudgetRecord(row)
	return &budget, nil
}

func (s *BudgetService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]Budget, error) {
	rows, err := s.queries.ListBudgetsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list budgets by user id: %w", err)
	}

	budgets := make([]Budget, 0, len(rows))
	for _, row := range rows {
		budgets = append(budgets, mapBudgetRecord(row))
	}

	return budgets, nil
}

func (s *BudgetService) Update(ctx context.Context, input UpdateBudgetInput) (*Budget, error) {
	row, err := s.queries.UpdateBudget(ctx, sqlc.UpdateBudgetParams{
		ID:              input.ID,
		MonthlyIncome:   input.MonthlyIncome,
		MonthlyExpenses: input.MonthlyExpenses,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update budget: %w", err)
	}

	budget := mapBudgetRecord(row)
	return &budget, nil
}

func (s *BudgetService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteBudget(ctx, id)
	if err != nil {
		return fmt.Errorf("delete budget: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapBudgetRecord(row sqlc.Budget) Budget {
	return Budget{
		ID:              row.ID,
		UserID:          row.UserID,
		Date:            row.Date.Time,
		MonthlyIncome:   row.MonthlyIncome,
		MonthlyExpenses: row.MonthlyExpenses,
		CreatedAt:       timestamptzToTime(row.CreatedAt),
		UpdatedAt:       timestamptzToTime(row.UpdatedAt),
	}
}
