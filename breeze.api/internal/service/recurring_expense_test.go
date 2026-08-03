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
	createRecurringExpenseFunc        func(context.Context, sqlc.CreateRecurringExpenseParams) (sqlc.CreateRecurringExpenseRow, error)
	getRecurringExpenseByIDFunc       func(context.Context, uuid.UUID) (sqlc.GetRecurringExpenseByIDRow, error)
	listRecurringExpensesByUserIDFunc func(context.Context, uuid.UUID) ([]sqlc.ListRecurringExpensesByUserIDRow, error)
	updateRecurringExpenseFunc        func(context.Context, sqlc.UpdateRecurringExpenseParams) (sqlc.UpdateRecurringExpenseRow, error)
	softDeleteRecurringExpenseFunc    func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockRecurringExpenseQuerier) CreateRecurringExpense(ctx context.Context, arg sqlc.CreateRecurringExpenseParams) (sqlc.CreateRecurringExpenseRow, error) {
	if m.createRecurringExpenseFunc != nil {
		return m.createRecurringExpenseFunc(ctx, arg)
	}
	return sqlc.CreateRecurringExpenseRow{}, nil
}

func (m *mockRecurringExpenseQuerier) GetRecurringExpenseByID(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringExpenseByIDRow, error) {
	if m.getRecurringExpenseByIDFunc != nil {
		return m.getRecurringExpenseByIDFunc(ctx, id)
	}
	return sqlc.GetRecurringExpenseByIDRow{}, nil
}

func (m *mockRecurringExpenseQuerier) ListRecurringExpensesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListRecurringExpensesByUserIDRow, error) {
	if m.listRecurringExpensesByUserIDFunc != nil {
		return m.listRecurringExpensesByUserIDFunc(ctx, userID)
	}
	return []sqlc.ListRecurringExpensesByUserIDRow{}, nil
}

func (m *mockRecurringExpenseQuerier) UpdateRecurringExpense(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.UpdateRecurringExpenseRow, error) {
	if m.updateRecurringExpenseFunc != nil {
		return m.updateRecurringExpenseFunc(ctx, arg)
	}
	return sqlc.UpdateRecurringExpenseRow{}, nil
}

func (m *mockRecurringExpenseQuerier) SoftDeleteRecurringExpense(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteRecurringExpenseFunc != nil {
		return m.softDeleteRecurringExpenseFunc(ctx, id)
	}
	return 0, nil
}

func testCreateRecurringExpenseRow() sqlc.CreateRecurringExpenseRow {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("150.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.CreateRecurringExpenseRow{
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

func testGetRecurringExpenseByIDRow() sqlc.GetRecurringExpenseByIDRow {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("150.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.GetRecurringExpenseByIDRow{
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

func testListRecurringExpensesByUserIDRow() sqlc.ListRecurringExpensesByUserIDRow {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("150.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.ListRecurringExpensesByUserIDRow{
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

func testUpdateRecurringExpenseRow() sqlc.UpdateRecurringExpenseRow {
	expenseID := uuid.New()
	userID := uuid.New()
	amount, _ := decimal.Parse("200.00")
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.UpdateRecurringExpenseRow{
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
		createRecurringExpenseFunc: func(ctx context.Context, arg sqlc.CreateRecurringExpenseParams) (sqlc.CreateRecurringExpenseRow, error) {
			return expected, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	result, err := svc.Create(ctx, CreateRecurringExpenseInput{
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
		createRecurringExpenseFunc: func(ctx context.Context, arg sqlc.CreateRecurringExpenseParams) (sqlc.CreateRecurringExpenseRow, error) {
			return sqlc.CreateRecurringExpenseRow{}, dbErr
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.Create(ctx, CreateRecurringExpenseInput{
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
		getRecurringExpenseByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringExpenseByIDRow, error) {
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
		getRecurringExpenseByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringExpenseByIDRow, error) {
			return sqlc.GetRecurringExpenseByIDRow{}, pgx.ErrNoRows
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
		getRecurringExpenseByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringExpenseByIDRow, error) {
			return sqlc.GetRecurringExpenseByIDRow{}, dbErr
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
		listRecurringExpensesByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.ListRecurringExpensesByUserIDRow, error) {
			assert.Equal(t, userID, uid)
			return []sqlc.ListRecurringExpensesByUserIDRow{exp1, exp2}, nil
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
		listRecurringExpensesByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.ListRecurringExpensesByUserIDRow, error) {
			return []sqlc.ListRecurringExpensesByUserIDRow{}, nil
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
		listRecurringExpensesByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.ListRecurringExpensesByUserIDRow, error) {
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
		updateRecurringExpenseFunc: func(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.UpdateRecurringExpenseRow, error) {
			assert.Equal(t, expected.ID, arg.ID)
			return expected, nil
		},
	}

	svc := NewRecurringExpenseService(mock)
	startDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	result, err := svc.Update(ctx, UpdateRecurringExpenseInput{
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
		updateRecurringExpenseFunc: func(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.UpdateRecurringExpenseRow, error) {
			return sqlc.UpdateRecurringExpenseRow{}, pgx.ErrNoRows
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.Update(ctx, UpdateRecurringExpenseInput{
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
		updateRecurringExpenseFunc: func(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.UpdateRecurringExpenseRow, error) {
			return sqlc.UpdateRecurringExpenseRow{}, dbErr
		},
	}

	svc := NewRecurringExpenseService(mock)
	result, err := svc.Update(ctx, UpdateRecurringExpenseInput{
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
