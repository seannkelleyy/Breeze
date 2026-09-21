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
)

type mockRecurringExpenseQuerier struct {
	createRecurringExpenseFunc        func(context.Context, sqlc.CreateRecurringExpenseParams) (sqlc.RecurringExpense, error)
	getRecurringExpenseByIDFunc       func(context.Context, uuid.UUID) (sqlc.RecurringExpense, error)
	listRecurringExpensesByUserIDFunc func(context.Context, uuid.UUID) ([]sqlc.RecurringExpense, error)
	updateRecurringExpenseFunc        func(context.Context, sqlc.UpdateRecurringExpenseParams) (sqlc.RecurringExpense, error)
	softDeleteRecurringExpenseFunc    func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockRecurringExpenseQuerier) CreateRecurringExpense(ctx context.Context, arg sqlc.CreateRecurringExpenseParams) (sqlc.RecurringExpense, error) {
	if m.createRecurringExpenseFunc != nil {
		return m.createRecurringExpenseFunc(ctx, arg)
	}
	return sqlc.RecurringExpense{}, nil
}

func (m *mockRecurringExpenseQuerier) GetRecurringExpenseByID(ctx context.Context, id uuid.UUID) (sqlc.RecurringExpense, error) {
	if m.getRecurringExpenseByIDFunc != nil {
		return m.getRecurringExpenseByIDFunc(ctx, id)
	}
	return sqlc.RecurringExpense{}, nil
}

func (m *mockRecurringExpenseQuerier) ListRecurringExpensesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.RecurringExpense, error) {
	if m.listRecurringExpensesByUserIDFunc != nil {
		return m.listRecurringExpensesByUserIDFunc(ctx, userID)
	}
	return []sqlc.RecurringExpense{}, nil
}

func (m *mockRecurringExpenseQuerier) UpdateRecurringExpense(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.RecurringExpense, error) {
	if m.updateRecurringExpenseFunc != nil {
		return m.updateRecurringExpenseFunc(ctx, arg)
	}
	return sqlc.RecurringExpense{}, nil
}

func (m *mockRecurringExpenseQuerier) SoftDeleteRecurringExpense(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteRecurringExpenseFunc != nil {
		return m.softDeleteRecurringExpenseFunc(ctx, id)
	}
	return 0, nil
}

func testCreateRecurringExpenseRow() sqlc.RecurringExpense {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("150.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.RecurringExpense{
		ID:                 expenseID,
		UserID:             userID,
		Name:               "Gym Membership",
		Amount:             amount,
		RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		PaydayDayOfMonth:   int32Ptr(15),
		StartDate:          pgtype.Date{Time: startDate, Valid: true},
		EndDate:            pgtype.Date{},
		PersonID:           pgtype.UUID{},
		CreatedAt:          timestamp,
		UpdatedAt:          timestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func testGetRecurringExpenseByIDRow() sqlc.RecurringExpense {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("150.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.RecurringExpense{
		ID:                 expenseID,
		UserID:             userID,
		Name:               "Gym Membership",
		Amount:             amount,
		RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		PaydayDayOfMonth:   int32Ptr(15),
		StartDate:          pgtype.Date{Time: startDate, Valid: true},
		EndDate:            pgtype.Date{},
		PersonID:           pgtype.UUID{},
		CreatedAt:          timestamp,
		UpdatedAt:          timestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func testListRecurringExpensesByUserIDRow() sqlc.RecurringExpense {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("150.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.RecurringExpense{
		ID:                 expenseID,
		UserID:             userID,
		Name:               "Gym Membership",
		Amount:             amount,
		RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		PaydayDayOfMonth:   int32Ptr(15),
		StartDate:          pgtype.Date{Time: startDate, Valid: true},
		EndDate:            pgtype.Date{},
		PersonID:           pgtype.UUID{},
		CreatedAt:          timestamp,
		UpdatedAt:          timestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func testUpdateRecurringExpenseRow() sqlc.RecurringExpense {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("200.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.RecurringExpense{
		ID:                 expenseID,
		UserID:             userID,
		Name:               "Gym Membership Premium",
		Amount:             amount,
		RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		PaydayDayOfMonth:   int32Ptr(15),
		StartDate:          pgtype.Date{Time: startDate, Valid: true},
		EndDate:            pgtype.Date{},
		PersonID:           pgtype.UUID{},
		CreatedAt:          timestamp,
		UpdatedAt:          timestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func int32Ptr(v int32) *int32 {
	return &v
}

func TestRecurringExpenseService_Create(t *testing.T) {
	ctx := context.Background()
	expected := testCreateRecurringExpenseRow()

	mock := &mockRecurringExpenseQuerier{
		createRecurringExpenseFunc: func(ctx context.Context, arg sqlc.CreateRecurringExpenseParams) (sqlc.RecurringExpense, error) {
			return expected, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	result, err := svc.Create(ctx, &CreateRecurringExpenseInput{
		UserID:             expected.UserID,
		Name:               expected.Name,
		Amount:             expected.Amount,
		RecurrenceInterval: expected.RecurrenceInterval,
		PaydayDayOfMonth:   expected.PaydayDayOfMonth,
		StartDate:          startDate,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expected.ID, result.ID)
	assert.Equal(t, expected.UserID, result.UserID)
	assert.Equal(t, expected.Name, result.Name)
	assert.True(t, expected.Amount.Equal(result.Amount))
	assert.Equal(t, expected.RecurrenceInterval, result.RecurrenceInterval)
}

func TestRecurringExpenseService_Create_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("db connection failed")

	mock := &mockRecurringExpenseQuerier{
		createRecurringExpenseFunc: func(ctx context.Context, arg sqlc.CreateRecurringExpenseParams) (sqlc.RecurringExpense, error) {
			return sqlc.RecurringExpense{}, dbErr
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.Create(ctx, &CreateRecurringExpenseInput{
		UserID: uuid.New(),
		Name:   "Test",
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, dbErr)
}

func TestRecurringExpenseService_GetByID(t *testing.T) {
	ctx := context.Background()
	expected := testGetRecurringExpenseByIDRow()

	mock := &mockRecurringExpenseQuerier{
		getRecurringExpenseByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.RecurringExpense, error) {
			assert.Equal(t, expected.ID, id)
			return expected, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.GetByID(ctx, expected.ID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expected.ID, result.ID)
	assert.Equal(t, expected.Name, result.Name)
	assert.True(t, expected.Amount.Equal(result.Amount))
}

func TestRecurringExpenseService_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()

	mock := &mockRecurringExpenseQuerier{
		getRecurringExpenseByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.RecurringExpense, error) {
			return sqlc.RecurringExpense{}, pgx.ErrNoRows
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.GetByID(ctx, uuid.New())

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestRecurringExpenseService_GetByID_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("query failed")

	mock := &mockRecurringExpenseQuerier{
		getRecurringExpenseByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.RecurringExpense, error) {
			return sqlc.RecurringExpense{}, dbErr
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.GetByID(ctx, uuid.New())

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, dbErr)
}

func TestRecurringExpenseService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	exp1 := testListRecurringExpensesByUserIDRow()
	exp1.UserID = userID
	exp2 := testListRecurringExpensesByUserIDRow()
	exp2.UserID = userID

	mock := &mockRecurringExpenseQuerier{
		listRecurringExpensesByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.RecurringExpense, error) {
			assert.Equal(t, userID, uid)
			return []sqlc.RecurringExpense{exp1, exp2}, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.ListByUserID(ctx, userID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, exp1.ID, result[0].ID)
	assert.Equal(t, exp2.ID, result[1].ID)
}

func TestRecurringExpenseService_ListByUserID_Empty(t *testing.T) {
	ctx := context.Background()

	mock := &mockRecurringExpenseQuerier{
		listRecurringExpensesByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.RecurringExpense, error) {
			return []sqlc.RecurringExpense{}, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.ListByUserID(ctx, uuid.New())

	assert.NoError(t, err)
	assert.Empty(t, result)
}

func TestRecurringExpenseService_ListByUserID_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("query failed")

	mock := &mockRecurringExpenseQuerier{
		listRecurringExpensesByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.RecurringExpense, error) {
			return nil, dbErr
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.ListByUserID(ctx, uuid.New())

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, dbErr)
}

func TestRecurringExpenseService_Update(t *testing.T) {
	ctx := context.Background()
	expected := testUpdateRecurringExpenseRow()

	mock := &mockRecurringExpenseQuerier{
		updateRecurringExpenseFunc: func(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.RecurringExpense, error) {
			assert.Equal(t, expected.ID, arg.ID)
			return expected, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	result, err := svc.Update(ctx, &UpdateRecurringExpenseInput{
		ID:                 expected.ID,
		Name:               expected.Name,
		Amount:             expected.Amount,
		RecurrenceInterval: expected.RecurrenceInterval,
		PaydayDayOfMonth:   expected.PaydayDayOfMonth,
		StartDate:          startDate,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expected.ID, result.ID)
	assert.Equal(t, expected.Name, result.Name)
	assert.True(t, expected.Amount.Equal(result.Amount))
}

func TestRecurringExpenseService_Update_NotFound(t *testing.T) {
	ctx := context.Background()

	mock := &mockRecurringExpenseQuerier{
		updateRecurringExpenseFunc: func(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.RecurringExpense, error) {
			return sqlc.RecurringExpense{}, pgx.ErrNoRows
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.Update(ctx, &UpdateRecurringExpenseInput{
		ID:        uuid.New(),
		Name:      "Test",
		StartDate: time.Now(),
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestRecurringExpenseService_Update_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("update failed")

	mock := &mockRecurringExpenseQuerier{
		updateRecurringExpenseFunc: func(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.RecurringExpense, error) {
			return sqlc.RecurringExpense{}, dbErr
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.Update(ctx, &UpdateRecurringExpenseInput{
		ID:        uuid.New(),
		Name:      "Test",
		StartDate: time.Now(),
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, dbErr)
}

func TestRecurringExpenseService_Delete(t *testing.T) {
	ctx := context.Background()
	expenseID := uuid.New()

	mock := &mockRecurringExpenseQuerier{
		softDeleteRecurringExpenseFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			assert.Equal(t, expenseID, id)
			return 1, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	err := svc.Delete(ctx, expenseID)

	assert.NoError(t, err)
}

func TestRecurringExpenseService_Delete_NotFound(t *testing.T) {
	ctx := context.Background()

	mock := &mockRecurringExpenseQuerier{
		softDeleteRecurringExpenseFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			return 0, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	err := svc.Delete(ctx, uuid.New())

	assert.Error(t, err)
	assert.Equal(t, ErrNotFound, err)
}

func TestRecurringExpenseService_Delete_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("delete failed")

	mock := &mockRecurringExpenseQuerier{
		softDeleteRecurringExpenseFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			return 0, dbErr
		},
	}

	svc := NewRecurringExpenseService(mock)
	err := svc.Delete(ctx, uuid.New())

	assert.Error(t, err)
	assert.ErrorIs(t, err, dbErr)
}
