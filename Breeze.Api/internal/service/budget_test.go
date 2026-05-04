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

type mockBudgetQuerier struct {
	createBudgetFunc     func(context.Context, sqlc.CreateBudgetParams) (sqlc.Budget, error)
	getBudgetByIDFunc    func(context.Context, uuid.UUID) (sqlc.Budget, error)
	getBudgetByDateFunc  func(context.Context, sqlc.GetBudgetByDateParams) (sqlc.Budget, error)
	listBudgetsFunc      func(context.Context, uuid.UUID) ([]sqlc.Budget, error)
	updateBudgetFunc     func(context.Context, sqlc.UpdateBudgetParams) (sqlc.Budget, error)
	softDeleteBudgetFunc func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockBudgetQuerier) CreateBudget(ctx context.Context, arg sqlc.CreateBudgetParams) (sqlc.Budget, error) {
	if m.createBudgetFunc != nil {
		return m.createBudgetFunc(ctx, arg)
	}
	return sqlc.Budget{}, nil
}

func (m *mockBudgetQuerier) GetBudgetByID(ctx context.Context, id uuid.UUID) (sqlc.Budget, error) {
	if m.getBudgetByIDFunc != nil {
		return m.getBudgetByIDFunc(ctx, id)
	}
	return sqlc.Budget{}, nil
}

func (m *mockBudgetQuerier) GetBudgetByDate(ctx context.Context, arg sqlc.GetBudgetByDateParams) (sqlc.Budget, error) {
	if m.getBudgetByDateFunc != nil {
		return m.getBudgetByDateFunc(ctx, arg)
	}
	return sqlc.Budget{}, nil
}

func (m *mockBudgetQuerier) ListBudgetsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Budget, error) {
	if m.listBudgetsFunc != nil {
		return m.listBudgetsFunc(ctx, userID)
	}
	return []sqlc.Budget{}, nil
}

func (m *mockBudgetQuerier) UpdateBudget(ctx context.Context, arg sqlc.UpdateBudgetParams) (sqlc.Budget, error) {
	if m.updateBudgetFunc != nil {
		return m.updateBudgetFunc(ctx, arg)
	}
	return sqlc.Budget{}, nil
}

func (m *mockBudgetQuerier) SoftDeleteBudget(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteBudgetFunc != nil {
		return m.softDeleteBudgetFunc(ctx, id)
	}
	return 0, nil
}

func testBudgetRow() sqlc.Budget {
	monthlyIncome, _ := decimal.Parse("12000.00")
	monthlyExpenses, _ := decimal.Parse("8000.00")
	budgetDate := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.Budget{
		ID:              uuid.New(),
		UserID:          uuid.New(),
		Date:            budgetDate,
		MonthlyIncome:   monthlyIncome,
		MonthlyExpenses: monthlyExpenses,
		CreatedAt:       timestamp,
		UpdatedAt:       timestamp,
		DeletedAt:       pgtype.Timestamptz{},
	}
}

func TestBudgetService_Create(t *testing.T) {
	ctx := context.Background()
	row := testBudgetRow()

	mock := &mockBudgetQuerier{
		createBudgetFunc: func(ctx context.Context, arg sqlc.CreateBudgetParams) (sqlc.Budget, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.MonthlyIncome, arg.MonthlyIncome)
			assert.Equal(t, row.Date.Time, arg.Date.Time)
			return row, nil
		},
	}

	svc := NewBudgetService(mock)
	result, err := svc.Create(ctx, CreateBudgetInput{
		UserID:          row.UserID,
		Date:            row.Date.Time,
		MonthlyIncome:   row.MonthlyIncome,
		MonthlyExpenses: row.MonthlyExpenses,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestBudgetService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testBudgetRow()

	t.Run("retrieves by id", func(t *testing.T) {
		mock := &mockBudgetQuerier{
			getBudgetByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Budget, error) {
				assert.Equal(t, row.ID, id)
				return row, nil
			},
		}

		svc := NewBudgetService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockBudgetQuerier{
			getBudgetByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Budget, error) {
				return sqlc.Budget{}, pgx.ErrNoRows
			},
		}

		svc := NewBudgetService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestBudgetService_GetByDate(t *testing.T) {
	ctx := context.Background()
	row := testBudgetRow()

	t.Run("retrieves by date", func(t *testing.T) {
		mock := &mockBudgetQuerier{
			getBudgetByDateFunc: func(ctx context.Context, arg sqlc.GetBudgetByDateParams) (sqlc.Budget, error) {
				assert.Equal(t, row.UserID, arg.UserID)
				assert.Equal(t, row.Date.Time, arg.Date.Time)
				return row, nil
			},
		}

		svc := NewBudgetService(mock)
		result, err := svc.GetByDate(ctx, row.UserID, row.Date.Time)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockBudgetQuerier{
			getBudgetByDateFunc: func(ctx context.Context, arg sqlc.GetBudgetByDateParams) (sqlc.Budget, error) {
				return sqlc.Budget{}, pgx.ErrNoRows
			},
		}

		svc := NewBudgetService(mock)
		result, err := svc.GetByDate(ctx, row.UserID, row.Date.Time)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestBudgetService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	row1 := testBudgetRow()
	row2 := testBudgetRow()
	row2.ID = uuid.New()

	mock := &mockBudgetQuerier{
		listBudgetsFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.Budget, error) {
			assert.Equal(t, row1.UserID, userID)
			return []sqlc.Budget{row1, row2}, nil
		},
	}

	svc := NewBudgetService(mock)
	result, err := svc.ListByUserID(ctx, row1.UserID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestBudgetService_Update(t *testing.T) {
	ctx := context.Background()
	row := testBudgetRow()
	updatedExpenses, _ := decimal.Parse("8500.00")

	mock := &mockBudgetQuerier{
		updateBudgetFunc: func(ctx context.Context, arg sqlc.UpdateBudgetParams) (sqlc.Budget, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedExpenses, arg.MonthlyExpenses)
			updated := row
			updated.MonthlyExpenses = updatedExpenses
			return updated, nil
		},
	}

	svc := NewBudgetService(mock)
	result, err := svc.Update(ctx, UpdateBudgetInput{
		ID:              row.ID,
		MonthlyIncome:   row.MonthlyIncome,
		MonthlyExpenses: updatedExpenses,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedExpenses, result.MonthlyExpenses)
}

func TestBudgetService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testBudgetRow()

	t.Run("deletes budget", func(t *testing.T) {
		mock := &mockBudgetQuerier{
			softDeleteBudgetFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				assert.Equal(t, row.ID, id)
				return 1, nil
			},
		}

		svc := NewBudgetService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.NoError(t, err)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockBudgetQuerier{
			softDeleteBudgetFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, nil
			},
		}

		svc := NewBudgetService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.ErrorIs(t, err, ErrNotFound)
	})
}
