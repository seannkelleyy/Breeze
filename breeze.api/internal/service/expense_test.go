package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockExpenseQuerier struct {
	createExpenseFunc                 func(context.Context, sqlc.CreateExpenseParams) (sqlc.Expense, error)
	getExpenseByIDFunc                func(context.Context, uuid.UUID) (sqlc.Expense, error)
	listExpensesByBudgetIDFunc        func(context.Context, uuid.UUID) ([]sqlc.Expense, error)
	updateExpenseFunc                 func(context.Context, sqlc.UpdateExpenseParams) (sqlc.Expense, error)
	softDeleteExpenseFunc             func(context.Context, sqlc.SoftDeleteExpenseParams) (int64, error)
	softDeleteGeneratedExpensesFunc   func(context.Context, uuid.UUID) (int64, error)
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

func (m *mockExpenseQuerier) SoftDeleteExpense(ctx context.Context, arg sqlc.SoftDeleteExpenseParams) (int64, error) {
	if m.softDeleteExpenseFunc != nil {
		return m.softDeleteExpenseFunc(ctx, arg)
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

func testCreateExpenseRow() sqlc.Expense {
	amount, _ := decimal.Parse("250.00")
	date := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.Expense{
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

	_, err := svc.Create(ctx, &CreateExpenseInput{
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

	_, err := svc.Create(ctx, &CreateExpenseInput{
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
		createExpenseFunc: func(_ context.Context, _ sqlc.CreateExpenseParams) (sqlc.Expense, error) {
			return expense, nil
		},
		createExpenseSplitFunc: func(_ context.Context, _ sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error) {
			return split, nil
		},
	}

	svc := expenseTestService(mock)
	result, err := svc.Create(ctx, &CreateExpenseInput{
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
		updateExpenseFunc: func(_ context.Context, _ sqlc.UpdateExpenseParams) (sqlc.Expense, error) {
			return sqlc.Expense{}, pgx.ErrNoRows
		},
	}

	svc := expenseTestService(mock)
	_, err := svc.Update(ctx, uuid.New(), &UpdateExpenseInput{
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
		softDeleteExpenseFunc: func(_ context.Context, arg sqlc.SoftDeleteExpenseParams) (int64, error) {
			return 0, nil
		},
	}

	svc := expenseTestService(mock)
	err := svc.Delete(ctx, uuid.New(), uuid.New())
	assert.ErrorIs(t, err, ErrNotFound)
}

// fullExpenseRow exercises the optional columns the basic row leaves null.
func fullExpenseRow() sqlc.Expense {
	row := testCreateExpenseRow()
	personID := uuid.New()
	templateID := uuid.New()
	row.PersonID = pgtype.UUID{Bytes: personID, Valid: true}
	row.SourceTemplateID = pgtype.UUID{Bytes: templateID, Valid: true}
	row.GenerationMonth = pgtype.Date{Time: time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC), Valid: true}
	row.SourceType = sqlc.ExpenseSourceTypeRECURRINGTEMPLATE
	return row
}

func TestExpenseService_GetByID(t *testing.T) {
	ctx := context.Background()

	t.Run("returns expense with splits and optional fields", func(t *testing.T) {
		expense := fullExpenseRow()
		split := testExpenseSplitRow(expense.ID)

		mock := &mockExpenseQuerier{
			getExpenseByIDFunc: func(_ context.Context, id uuid.UUID) (sqlc.Expense, error) {
				assert.Equal(t, expense.ID, id)
				return expense, nil
			},
			listExpenseSplitsByExpenseIDsFunc: func(_ context.Context, ids []uuid.UUID) ([]sqlc.ExpenseSplit, error) {
				assert.Equal(t, []uuid.UUID{expense.ID}, ids)
				return []sqlc.ExpenseSplit{split}, nil
			},
		}

		svc := expenseTestService(mock)
		result, err := svc.GetByID(ctx, expense.ID)
		require.NoError(t, err)
		assert.Equal(t, expense.ID, result.ID)
		assert.Equal(t, "Groceries", result.Description)
		require.NotNil(t, result.PersonID)
		require.NotNil(t, result.SourceTemplateID)
		require.NotNil(t, result.GenerationMonth)
		assert.Equal(t, sqlc.ExpenseSourceTypeRECURRINGTEMPLATE, result.SourceType)
		require.Len(t, result.Splits, 1)
		assert.Equal(t, split.CategoryID, result.Splits[0].CategoryID)
		assert.Equal(t, "Produce", *result.Splits[0].Description)
	})

	t.Run("not found maps to ErrNotFound", func(t *testing.T) {
		mock := &mockExpenseQuerier{
			getExpenseByIDFunc: func(_ context.Context, _ uuid.UUID) (sqlc.Expense, error) {
				return sqlc.Expense{}, pgx.ErrNoRows
			},
		}
		svc := expenseTestService(mock)
		_, err := svc.GetByID(ctx, uuid.New())
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("wraps expense lookup error", func(t *testing.T) {
		mock := &mockExpenseQuerier{
			getExpenseByIDFunc: func(_ context.Context, _ uuid.UUID) (sqlc.Expense, error) {
				return sqlc.Expense{}, errors.New("boom")
			},
		}
		svc := expenseTestService(mock)
		_, err := svc.GetByID(ctx, uuid.New())
		assert.ErrorContains(t, err, "get expense by id")
	})

	t.Run("wraps splits lookup error", func(t *testing.T) {
		expense := testCreateExpenseRow()
		mock := &mockExpenseQuerier{
			getExpenseByIDFunc: func(_ context.Context, _ uuid.UUID) (sqlc.Expense, error) {
				return expense, nil
			},
			listExpenseSplitsByExpenseIDsFunc: func(_ context.Context, _ []uuid.UUID) ([]sqlc.ExpenseSplit, error) {
				return nil, errors.New("boom")
			},
		}
		svc := expenseTestService(mock)
		_, err := svc.GetByID(ctx, expense.ID)
		assert.ErrorContains(t, err, "list expense splits")
	})
}

func TestExpenseService_ListByBudgetID(t *testing.T) {
	ctx := context.Background()

	t.Run("empty budget returns empty slice", func(t *testing.T) {
		mock := &mockExpenseQuerier{
			listExpensesByBudgetIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.Expense, error) {
				return []sqlc.Expense{}, nil
			},
		}
		svc := expenseTestService(mock)
		results, err := svc.ListByBudgetID(ctx, uuid.New())
		require.NoError(t, err)
		assert.NotNil(t, results)
		assert.Empty(t, results)
	})

	t.Run("groups splits under their expense", func(t *testing.T) {
		first := testCreateExpenseRow()
		second := testCreateExpenseRow()
		firstSplit := testExpenseSplitRow(first.ID)
		secondSplit := testExpenseSplitRow(second.ID)

		mock := &mockExpenseQuerier{
			listExpensesByBudgetIDFunc: func(_ context.Context, budgetID uuid.UUID) ([]sqlc.Expense, error) {
				return []sqlc.Expense{first, second}, nil
			},
			listExpenseSplitsByExpenseIDsFunc: func(_ context.Context, ids []uuid.UUID) ([]sqlc.ExpenseSplit, error) {
				assert.ElementsMatch(t, []uuid.UUID{first.ID, second.ID}, ids)
				// Return out of order to prove grouping is by expense id, not position.
				return []sqlc.ExpenseSplit{secondSplit, firstSplit}, nil
			},
		}

		svc := expenseTestService(mock)
		results, err := svc.ListByBudgetID(ctx, first.BudgetID)
		require.NoError(t, err)
		require.Len(t, results, 2)

		byID := make(map[uuid.UUID]Expense, len(results))
		for _, e := range results {
			byID[e.ID] = e
		}
		require.Len(t, byID[first.ID].Splits, 1)
		assert.Equal(t, firstSplit.ID, byID[first.ID].Splits[0].ID)
		require.Len(t, byID[second.ID].Splits, 1)
		assert.Equal(t, secondSplit.ID, byID[second.ID].Splits[0].ID)
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockExpenseQuerier{
			listExpensesByBudgetIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.Expense, error) {
				return nil, errors.New("boom")
			},
		}
		svc := expenseTestService(mock)
		_, err := svc.ListByBudgetID(ctx, uuid.New())
		assert.ErrorContains(t, err, "list expenses by budget id")
	})
}

func TestExpenseService_Update_Success(t *testing.T) {
	ctx := context.Background()
	expense := fullExpenseRow()
	newSplit := testExpenseSplitRow(expense.ID)
	splitsDeleted := false

	mock := &mockExpenseQuerier{
		updateExpenseFunc: func(_ context.Context, arg sqlc.UpdateExpenseParams) (sqlc.Expense, error) {
			assert.Equal(t, expense.ID, arg.ID)
			assert.Equal(t, expense.UserID, arg.UserID)
			row := expense
			row.Description = "Updated groceries"
			return row, nil
		},
		softDeleteExpenseSplitsFunc: func(_ context.Context, expenseID uuid.UUID) (int64, error) {
			splitsDeleted = true
			assert.Equal(t, expense.ID, expenseID)
			return 1, nil
		},
		createExpenseSplitFunc: func(_ context.Context, arg sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error) {
			assert.Equal(t, expense.ID, arg.ExpenseID)
			return newSplit, nil
		},
	}

	svc := expenseTestService(mock)
	result, err := svc.Update(ctx, expense.UserID, &UpdateExpenseInput{
		ID:          expense.ID,
		Amount:      expense.Amount,
		Date:        expense.Date.Time,
		Description: "Updated groceries",
		PersonID:    uuidFromPGUUID(expense.PersonID),
		Splits: []ExpenseSplitInput{
			{CategoryID: newSplit.CategoryID, Amount: newSplit.Amount},
		},
	})
	require.NoError(t, err)
	assert.True(t, splitsDeleted, "old splits should be replaced")
	assert.Equal(t, "Updated groceries", result.Description)
	require.Len(t, result.Splits, 1)
	assert.Equal(t, newSplit.ID, result.Splits[0].ID)
	require.NotNil(t, result.PersonID)
}

func TestExpenseService_Update_WrapsQueryError(t *testing.T) {
	ctx := context.Background()
	amount := mustDecimal("50.00")
	catID := uuid.New()

	mock := &mockExpenseQuerier{
		updateExpenseFunc: func(_ context.Context, _ sqlc.UpdateExpenseParams) (sqlc.Expense, error) {
			return sqlc.Expense{}, errors.New("boom")
		},
	}

	svc := expenseTestService(mock)
	_, err := svc.Update(ctx, uuid.New(), &UpdateExpenseInput{
		ID:          uuid.New(),
		Amount:      amount,
		Date:        time.Now(),
		Description: "test",
		Splits:      []ExpenseSplitInput{{CategoryID: catID, Amount: amount}},
	})
	assert.ErrorContains(t, err, "update expense")
}

func TestExpenseService_Delete_Success(t *testing.T) {
	ctx := context.Background()
	userID, expenseID := uuid.New(), uuid.New()
	splitsDeleted := false

	mock := &mockExpenseQuerier{
		softDeleteExpenseFunc: func(_ context.Context, arg sqlc.SoftDeleteExpenseParams) (int64, error) {
			assert.Equal(t, expenseID, arg.ID)
			assert.Equal(t, userID, arg.UserID)
			return 1, nil
		},
		softDeleteExpenseSplitsFunc: func(_ context.Context, expenseID uuid.UUID) (int64, error) {
			splitsDeleted = true
			return 1, nil
		},
	}

	svc := expenseTestService(mock)
	err := svc.Delete(ctx, userID, expenseID)
	require.NoError(t, err)
	assert.True(t, splitsDeleted, "expense splits should soft-delete with the expense")
}

func TestNewExpenseService(t *testing.T) {
	svc := NewExpenseService(nil, nil)
	assert.NotNil(t, svc)
}
