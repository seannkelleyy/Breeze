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
	createRecurringIncomeFunc     func(context.Context, sqlc.CreateRecurringIncomeParams) (sqlc.CreateRecurringIncomeRow, error)
	getRecurringIncomeByIDFunc    func(context.Context, uuid.UUID) (sqlc.GetRecurringIncomeByIDRow, error)
	listRecurringIncomeFunc       func(context.Context, uuid.UUID) ([]sqlc.ListRecurringIncomeByUserIDRow, error)
	updateRecurringIncomeFunc     func(context.Context, sqlc.UpdateRecurringIncomeParams) (sqlc.UpdateRecurringIncomeRow, error)
	softDeleteRecurringIncomeFunc func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockRecurringIncomeQuerier) CreateRecurringIncome(ctx context.Context, arg sqlc.CreateRecurringIncomeParams) (sqlc.CreateRecurringIncomeRow, error) {
	if m.createRecurringIncomeFunc != nil {
		return m.createRecurringIncomeFunc(ctx, arg)
	}
	return sqlc.CreateRecurringIncomeRow{}, nil
}

func (m *mockRecurringIncomeQuerier) GetRecurringIncomeByID(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringIncomeByIDRow, error) {
	if m.getRecurringIncomeByIDFunc != nil {
		return m.getRecurringIncomeByIDFunc(ctx, id)
	}
	return sqlc.GetRecurringIncomeByIDRow{}, nil
}

func (m *mockRecurringIncomeQuerier) ListRecurringIncomeByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListRecurringIncomeByUserIDRow, error) {
	if m.listRecurringIncomeFunc != nil {
		return m.listRecurringIncomeFunc(ctx, userID)
	}
	return []sqlc.ListRecurringIncomeByUserIDRow{}, nil
}

func (m *mockRecurringIncomeQuerier) UpdateRecurringIncome(ctx context.Context, arg sqlc.UpdateRecurringIncomeParams) (sqlc.UpdateRecurringIncomeRow, error) {
	if m.updateRecurringIncomeFunc != nil {
		return m.updateRecurringIncomeFunc(ctx, arg)
	}
	return sqlc.UpdateRecurringIncomeRow{}, nil
}

func (m *mockRecurringIncomeQuerier) SoftDeleteRecurringIncome(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteRecurringIncomeFunc != nil {
		return m.softDeleteRecurringIncomeFunc(ctx, id)
	}
	return 0, nil
}

func testRecurringIncomeRow() sqlc.CreateRecurringIncomeRow {
	amount, _ := decimal.Parse("2500.00")
	startDate := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	endDate := pgtype.Date{Time: time.Now().AddDate(0, 6, 0).UTC(), Valid: true}
	payday := int32(15)
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.CreateRecurringIncomeRow{
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
		createRecurringIncomeFunc: func(ctx context.Context, arg sqlc.CreateRecurringIncomeParams) (sqlc.CreateRecurringIncomeRow, error) {
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
	getRow := sqlc.GetRecurringIncomeByIDRow{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		Amount:             row.Amount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate,
		EndDate:            row.EndDate,
		CreatedAt:          row.CreatedAt,
		UpdatedAt:          row.UpdatedAt,
		DeletedAt:          row.DeletedAt,
	}

	mock := &mockRecurringIncomeQuerier{
		getRecurringIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringIncomeByIDRow, error) {
			assert.Equal(t, row.ID, id)
			return getRow, nil
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
		getRecurringIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringIncomeByIDRow, error) {
			return sqlc.GetRecurringIncomeByIDRow{}, pgx.ErrNoRows
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

	listRow1 := sqlc.ListRecurringIncomeByUserIDRow{
		ID:                 row1.ID,
		UserID:             row1.UserID,
		Name:               row1.Name,
		Amount:             row1.Amount,
		RecurrenceInterval: row1.RecurrenceInterval,
		PaydayDayOfMonth:   row1.PaydayDayOfMonth,
		StartDate:          row1.StartDate,
		EndDate:            row1.EndDate,
		CreatedAt:          row1.CreatedAt,
		UpdatedAt:          row1.UpdatedAt,
		DeletedAt:          row1.DeletedAt,
	}
	listRow2 := sqlc.ListRecurringIncomeByUserIDRow{
		ID:                 row2.ID,
		UserID:             row2.UserID,
		Name:               row2.Name,
		Amount:             row2.Amount,
		RecurrenceInterval: row2.RecurrenceInterval,
		PaydayDayOfMonth:   row2.PaydayDayOfMonth,
		StartDate:          row2.StartDate,
		EndDate:            row2.EndDate,
		CreatedAt:          row2.CreatedAt,
		UpdatedAt:          row2.UpdatedAt,
		DeletedAt:          row2.DeletedAt,
	}

	mock := &mockRecurringIncomeQuerier{
		listRecurringIncomeFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.ListRecurringIncomeByUserIDRow, error) {
			assert.Equal(t, row1.UserID, userID)
			return []sqlc.ListRecurringIncomeByUserIDRow{listRow1, listRow2}, nil
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
		updateRecurringIncomeFunc: func(ctx context.Context, arg sqlc.UpdateRecurringIncomeParams) (sqlc.UpdateRecurringIncomeRow, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedAmount, arg.Amount)
			updated := sqlc.UpdateRecurringIncomeRow{
				ID:                 row.ID,
				UserID:             row.UserID,
				Name:               row.Name,
				Amount:             updatedAmount,
				RecurrenceInterval: row.RecurrenceInterval,
				PaydayDayOfMonth:   row.PaydayDayOfMonth,
				StartDate:          row.StartDate,
				EndDate:            row.EndDate,
				CreatedAt:          row.CreatedAt,
				UpdatedAt:          row.UpdatedAt,
				DeletedAt:          row.DeletedAt,
			}
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
