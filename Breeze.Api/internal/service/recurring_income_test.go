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

type mockRecurringIncomeQuerier struct {
	createRecurringIncomeFunc     func(context.Context, sqlc.CreateRecurringIncomeParams) (sqlc.RecurringIncome, error)
	getRecurringIncomeByIDFunc    func(context.Context, uuid.UUID) (sqlc.RecurringIncome, error)
	listRecurringIncomeFunc       func(context.Context, uuid.UUID) ([]sqlc.RecurringIncome, error)
	updateRecurringIncomeFunc     func(context.Context, sqlc.UpdateRecurringIncomeParams) (sqlc.RecurringIncome, error)
	softDeleteRecurringIncomeFunc func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockRecurringIncomeQuerier) CreateRecurringIncome(ctx context.Context, arg sqlc.CreateRecurringIncomeParams) (sqlc.RecurringIncome, error) {
	if m.createRecurringIncomeFunc != nil {
		return m.createRecurringIncomeFunc(ctx, arg)
	}
	return sqlc.RecurringIncome{}, nil
}

func (m *mockRecurringIncomeQuerier) GetRecurringIncomeByID(ctx context.Context, id uuid.UUID) (sqlc.RecurringIncome, error) {
	if m.getRecurringIncomeByIDFunc != nil {
		return m.getRecurringIncomeByIDFunc(ctx, id)
	}
	return sqlc.RecurringIncome{}, nil
}

func (m *mockRecurringIncomeQuerier) ListRecurringIncomeByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.RecurringIncome, error) {
	if m.listRecurringIncomeFunc != nil {
		return m.listRecurringIncomeFunc(ctx, userID)
	}
	return []sqlc.RecurringIncome{}, nil
}

func (m *mockRecurringIncomeQuerier) UpdateRecurringIncome(ctx context.Context, arg sqlc.UpdateRecurringIncomeParams) (sqlc.RecurringIncome, error) {
	if m.updateRecurringIncomeFunc != nil {
		return m.updateRecurringIncomeFunc(ctx, arg)
	}
	return sqlc.RecurringIncome{}, nil
}

func (m *mockRecurringIncomeQuerier) SoftDeleteRecurringIncome(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteRecurringIncomeFunc != nil {
		return m.softDeleteRecurringIncomeFunc(ctx, id)
	}
	return 0, nil
}

func testRecurringIncomeRow() sqlc.RecurringIncome {
	amount, _ := decimal.Parse("2500.00")
	startDate := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	endDate := pgtype.Date{Time: time.Now().AddDate(0, 6, 0).UTC(), Valid: true}
	payday := int32(15)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.RecurringIncome{
		ID:                 uuid.New(),
		UserID:             uuid.New(),
		Name:               "Salary",
		Amount:             amount,
		RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		PaydayDayOfMonth:   &payday,
		StartDate:          startDate,
		EndDate:            endDate,
		CreatedAt:          timestamp,
		UpdatedAt:          timestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func TestRecurringIncomeService_Create(t *testing.T) {
	ctx := context.Background()
	row := testRecurringIncomeRow()

	mock := &mockRecurringIncomeQuerier{
		createRecurringIncomeFunc: func(ctx context.Context, arg sqlc.CreateRecurringIncomeParams) (sqlc.RecurringIncome, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.Amount, arg.Amount)
			return row, nil
		},
	}

	svc := NewRecurringIncomeService(mock)
	result, err := svc.Create(ctx, CreateRecurringIncomeInput{
		UserID:             row.UserID,
		Name:               row.Name,
		Amount:             row.Amount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate.Time,
		EndDate:            dateFromPGDate(row.EndDate),
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestRecurringIncomeService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testRecurringIncomeRow()

	mock := &mockRecurringIncomeQuerier{
		getRecurringIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.RecurringIncome, error) {
			assert.Equal(t, row.ID, id)
			return row, nil
		},
	}

	svc := NewRecurringIncomeService(mock)
	result, err := svc.GetByID(ctx, row.ID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestRecurringIncomeService_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()
	row := testRecurringIncomeRow()

	mock := &mockRecurringIncomeQuerier{
		getRecurringIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.RecurringIncome, error) {
			return sqlc.RecurringIncome{}, pgx.ErrNoRows
		},
	}

	svc := NewRecurringIncomeService(mock)
	result, err := svc.GetByID(ctx, row.ID)

	assert.ErrorIs(t, err, ErrNotFound)
	assert.Nil(t, result)
}

func TestRecurringIncomeService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	row1 := testRecurringIncomeRow()
	row2 := testRecurringIncomeRow()
	row2.ID = uuid.New()

	mock := &mockRecurringIncomeQuerier{
		listRecurringIncomeFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.RecurringIncome, error) {
			assert.Equal(t, row1.UserID, userID)
			return []sqlc.RecurringIncome{row1, row2}, nil
		},
	}

	svc := NewRecurringIncomeService(mock)
	result, err := svc.ListByUserID(ctx, row1.UserID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestRecurringIncomeService_Update(t *testing.T) {
	ctx := context.Background()
	row := testRecurringIncomeRow()
	updatedAmount, _ := decimal.Parse("2600.00")

	mock := &mockRecurringIncomeQuerier{
		updateRecurringIncomeFunc: func(ctx context.Context, arg sqlc.UpdateRecurringIncomeParams) (sqlc.RecurringIncome, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedAmount, arg.Amount)
			updated := row
			updated.Amount = updatedAmount
			return updated, nil
		},
	}

	svc := NewRecurringIncomeService(mock)
	result, err := svc.Update(ctx, UpdateRecurringIncomeInput{
		ID:                 row.ID,
		Name:               row.Name,
		Amount:             updatedAmount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate.Time,
		EndDate:            dateFromPGDate(row.EndDate),
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedAmount, result.Amount)
}

func TestRecurringIncomeService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testRecurringIncomeRow()

	mock := &mockRecurringIncomeQuerier{
		softDeleteRecurringIncomeFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			assert.Equal(t, row.ID, id)
			return 1, nil
		},
	}

	svc := NewRecurringIncomeService(mock)
	err := svc.Delete(ctx, row.ID)
	assert.NoError(t, err)
}

func TestRecurringIncomeService_Delete_NotFound(t *testing.T) {
	ctx := context.Background()
	row := testRecurringIncomeRow()

	mock := &mockRecurringIncomeQuerier{
		softDeleteRecurringIncomeFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			return 0, nil
		},
	}

	svc := NewRecurringIncomeService(mock)
	err := svc.Delete(ctx, row.ID)
	assert.ErrorIs(t, err, ErrNotFound)
}
