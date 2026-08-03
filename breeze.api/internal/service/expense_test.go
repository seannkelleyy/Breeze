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

type mockExpenseQuerier struct {
	createExpenseFunc                 func(context.Context, sqlc.CreateExpenseParams) (sqlc.CreateExpenseRow, error)
	getExpenseByIDFunc                func(context.Context, uuid.UUID) (sqlc.GetExpenseByIDRow, error)
	listExpensesByBudgetIDFunc        func(context.Context, uuid.UUID) ([]sqlc.ListExpensesByBudgetIDRow, error)
	updateExpenseFunc                 func(context.Context, sqlc.UpdateExpenseParams) (sqlc.UpdateExpenseRow, error)
	softDeleteExpenseFunc             func(context.Context, uuid.UUID) (int64, error)
	softDeleteGeneratedExpensesFunc   func(context.Context, uuid.UUID) (int64, error)
	createExpenseSplitFunc            func(context.Context, sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error)
	listExpenseSplitsByExpenseIDsFunc func(context.Context, []uuid.UUID) ([]sqlc.ExpenseSplit, error)
	softDeleteExpenseSplitsFunc       func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockExpenseQuerier) CreateExpense(ctx context.Context, arg sqlc.CreateExpenseParams) (sqlc.CreateExpenseRow, error) {
	if m.createExpenseFunc != nil {
		return m.createExpenseFunc(ctx, arg)
	}
	return sqlc.CreateExpenseRow{}, nil
}

func (m *mockExpenseQuerier) GetExpenseByID(ctx context.Context, id uuid.UUID) (sqlc.GetExpenseByIDRow, error) {
	if m.getExpenseByIDFunc != nil {
		return m.getExpenseByIDFunc(ctx, id)
	}
	return sqlc.GetExpenseByIDRow{}, nil
}

func (m *mockExpenseQuerier) ListExpensesByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.ListExpensesByBudgetIDRow, error) {
	if m.listExpensesByBudgetIDFunc != nil {
		return m.listExpensesByBudgetIDFunc(ctx, budgetID)
	}
	return []sqlc.ListExpensesByBudgetIDRow{}, nil
}

func (m *mockExpenseQuerier) UpdateExpense(ctx context.Context, arg sqlc.UpdateExpenseParams) (sqlc.UpdateExpenseRow, error) {
	if m.updateExpenseFunc != nil {
		return m.updateExpenseFunc(ctx, arg)
	}
	return sqlc.UpdateExpenseRow{}, nil
}

func (m *mockExpenseQuerier) SoftDeleteExpense(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteExpenseFunc != nil {
		return m.softDeleteExpenseFunc(ctx, id)
	}
	return 0, nil
}

func (m *mockExpenseQuerier) SoftDeleteGeneratedExpensesByBudget(ctx context.Context, budgetID uuid.UUID) (int64, error) {
	if m.softDeleteGeneratedExpensesFunc != nil {
		return m.softDeleteGeneratedExpensesFunc(ctx, budgetID)
	}
	return 0, nil
}

func (m *mockExpenseQuerier) CreateExpenseSplit(ctx context.Context, arg sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error) {
	if m.createExpenseSplitFunc != nil {
		return m.createExpenseSplitFunc(ctx, arg)
	}
	return sqlc.ExpenseSplit{}, nil
}

func (m *mockExpenseQuerier) ListExpenseSplitsByExpenseIDs(ctx context.Context, expenseIDs []uuid.UUID) ([]sqlc.ExpenseSplit, error) {
	if m.listExpenseSplitsByExpenseIDsFunc != nil {
		return m.listExpenseSplitsByExpenseIDsFunc(ctx, expenseIDs)
	}
	return []sqlc.ExpenseSplit{}, nil
}

func (m *mockExpenseQuerier) SoftDeleteExpenseSplitsByExpenseID(ctx context.Context, expenseID uuid.UUID) (int64, error) {
	if m.softDeleteExpenseSplitsFunc != nil {
		return m.softDeleteExpenseSplitsFunc(ctx, expenseID)
	}
	return 0, nil
}

func expenseTestService(mock *mockExpenseQuerier) *ExpenseService {
	runner := expenseTxRunnerFunc(func(ctx context.Context, fn func(q expenseQuerier) error) error {
		return fn(mock)
	})
	return newExpenseServiceWithRunner(mock, runner)
}

func testCreateExpenseRow() sqlc.CreateExpenseRow {
	amount, _ := decimal.Parse("250.00")
	date := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.CreateExpenseRow{
		ID:               uuid.New(),
		UserID:           uuid.New(),
		BudgetID:         uuid.New(),
		Amount:           amount,
		Date:             date,
		Description:      "Groceries",
		SourceType:       sqlc.ExpenseSourceTypeMANUAL,
		SourceTemplateID: pgtype.UUID{},
		GenerationMonth:  pgtype.Date{},
		CreatedAt:        timestamp,
		UpdatedAt:        timestamp,
		DeletedAt:        pgtype.Timestamptz{},
	}
}

func testExpenseSplitRow(expenseID uuid.UUID) sqlc.ExpenseSplit {
	amount, _ := decimal.Parse("250.00")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
	description := "Produce"

	return sqlc.ExpenseSplit{
		ID:          uuid.New(),
		ExpenseID:   expenseID,
		CategoryID:  uuid.New(),
		Amount:      amount,
		Description: &description,
		CreatedAt:   timestamp,
		UpdatedAt:   timestamp,
		DeletedAt:   pgtype.Timestamptz{},
	}
}

func TestExpenseService_Create_Validation(t *testing.T) {
	ctx := context.Background()
	expense := testCreateExpenseRow()

	svc := expenseTestService(&mockExpenseQuerier{})

	_, err := svc.Create(ctx, CreateExpenseInput{
		UserID:      expense.UserID,
		BudgetID:    expense.BudgetID,
		Amount:      expense.Amount,
		Date:        expense.Date.Time,
		Description: expense.Description,
		Splits:      nil,
	})
	assert.ErrorIs(t, err, ErrNoSplits)
}

func TestExpenseService_Create_SplitMismatch(t *testing.T) {
	ctx := context.Background()
	expense := testCreateExpenseRow()
	catID := uuid.New()
	badAmount, _ := decimal.Parse("999.99")

	svc := expenseTestService(&mockExpenseQuerier{})

	_, err := svc.Create(ctx, CreateExpenseInput{
		UserID:      expense.UserID,
		BudgetID:    expense.BudgetID,
		Amount:      expense.Amount,
		Date:        expense.Date.Time,
		Description: expense.Description,
		Splits: []ExpenseSplitInput{
			{CategoryID: catID, Amount: badAmount},
		},
	})
	assert.ErrorIs(t, err, ErrSplitMismatch)
}

func TestExpenseService_Create_Success(t *testing.T) {
	ctx := context.Background()
	expense := testCreateExpenseRow()
	split := testExpenseSplitRow(expense.ID)

	mock := &mockExpenseQuerier{
		createExpenseFunc: func(_ context.Context, _ sqlc.CreateExpenseParams) (sqlc.CreateExpenseRow, error) {
			return expense, nil
		},
		createExpenseSplitFunc: func(_ context.Context, _ sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error) {
			return split, nil
		},
	}

	svc := expenseTestService(mock)
	result, err := svc.Create(ctx, CreateExpenseInput{
		UserID:      expense.UserID,
		BudgetID:    expense.BudgetID,
		Amount:      expense.Amount,
		Date:        expense.Date.Time,
		Description: expense.Description,
		Splits: []ExpenseSplitInput{
			{CategoryID: split.CategoryID, Amount: split.Amount},
		},
	})
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Splits, 1)
}

func TestExpenseService_Update_NotFound(t *testing.T) {
	ctx := context.Background()
	catID := uuid.New()
	amount, _ := decimal.Parse("50.00")

	mock := &mockExpenseQuerier{
		updateExpenseFunc: func(_ context.Context, _ sqlc.UpdateExpenseParams) (sqlc.UpdateExpenseRow, error) {
			return sqlc.UpdateExpenseRow{}, pgx.ErrNoRows
		},
	}

	svc := expenseTestService(mock)
	_, err := svc.Update(ctx, UpdateExpenseInput{
		ID:          uuid.New(),
		Amount:      amount,
		Date:        time.Now(),
		Description: "test",
		Splits:      []ExpenseSplitInput{{CategoryID: catID, Amount: amount}},
	})
	assert.ErrorIs(t, err, ErrNotFound)
}

func TestExpenseService_Delete_NotFound(t *testing.T) {
	ctx := context.Background()

	mock := &mockExpenseQuerier{
		softDeleteExpenseFunc: func(_ context.Context, _ uuid.UUID) (int64, error) {
			return 0, nil
		},
	}

	svc := expenseTestService(mock)
	err := svc.Delete(ctx, uuid.New())
	assert.ErrorIs(t, err, ErrNotFound)
}
