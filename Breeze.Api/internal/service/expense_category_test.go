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
	createExpenseCategoryFunc     func(context.Context, sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error)
	getExpenseCategoryByIDFunc    func(context.Context, uuid.UUID) (sqlc.ExpenseCategory, error)
	listExpenseCategoriesFunc     func(context.Context, uuid.UUID) ([]sqlc.ExpenseCategory, error)
	updateExpenseCategoryFunc     func(context.Context, sqlc.UpdateExpenseCategoryParams) (sqlc.ExpenseCategory, error)
	softDeleteExpenseCategoryFunc func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockExpenseCategoryQuerier) CreateExpenseCategory(ctx context.Context, arg sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
	if m.createExpenseCategoryFunc != nil {
		return m.createExpenseCategoryFunc(ctx, arg)
	}
	return sqlc.ExpenseCategory{}, nil
}

func (m *mockExpenseCategoryQuerier) GetExpenseCategoryByID(ctx context.Context, id uuid.UUID) (sqlc.ExpenseCategory, error) {
	if m.getExpenseCategoryByIDFunc != nil {
		return m.getExpenseCategoryByIDFunc(ctx, id)
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

func (m *mockExpenseCategoryQuerier) SoftDeleteExpenseCategory(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteExpenseCategoryFunc != nil {
		return m.softDeleteExpenseCategoryFunc(ctx, id)
	}
	return 0, nil
}

func testExpenseCategoryRow() sqlc.ExpenseCategory {
	allocation, _ := decimal.Parse("850.00")
	currentSpend, _ := decimal.Parse("120.00")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.ExpenseCategory{
		ID:           uuid.New(),
		UserID:       uuid.New(),
		BudgetID:     uuid.New(),
		Name:         "Groceries",
		Allocation:   allocation,
		CurrentSpend: currentSpend,
		CreatedAt:    timestamp,
		UpdatedAt:    timestamp,
		DeletedAt:    pgtype.Timestamptz{},
	}
}

func TestExpenseCategoryService_Create(t *testing.T) {
	ctx := context.Background()
	row := testExpenseCategoryRow()

	mock := &mockExpenseCategoryQuerier{
		createExpenseCategoryFunc: func(ctx context.Context, arg sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.BudgetID, arg.BudgetID)
			assert.Equal(t, row.Name, arg.Name)
			return row, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	result, err := svc.Create(ctx, CreateExpenseCategoryInput{
		UserID:       row.UserID,
		BudgetID:     row.BudgetID,
		Name:         row.Name,
		Allocation:   row.Allocation,
		CurrentSpend: row.CurrentSpend,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestExpenseCategoryService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testExpenseCategoryRow()

	t.Run("retrieves by id", func(t *testing.T) {
		mock := &mockExpenseCategoryQuerier{
			getExpenseCategoryByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.ExpenseCategory, error) {
				assert.Equal(t, row.ID, id)
				return row, nil
			},
		}

		svc := NewExpenseCategoryService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockExpenseCategoryQuerier{
			getExpenseCategoryByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.ExpenseCategory, error) {
				return sqlc.ExpenseCategory{}, pgx.ErrNoRows
			},
		}

		svc := NewExpenseCategoryService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestExpenseCategoryService_ListByBudgetID(t *testing.T) {
	ctx := context.Background()
	row1 := testExpenseCategoryRow()
	row2 := testExpenseCategoryRow()
	row2.ID = uuid.New()
	row2.Name = "Dining"

	mock := &mockExpenseCategoryQuerier{
		listExpenseCategoriesFunc: func(ctx context.Context, budgetID uuid.UUID) ([]sqlc.ExpenseCategory, error) {
			assert.Equal(t, row1.BudgetID, budgetID)
			return []sqlc.ExpenseCategory{row1, row2}, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	result, err := svc.ListByBudgetID(ctx, row1.BudgetID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestExpenseCategoryService_Update(t *testing.T) {
	ctx := context.Background()
	row := testExpenseCategoryRow()
	updatedAllocation, _ := decimal.Parse("900.00")

	mock := &mockExpenseCategoryQuerier{
		updateExpenseCategoryFunc: func(ctx context.Context, arg sqlc.UpdateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedAllocation, arg.Allocation)
			updated := row
			updated.Allocation = arg.Allocation
			updated.CurrentSpend = arg.CurrentSpend
			return updated, nil
		},
	}

	svc := NewExpenseCategoryService(mock)
	result, err := svc.Update(ctx, UpdateExpenseCategoryInput{
		ID:           row.ID,
		Name:         row.Name,
		Allocation:   updatedAllocation,
		CurrentSpend: row.CurrentSpend,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedAllocation, result.Allocation)
}

func TestExpenseCategoryService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testExpenseCategoryRow()

	t.Run("deletes category", func(t *testing.T) {
		mock := &mockExpenseCategoryQuerier{
			softDeleteExpenseCategoryFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				assert.Equal(t, row.ID, id)
				return 1, nil
			},
		}

		svc := NewExpenseCategoryService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.NoError(t, err)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockExpenseCategoryQuerier{
			softDeleteExpenseCategoryFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, nil
			},
		}

		svc := NewExpenseCategoryService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.ErrorIs(t, err, ErrNotFound)
	})
}
