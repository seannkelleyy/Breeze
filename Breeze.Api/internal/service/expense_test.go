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
	createExpenseFunc                 func(context.Context, sqlc.CreateExpenseParams) (sqlc.Expense, error)
	getExpenseByIDFunc                func(context.Context, uuid.UUID) (sqlc.Expense, error)
	listExpensesByBudgetIDFunc        func(context.Context, uuid.UUID) ([]sqlc.Expense, error)
	updateExpenseFunc                 func(context.Context, sqlc.UpdateExpenseParams) (sqlc.Expense, error)
	softDeleteExpenseFunc             func(context.Context, uuid.UUID) (int64, error)
	createExpenseSplitFunc            func(context.Context, sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error)
	listExpenseSplitsByExpenseIDsFunc func(context.Context, []uuid.UUID) ([]sqlc.ExpenseSplit, error)
	softDeleteExpenseSplitsFunc       func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockExpenseQuerier) CreateExpense(ctx context.Context, arg sqlc.CreateExpenseParams) (sqlc.Expense, error) {
	if m.createExpenseFunc != nil {
		return m.createExpenseFunc(ctx, arg)
	}
	return sqlc.Expense{}, nil
}

func (m *mockExpenseQuerier) GetExpenseByID(ctx context.Context, id uuid.UUID) (sqlc.Expense, error) {
	if m.getExpenseByIDFunc != nil {
		return m.getExpenseByIDFunc(ctx, id)
	}
	return sqlc.Expense{}, nil
}

func (m *mockExpenseQuerier) ListExpensesByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.Expense, error) {
	if m.listExpensesByBudgetIDFunc != nil {
		return m.listExpensesByBudgetIDFunc(ctx, budgetID)
	}
	return []sqlc.Expense{}, nil
}

func (m *mockExpenseQuerier) UpdateExpense(ctx context.Context, arg sqlc.UpdateExpenseParams) (sqlc.Expense, error) {
	if m.updateExpenseFunc != nil {
		return m.updateExpenseFunc(ctx, arg)
	}
	return sqlc.Expense{}, nil
}

func (m *mockExpenseQuerier) SoftDeleteExpense(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteExpenseFunc != nil {
		return m.softDeleteExpenseFunc(ctx, id)
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

func testExpenseRow() sqlc.Expense {
	amount, _ := decimal.Parse("250.00")
	date := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.Expense{
		ID:                uuid.New(),
		UserID:            uuid.New(),
		BudgetID:          uuid.New(),
		Amount:            amount,
		Date:              date,
		Description:       "Groceries",
		RecurringSourceID: pgtype.UUID{},
		CreatedAt:         timestamp,
		UpdatedAt:         timestamp,
		DeletedAt:         pgtype.Timestamptz{},
	}
}

func testExpenseSplitRow(expenseID uuid.UUID) sqlc.ExpenseSplit {
	amount, _ := decimal.Parse("100.00")
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
	expense := testExpenseRow()

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

	amount, _ := decimal.Parse("200.00")
	_, err = svc.Create(ctx, CreateExpenseInput{
		UserID:      expense.UserID,
		BudgetID:    expense.BudgetID,
		Amount:      expense.Amount,
		Date:        expense.Date.Time,
		Description: expense.Description,
		Splits: []ExpenseSplitInput{
			{CategoryID: uuid.New(), Amount: amount},
		},
	})
	assert.ErrorIs(t, err, ErrSplitMismatch)
}

func TestExpenseService_Create(t *testing.T) {
	ctx := context.Background()
	expense := testExpenseRow()
	split := testExpenseSplitRow(expense.ID)

	// Ensure split sums match total expense for successful Create test
	split.Amount = expense.Amount

	mock := &mockExpenseQuerier{
		createExpenseFunc: func(ctx context.Context, arg sqlc.CreateExpenseParams) (sqlc.Expense, error) {
			assert.Equal(t, expense.UserID, arg.UserID)
			assert.Equal(t, expense.BudgetID, arg.BudgetID)
			assert.Equal(t, expense.Amount, arg.Amount)
			return expense, nil
		},
		createExpenseSplitFunc: func(ctx context.Context, arg sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error) {
			assert.Equal(t, expense.ID, arg.ExpenseID)
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
	assert.Equal(t, expense.ID, result.ID)
	assert.Len(t, result.Splits, 1)
}

func TestExpenseService_Update_NotFound(t *testing.T) {
	ctx := context.Background()
	expense := testExpenseRow()

	mock := &mockExpenseQuerier{
		updateExpenseFunc: func(ctx context.Context, arg sqlc.UpdateExpenseParams) (sqlc.Expense, error) {
			return sqlc.Expense{}, pgx.ErrNoRows
		},
	}

	svc := expenseTestService(mock)
	_, err := svc.Update(ctx, UpdateExpenseInput{
		ID:          expense.ID,
		Amount:      expense.Amount,
		Date:        expense.Date.Time,
		Description: expense.Description,
		Splits: []ExpenseSplitInput{
			{CategoryID: uuid.New(), Amount: expense.Amount},
		},
	})

	assert.ErrorIs(t, err, ErrNotFound)
}

func TestExpenseService_Delete_NotFound(t *testing.T) {
	ctx := context.Background()
	expense := testExpenseRow()

	mock := &mockExpenseQuerier{
		softDeleteExpenseFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			return 0, nil
		},
	}

	svc := expenseTestService(mock)
	err := svc.Delete(ctx, expense.ID)

	assert.ErrorIs(t, err, ErrNotFound)
}
