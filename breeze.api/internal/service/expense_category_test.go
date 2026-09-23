package service

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

type mockExpenseCategoryQuerier struct {
	createExpenseCategoryFunc                 func(context.Context, sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error)
	listExpenseCategoriesFunc                 func(context.Context, uuid.UUID) ([]sqlc.ExpenseCategory, error)
	updateExpenseCategoryFunc                 func(context.Context, sqlc.UpdateExpenseCategoryParams) (sqlc.ExpenseCategory, error)
	softDeleteExpenseCategoryFunc             func(context.Context, sqlc.SoftDeleteExpenseCategoryParams) (int64, error)
	softDeleteGeneratedCategoriesByBudgetFunc func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockExpenseCategoryQuerier) CreateExpenseCategory(ctx context.Context, arg sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
	if m.createExpenseCategoryFunc != nil {
		return m.createExpenseCategoryFunc(ctx, arg)
	}
	return sqlc.ExpenseCategory{}, nil
}

func (m *mockExpenseCategoryQuerier) ListExpenseCategoriesByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.ExpenseCategory, error) {
	if m.listExpenseCategoriesFunc != nil {
		return m.listExpenseCategoriesFunc(ctx, budgetID)
	}
	return []sqlc.ExpenseCategory{}, nil
}

func (m *mockExpenseCategoryQuerier) UpdateExpenseCategory(ctx context.Context, arg sqlc.UpdateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
	if m.updateExpenseCategoryFunc != nil {
		return m.updateExpenseCategoryFunc(ctx, arg)
	}
	return sqlc.ExpenseCategory{}, nil
}

func (m *mockExpenseCategoryQuerier) SoftDeleteExpenseCategory(ctx context.Context, arg sqlc.SoftDeleteExpenseCategoryParams) (int64, error) {
	if m.softDeleteExpenseCategoryFunc != nil {
		return m.softDeleteExpenseCategoryFunc(ctx, arg)
	}
	return 0, nil
}

func (m *mockExpenseCategoryQuerier) SoftDeleteGeneratedCategoriesByBudget(ctx context.Context, budgetID uuid.UUID) (int64, error) {
	if m.softDeleteGeneratedCategoriesByBudgetFunc != nil {
		return m.softDeleteGeneratedCategoriesByBudgetFunc(ctx, budgetID)
	}
	return 0, nil
}

func testCreateExpenseCategoryRow() sqlc.ExpenseCategory {
	allocation, _ := decimal.Parse("850.00")
	currentSpend, _ := decimal.Parse("0")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.ExpenseCategory{
		ID:               uuid.New(),
		UserID:           uuid.New(),
		BudgetID:         uuid.New(),
		Name:             "Housing",
		Allocation:       allocation,
		CurrentSpend:     currentSpend,
		SourceType:       sqlc.ExpenseSourceTypeMANUAL,
		SourceTemplateID: pgtype.UUID{},
		GenerationMonth:  pgtype.Date{},
		CreatedAt:        timestamp,
		UpdatedAt:        timestamp,
		DeletedAt:        pgtype.Timestamptz{},
	}
}

func TestExpenseCategoryService_Create(t *testing.T) {
	ctx := context.Background()
	cat := testCreateExpenseCategoryRow()

	mock := &mockExpenseCategoryQuerier{
		createExpenseCategoryFunc: func(_ context.Context, _ sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
			return cat, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	result, err := svc.Create(ctx, &CreateExpenseCategoryInput{
		UserID:       cat.UserID,
		BudgetID:     cat.BudgetID,
		Name:         cat.Name,
		Allocation:   cat.Allocation,
		CurrentSpend: cat.CurrentSpend,
		SourceType:   sqlc.ExpenseSourceTypeMANUAL,
	})
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, cat.Name, result.Name)
}

func TestExpenseCategoryService_ListByBudgetID(t *testing.T) {
	ctx := context.Background()
	budgetID := uuid.New()
	allocation, _ := decimal.Parse("500.00")
	currentSpend, _ := decimal.Parse("0")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	mock := &mockExpenseCategoryQuerier{
		listExpenseCategoriesFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.ExpenseCategory, error) {
			return []sqlc.ExpenseCategory{
				{
					ID:               uuid.New(),
					UserID:           uuid.New(),
					BudgetID:         budgetID,
					Name:             "Food",
					Allocation:       allocation,
					CurrentSpend:     currentSpend,
					SourceType:       sqlc.ExpenseSourceTypeMANUAL,
					SourceTemplateID: pgtype.UUID{},
					GenerationMonth:  pgtype.Date{},
					CreatedAt:        timestamp,
					UpdatedAt:        timestamp,
					DeletedAt:        pgtype.Timestamptz{},
				},
			}, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	categories, err := svc.ListByBudgetID(ctx, budgetID)
	assert.NoError(t, err)
	assert.Len(t, categories, 1)
	assert.Equal(t, "Food", categories[0].Name)
}

func TestExpenseCategoryService_Update(t *testing.T) {
	ctx := context.Background()
	cat := testCreateExpenseCategoryRow()
	allocation, _ := decimal.Parse("900.00")
	currentSpend, _ := decimal.Parse("0")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	mock := &mockExpenseCategoryQuerier{
		updateExpenseCategoryFunc: func(_ context.Context, _ sqlc.UpdateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
			return sqlc.ExpenseCategory{
				ID:               cat.ID,
				UserID:           cat.UserID,
				BudgetID:         cat.BudgetID,
				Name:             "Updated Housing",
				Allocation:       allocation,
				CurrentSpend:     currentSpend,
				SourceType:       sqlc.ExpenseSourceTypeMANUAL,
				SourceTemplateID: pgtype.UUID{},
				GenerationMonth:  pgtype.Date{},
				CreatedAt:        timestamp,
				UpdatedAt:        timestamp,
				DeletedAt:        pgtype.Timestamptz{},
			}, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	userID := uuid.New()
	result, err := svc.Update(ctx, userID, &UpdateExpenseCategoryInput{
		ID:           cat.ID,
		Name:         "Updated Housing",
		Allocation:   allocation,
		CurrentSpend: currentSpend,
	})
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Updated Housing", result.Name)
}

func TestExpenseCategoryService_Update_NotFound(t *testing.T) {
	ctx := context.Background()
	allocation, _ := decimal.Parse("500.00")
	currentSpend, _ := decimal.Parse("0")

	mock := &mockExpenseCategoryQuerier{
		updateExpenseCategoryFunc: func(_ context.Context, _ sqlc.UpdateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
			return sqlc.ExpenseCategory{}, pgx.ErrNoRows
		},
	}

	svc := NewExpenseCategoryService(mock)
	_, err := svc.Update(ctx, uuid.New(), &UpdateExpenseCategoryInput{
		ID:           uuid.New(),
		Name:         "test",
		Allocation:   allocation,
		CurrentSpend: currentSpend,
	})
	assert.ErrorIs(t, err, ErrNotFound)
}

func TestExpenseCategoryService_Delete(t *testing.T) {
	ctx := context.Background()

	mock := &mockExpenseCategoryQuerier{
		softDeleteExpenseCategoryFunc: func(_ context.Context, arg sqlc.SoftDeleteExpenseCategoryParams) (int64, error) {
			return 1, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	err := svc.Delete(ctx, uuid.New(), uuid.New())
	assert.NoError(t, err)
}

func TestExpenseCategoryService_Delete_NotFound(t *testing.T) {
	ctx := context.Background()

	mock := &mockExpenseCategoryQuerier{
		softDeleteExpenseCategoryFunc: func(_ context.Context, arg sqlc.SoftDeleteExpenseCategoryParams) (int64, error) {
			return 0, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	err := svc.Delete(ctx, uuid.New(), uuid.New())
	assert.ErrorIs(t, err, ErrNotFound)
}
