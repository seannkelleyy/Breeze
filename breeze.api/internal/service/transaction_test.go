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

type mockTransactionQuerier struct {
	createTransactionFunc         func(context.Context, sqlc.CreateTransactionParams) (sqlc.Transaction, error)
	upsertPlaidTransactionFunc    func(context.Context, sqlc.UpsertPlaidTransactionParams) (sqlc.Transaction, error)
	getTransactionFunc            func(context.Context, sqlc.GetTransactionParams) (sqlc.Transaction, error)
	listTransactionsByUserIDFunc  func(context.Context, sqlc.ListTransactionsByUserIDParams) ([]sqlc.Transaction, error)
	assignTransactionCategoryFunc func(context.Context, sqlc.AssignTransactionCategoryParams) (sqlc.Transaction, error)
	softDeleteTransactionFunc     func(context.Context, sqlc.SoftDeleteTransactionParams) (int64, error)
	setTransactionExpenseFunc     func(context.Context, SetTransactionExpenseParams) (sqlc.Transaction, error)
}

func (m *mockTransactionQuerier) CreateTransaction(ctx context.Context, arg sqlc.CreateTransactionParams) (sqlc.Transaction, error) {
	if m.createTransactionFunc != nil {
		return m.createTransactionFunc(ctx, arg)
	}
	return sqlc.Transaction{}, nil
}

func (m *mockTransactionQuerier) UpsertPlaidTransaction(ctx context.Context, arg sqlc.UpsertPlaidTransactionParams) (sqlc.Transaction, error) {
	if m.upsertPlaidTransactionFunc != nil {
		return m.upsertPlaidTransactionFunc(ctx, arg)
	}
	return sqlc.Transaction{}, nil
}

func (m *mockTransactionQuerier) GetTransaction(ctx context.Context, arg sqlc.GetTransactionParams) (sqlc.Transaction, error) {
	if m.getTransactionFunc != nil {
		return m.getTransactionFunc(ctx, arg)
	}
	return sqlc.Transaction{}, nil
}

func (m *mockTransactionQuerier) ListTransactionsByUserID(ctx context.Context, arg sqlc.ListTransactionsByUserIDParams) ([]sqlc.Transaction, error) {
	if m.listTransactionsByUserIDFunc != nil {
		return m.listTransactionsByUserIDFunc(ctx, arg)
	}
	return []sqlc.Transaction{}, nil
}

func (m *mockTransactionQuerier) AssignTransactionCategory(ctx context.Context, arg sqlc.AssignTransactionCategoryParams) (sqlc.Transaction, error) {
	if m.assignTransactionCategoryFunc != nil {
		return m.assignTransactionCategoryFunc(ctx, arg)
	}
	return sqlc.Transaction{}, nil
}

func (m *mockTransactionQuerier) SoftDeleteTransaction(ctx context.Context, arg sqlc.SoftDeleteTransactionParams) (int64, error) {
	if m.softDeleteTransactionFunc != nil {
		return m.softDeleteTransactionFunc(ctx, arg)
	}
	return 0, nil
}

func (m *mockTransactionQuerier) SetTransactionExpense(ctx context.Context, arg SetTransactionExpenseParams) (sqlc.Transaction, error) {
	if m.setTransactionExpenseFunc != nil {
		return m.setTransactionExpenseFunc(ctx, arg)
	}
	return sqlc.Transaction{}, nil
}

func testTransactionRow() sqlc.Transaction {
	amount := mustDecimal("-42.50")
	date := pgtype.Date{Time: time.Date(2026, 9, 15, 0, 0, 0, 0, time.UTC), Valid: true}
	ts := pgtype.Timestamptz{Time: time.Date(2026, 9, 15, 12, 0, 0, 0, time.UTC), Valid: true}
	plaidTxID := "plaid-tx-123"

	return sqlc.Transaction{
		ID:                 uuid.New(),
		UserID:             uuid.New(),
		PlaidAccountID:     pgtype.UUID{Bytes: uuid.New(), Valid: true},
		PlaidTransactionID: &plaidTxID,
		Date:               date,
		Amount:             amount,
		Name:               "Whole Foods",
		ExpenseCategoryID:  pgtype.UUID{Bytes: uuid.New(), Valid: true},
		ExpenseID:          pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Pending:            true,
		CreatedAt:          ts,
		UpdatedAt:          ts,
	}
}

func TestTransactionService_Create(t *testing.T) {
	ctx := context.Background()

	t.Run("rejects zero amount", func(t *testing.T) {
		svc := NewTransactionService(&mockTransactionQuerier{})
		_, err := svc.Create(ctx, &CreateTransactionInput{
			UserID: uuid.New(),
			Date:   time.Now(),
			Amount: decimal.Zero,
			Name:   "zero",
		})
		assert.ErrorContains(t, err, "must not be zero")
	})

	t.Run("maps input and output", func(t *testing.T) {
		row := testTransactionRow()
		categoryID := uuid.UUID(row.ExpenseCategoryID.Bytes)
		date := time.Date(2026, 9, 20, 0, 0, 0, 0, time.UTC)

		var captured sqlc.CreateTransactionParams
		mock := &mockTransactionQuerier{
			createTransactionFunc: func(_ context.Context, arg sqlc.CreateTransactionParams) (sqlc.Transaction, error) {
				captured = arg
				return row, nil
			},
		}

		svc := NewTransactionService(mock)
		result, err := svc.Create(ctx, &CreateTransactionInput{
			UserID:            row.UserID,
			Date:              date,
			Amount:            row.Amount,
			Name:              row.Name,
			ExpenseCategoryID: &categoryID,
		})
		require.NoError(t, err)

		assert.Equal(t, row.UserID, captured.UserID)
		assert.Equal(t, date, captured.Date.Time)
		assert.True(t, captured.Date.Valid)
		assert.True(t, captured.Amount.Equal(row.Amount))
		assert.Equal(t, row.Name, captured.Name)
		assert.True(t, captured.ExpenseCategoryID.Valid)
		assert.Equal(t, categoryID, uuid.UUID(captured.ExpenseCategoryID.Bytes))
		assert.False(t, captured.Pending, "manual transactions are never pending")

		assert.Equal(t, row.ID, result.ID)
		assert.Equal(t, row.UserID, result.UserID)
		assert.NotNil(t, result.PlaidAccountID)
		assert.Equal(t, "plaid-tx-123", *result.PlaidTransactionID)
		assert.NotNil(t, result.ExpenseCategoryID)
		assert.NotNil(t, result.ExpenseID)
		assert.True(t, result.Pending)
		assert.True(t, result.Amount.Equal(row.Amount))
		assert.False(t, result.CreatedAt.IsZero())
		assert.False(t, result.UpdatedAt.IsZero())
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			createTransactionFunc: func(_ context.Context, _ sqlc.CreateTransactionParams) (sqlc.Transaction, error) {
				return sqlc.Transaction{}, errors.New("boom")
			},
		}
		svc := NewTransactionService(mock)
		_, err := svc.Create(ctx, &CreateTransactionInput{
			UserID: uuid.New(),
			Date:   time.Now(),
			Amount: mustDecimal("10.00"),
			Name:   "x",
		})
		assert.ErrorContains(t, err, "create transaction")
	})
}

func TestTransactionService_GetByID(t *testing.T) {
	ctx := context.Background()

	t.Run("not found maps to ErrNotFound", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			getTransactionFunc: func(_ context.Context, _ sqlc.GetTransactionParams) (sqlc.Transaction, error) {
				return sqlc.Transaction{}, pgx.ErrNoRows
			},
		}
		svc := NewTransactionService(mock)
		_, err := svc.GetByID(ctx, uuid.New(), uuid.New())
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("scopes lookup by user", func(t *testing.T) {
		row := testTransactionRow()
		var captured sqlc.GetTransactionParams
		mock := &mockTransactionQuerier{
			getTransactionFunc: func(_ context.Context, arg sqlc.GetTransactionParams) (sqlc.Transaction, error) {
				captured = arg
				return row, nil
			},
		}
		svc := NewTransactionService(mock)
		result, err := svc.GetByID(ctx, row.UserID, row.ID)
		require.NoError(t, err)
		assert.Equal(t, row.ID, captured.ID)
		assert.Equal(t, row.UserID, captured.UserID)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("wraps other errors", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			getTransactionFunc: func(_ context.Context, _ sqlc.GetTransactionParams) (sqlc.Transaction, error) {
				return sqlc.Transaction{}, errors.New("boom")
			},
		}
		svc := NewTransactionService(mock)
		_, err := svc.GetByID(ctx, uuid.New(), uuid.New())
		assert.ErrorContains(t, err, "get transaction")
	})
}

func TestTransactionService_ListByUserID(t *testing.T) {
	ctx := context.Background()

	t.Run("passes date range and maps rows", func(t *testing.T) {
		row := testTransactionRow()
		from := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
		to := time.Date(2026, 9, 30, 0, 0, 0, 0, time.UTC)

		var captured sqlc.ListTransactionsByUserIDParams
		mock := &mockTransactionQuerier{
			listTransactionsByUserIDFunc: func(_ context.Context, arg sqlc.ListTransactionsByUserIDParams) ([]sqlc.Transaction, error) {
				captured = arg
				return []sqlc.Transaction{row}, nil
			},
		}

		svc := NewTransactionService(mock)
		results, err := svc.ListByUserID(ctx, row.UserID, from, to)
		require.NoError(t, err)

		assert.Equal(t, row.UserID, captured.UserID)
		assert.Equal(t, from, captured.FromDate.Time)
		assert.Equal(t, to, captured.ToDate.Time)
		require.Len(t, results, 1)
		assert.Equal(t, row.ID, results[0].ID)
		assert.Equal(t, "plaid-tx-123", *results[0].PlaidTransactionID)
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			listTransactionsByUserIDFunc: func(_ context.Context, _ sqlc.ListTransactionsByUserIDParams) ([]sqlc.Transaction, error) {
				return nil, errors.New("boom")
			},
		}
		svc := NewTransactionService(mock)
		_, err := svc.ListByUserID(ctx, uuid.New(), time.Now(), time.Now())
		assert.ErrorContains(t, err, "list transactions")
	})
}

func TestTransactionService_AssignCategory(t *testing.T) {
	ctx := context.Background()

	t.Run("not found maps to ErrNotFound", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			assignTransactionCategoryFunc: func(_ context.Context, _ sqlc.AssignTransactionCategoryParams) (sqlc.Transaction, error) {
				return sqlc.Transaction{}, pgx.ErrNoRows
			},
		}
		svc := NewTransactionService(mock)
		_, err := svc.AssignCategory(ctx, uuid.New(), uuid.New(), nil)
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("assigns category", func(t *testing.T) {
		row := testTransactionRow()
		categoryID := uuid.New()

		var captured sqlc.AssignTransactionCategoryParams
		mock := &mockTransactionQuerier{
			assignTransactionCategoryFunc: func(_ context.Context, arg sqlc.AssignTransactionCategoryParams) (sqlc.Transaction, error) {
				captured = arg
				row.ExpenseCategoryID = pgtype.UUID{Bytes: categoryID, Valid: true}
				return row, nil
			},
		}

		svc := NewTransactionService(mock)
		result, err := svc.AssignCategory(ctx, row.UserID, row.ID, &categoryID)
		require.NoError(t, err)
		assert.Equal(t, row.ID, captured.ID)
		assert.Equal(t, row.UserID, captured.UserID)
		assert.Equal(t, categoryID, uuid.UUID(captured.ExpenseCategoryID.Bytes))
		assert.NotNil(t, result.ExpenseCategoryID)
	})

	t.Run("clears category with nil", func(t *testing.T) {
		row := testTransactionRow()
		mock := &mockTransactionQuerier{
			assignTransactionCategoryFunc: func(_ context.Context, arg sqlc.AssignTransactionCategoryParams) (sqlc.Transaction, error) {
				assert.False(t, arg.ExpenseCategoryID.Valid, "nil category should clear the column")
				row.ExpenseCategoryID = pgtype.UUID{}
				return row, nil
			},
		}
		svc := NewTransactionService(mock)
		result, err := svc.AssignCategory(ctx, row.UserID, row.ID, nil)
		require.NoError(t, err)
		assert.Nil(t, result.ExpenseCategoryID)
	})
}

func TestTransactionService_Delete(t *testing.T) {
	ctx := context.Background()

	t.Run("zero rows maps to ErrNotFound", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			softDeleteTransactionFunc: func(_ context.Context, _ sqlc.SoftDeleteTransactionParams) (int64, error) {
				return 0, nil
			},
		}
		svc := NewTransactionService(mock)
		err := svc.Delete(ctx, uuid.New(), uuid.New())
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("success is scoped by user", func(t *testing.T) {
		userID, id := uuid.New(), uuid.New()
		var captured sqlc.SoftDeleteTransactionParams
		mock := &mockTransactionQuerier{
			softDeleteTransactionFunc: func(_ context.Context, arg sqlc.SoftDeleteTransactionParams) (int64, error) {
				captured = arg
				return 1, nil
			},
		}
		svc := NewTransactionService(mock)
		err := svc.Delete(ctx, userID, id)
		require.NoError(t, err)
		assert.Equal(t, id, captured.ID)
		assert.Equal(t, userID, captured.UserID)
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			softDeleteTransactionFunc: func(_ context.Context, _ sqlc.SoftDeleteTransactionParams) (int64, error) {
				return 0, errors.New("boom")
			},
		}
		svc := NewTransactionService(mock)
		err := svc.Delete(ctx, uuid.New(), uuid.New())
		assert.ErrorContains(t, err, "delete transaction")
	})
}

func TestTransactionService_UpsertFromPlaid(t *testing.T) {
	ctx := context.Background()

	t.Run("passes plaid identifiers through", func(t *testing.T) {
		row := testTransactionRow()
		plaidAccountID := uuid.New()
		date := time.Date(2026, 9, 14, 0, 0, 0, 0, time.UTC)

		var captured sqlc.UpsertPlaidTransactionParams
		mock := &mockTransactionQuerier{
			upsertPlaidTransactionFunc: func(_ context.Context, arg sqlc.UpsertPlaidTransactionParams) (sqlc.Transaction, error) {
				captured = arg
				return row, nil
			},
		}

		svc := NewTransactionService(mock)
		result, err := svc.UpsertFromPlaid(ctx, row.UserID, plaidAccountID, "plaid-tx-123", date, row.Amount, "Whole Foods", true)
		require.NoError(t, err)

		assert.Equal(t, row.UserID, captured.UserID)
		assert.True(t, captured.PlaidAccountID.Valid)
		assert.Equal(t, plaidAccountID, uuid.UUID(captured.PlaidAccountID.Bytes))
		require.NotNil(t, captured.PlaidTransactionID)
		assert.Equal(t, "plaid-tx-123", *captured.PlaidTransactionID)
		assert.Equal(t, date, captured.Date.Time)
		assert.True(t, captured.Pending)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			upsertPlaidTransactionFunc: func(_ context.Context, _ sqlc.UpsertPlaidTransactionParams) (sqlc.Transaction, error) {
				return sqlc.Transaction{}, errors.New("boom")
			},
		}
		svc := NewTransactionService(mock)
		_, err := svc.UpsertFromPlaid(ctx, uuid.New(), uuid.New(), "tx", time.Now(), mustDecimal("1.00"), "x", false)
		assert.ErrorContains(t, err, "upsert plaid transaction")
	})
}

func TestTransactionService_SetTransactionExpense(t *testing.T) {
	ctx := context.Background()

	t.Run("not found maps to ErrNotFound", func(t *testing.T) {
		mock := &mockTransactionQuerier{
			setTransactionExpenseFunc: func(_ context.Context, _ SetTransactionExpenseParams) (sqlc.Transaction, error) {
				return sqlc.Transaction{}, pgx.ErrNoRows
			},
		}
		svc := NewTransactionService(mock)
		_, err := svc.SetTransactionExpense(ctx, uuid.New(), uuid.New(), nil)
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("links expense", func(t *testing.T) {
		row := testTransactionRow()
		expenseID := uuid.New()

		var captured SetTransactionExpenseParams
		mock := &mockTransactionQuerier{
			setTransactionExpenseFunc: func(_ context.Context, arg SetTransactionExpenseParams) (sqlc.Transaction, error) {
				captured = arg
				row.ExpenseID = pgtype.UUID{Bytes: expenseID, Valid: true}
				return row, nil
			},
		}

		svc := NewTransactionService(mock)
		result, err := svc.SetTransactionExpense(ctx, row.UserID, row.ID, &expenseID)
		require.NoError(t, err)
		assert.Equal(t, row.ID, captured.ID)
		assert.Equal(t, row.UserID, captured.UserID)
		assert.Equal(t, expenseID, uuid.UUID(captured.ExpenseID.Bytes))
		assert.NotNil(t, result.ExpenseID)
		assert.Equal(t, expenseID, *result.ExpenseID)
	})

	t.Run("unlinks expense with nil", func(t *testing.T) {
		row := testTransactionRow()
		mock := &mockTransactionQuerier{
			setTransactionExpenseFunc: func(_ context.Context, arg SetTransactionExpenseParams) (sqlc.Transaction, error) {
				assert.False(t, arg.ExpenseID.Valid, "nil expense should clear the column")
				row.ExpenseID = pgtype.UUID{}
				return row, nil
			},
		}
		svc := NewTransactionService(mock)
		result, err := svc.SetTransactionExpense(ctx, row.UserID, row.ID, nil)
		require.NoError(t, err)
		assert.Nil(t, result.ExpenseID)
	})
}

func TestTransactionService_BudgetForMonth(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	target := time.Date(2026, 9, 18, 15, 0, 0, 0, time.UTC)
	monthStart := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	ts := pgtype.Timestamptz{Time: time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC), Valid: true}

	newBudgetMock := func(getByDate func(context.Context, sqlc.GetBudgetByDateParams) (sqlc.Budget, error)) *mockBudgetQuerier {
		return &mockBudgetQuerier{
			getBudgetByDateFunc: getByDate,
			createBudgetFunc: func(_ context.Context, _ sqlc.CreateBudgetParams) (sqlc.Budget, error) {
				return sqlc.Budget{}, errors.New("create should not be called")
			},
		}
	}

	t.Run("returns existing budget without creating", func(t *testing.T) {
		existing := sqlc.Budget{ID: uuid.New(), UserID: userID, Date: pgtype.Date{Time: monthStart, Valid: true}, CreatedAt: ts, UpdatedAt: ts}
		budgetMock := newBudgetMock(func(_ context.Context, arg sqlc.GetBudgetByDateParams) (sqlc.Budget, error) {
			assert.Equal(t, userID, arg.UserID)
			assert.Equal(t, monthStart, arg.Date.Time, "lookup should use the first of the month")
			return existing, nil
		})

		svc := NewTransactionService(&mockTransactionQuerier{})
		b, err := svc.BudgetForMonth(ctx, NewBudgetService(budgetMock), userID, target)
		require.NoError(t, err)
		assert.Equal(t, existing.ID, b.ID)
	})

	t.Run("creates budget for unbudgeted month", func(t *testing.T) {
		created := sqlc.Budget{ID: uuid.New(), UserID: userID, Date: pgtype.Date{Time: monthStart, Valid: true}, CreatedAt: ts, UpdatedAt: ts}
		var createCaptured sqlc.CreateBudgetParams
		budgetMock := &mockBudgetQuerier{
			getBudgetByDateFunc: func(_ context.Context, _ sqlc.GetBudgetByDateParams) (sqlc.Budget, error) {
				return sqlc.Budget{}, pgx.ErrNoRows
			},
			createBudgetFunc: func(_ context.Context, arg sqlc.CreateBudgetParams) (sqlc.Budget, error) {
				createCaptured = arg
				return created, nil
			},
		}

		svc := NewTransactionService(&mockTransactionQuerier{})
		b, err := svc.BudgetForMonth(ctx, NewBudgetService(budgetMock), userID, target)
		require.NoError(t, err)
		assert.Equal(t, created.ID, b.ID)
		assert.Equal(t, userID, createCaptured.UserID)
		assert.Equal(t, monthStart, createCaptured.Date.Time, "created budget should be dated the first of the month")
	})

	t.Run("wraps unexpected lookup error", func(t *testing.T) {
		budgetMock := newBudgetMock(func(_ context.Context, _ sqlc.GetBudgetByDateParams) (sqlc.Budget, error) {
			return sqlc.Budget{}, errors.New("boom")
		})

		svc := NewTransactionService(&mockTransactionQuerier{})
		_, err := svc.BudgetForMonth(ctx, NewBudgetService(budgetMock), userID, target)
		assert.ErrorContains(t, err, "find budget")
	})
}
