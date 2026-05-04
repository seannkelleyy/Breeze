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
)

type ExpenseCategory struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	BudgetID     uuid.UUID
	Name         string
	Allocation   decimal.Decimal
	CurrentSpend decimal.Decimal
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type CreateExpenseCategoryInput struct {
	UserID       uuid.UUID
	BudgetID     uuid.UUID
	Name         string
	Allocation   decimal.Decimal
	CurrentSpend decimal.Decimal
}

type UpdateExpenseCategoryInput struct {
	ID           uuid.UUID
	Name         string
	Allocation   decimal.Decimal
	CurrentSpend decimal.Decimal
}

type expenseCategoryQuerier interface {
	CreateExpenseCategory(ctx context.Context, arg sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error)
	GetExpenseCategoryByID(ctx context.Context, id uuid.UUID) (sqlc.ExpenseCategory, error)
	ListExpenseCategoriesByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.ExpenseCategory, error)
	UpdateExpenseCategory(ctx context.Context, arg sqlc.UpdateExpenseCategoryParams) (sqlc.ExpenseCategory, error)
	SoftDeleteExpenseCategory(ctx context.Context, id uuid.UUID) (int64, error)
}

type ExpenseCategoryService struct {
	queries expenseCategoryQuerier
}

func NewExpenseCategoryService(queries expenseCategoryQuerier) *ExpenseCategoryService {
	return &ExpenseCategoryService{queries: queries}
}

func (s *ExpenseCategoryService) Create(ctx context.Context, input CreateExpenseCategoryInput) (*ExpenseCategory, error) {
	row, err := s.queries.CreateExpenseCategory(ctx, sqlc.CreateExpenseCategoryParams{
		UserID:       input.UserID,
		BudgetID:     input.BudgetID,
		Name:         input.Name,
		Allocation:   input.Allocation,
		CurrentSpend: input.CurrentSpend,
	})
	if err != nil {
		return nil, fmt.Errorf("create expense category: %w", err)
	}

	category := mapExpenseCategoryRecord(row)
	return &category, nil
}

func (s *ExpenseCategoryService) GetByID(ctx context.Context, id uuid.UUID) (*ExpenseCategory, error) {
	row, err := s.queries.GetExpenseCategoryByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get expense category by id: %w", err)
	}

	category := mapExpenseCategoryRecord(row)
	return &category, nil
}

func (s *ExpenseCategoryService) ListByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]ExpenseCategory, error) {
	rows, err := s.queries.ListExpenseCategoriesByBudgetID(ctx, budgetID)
	if err != nil {
		return nil, fmt.Errorf("list expense categories by budget id: %w", err)
	}

	categories := make([]ExpenseCategory, 0, len(rows))
	for _, row := range rows {
		categories = append(categories, mapExpenseCategoryRecord(row))
	}

	return categories, nil
}

func (s *ExpenseCategoryService) Update(ctx context.Context, input UpdateExpenseCategoryInput) (*ExpenseCategory, error) {
	row, err := s.queries.UpdateExpenseCategory(ctx, sqlc.UpdateExpenseCategoryParams{
		ID:           input.ID,
		Name:         input.Name,
		Allocation:   input.Allocation,
		CurrentSpend: input.CurrentSpend,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update expense category: %w", err)
	}

	category := mapExpenseCategoryRecord(row)
	return &category, nil
}

func (s *ExpenseCategoryService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteExpenseCategory(ctx, id)
	if err != nil {
		return fmt.Errorf("delete expense category: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapExpenseCategoryRecord(row sqlc.ExpenseCategory) ExpenseCategory {
	return ExpenseCategory{
		ID:           row.ID,
		UserID:       row.UserID,
		BudgetID:     row.BudgetID,
		Name:         row.Name,
		Allocation:   row.Allocation,
		CurrentSpend: row.CurrentSpend,
		CreatedAt:    timestamptzToTime(row.CreatedAt),
		UpdatedAt:    timestamptzToTime(row.UpdatedAt),
	}
}
