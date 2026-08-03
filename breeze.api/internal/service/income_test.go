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

type mockIncomeQuerier struct {
	createIncomeFunc     func(context.Context, sqlc.CreateIncomeParams) (sqlc.CreateIncomeRow, error)
	getIncomeByIDFunc    func(context.Context, uuid.UUID) (sqlc.GetIncomeByIDRow, error)
	listIncomeFunc       func(context.Context, uuid.UUID) ([]sqlc.ListIncomeByBudgetIDRow, error)
	updateIncomeFunc     func(context.Context, sqlc.UpdateIncomeParams) (sqlc.UpdateIncomeRow, error)
	softDeleteIncomeFunc func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockIncomeQuerier) CreateIncome(ctx context.Context, arg sqlc.CreateIncomeParams) (sqlc.CreateIncomeRow, error) {
	if m.createIncomeFunc != nil {
		return m.createIncomeFunc(ctx, arg)
	}
	return sqlc.CreateIncomeRow{}, nil
}

func (m *mockIncomeQuerier) GetIncomeByID(ctx context.Context, id uuid.UUID) (sqlc.GetIncomeByIDRow, error) {
	if m.getIncomeByIDFunc != nil {
		return m.getIncomeByIDFunc(ctx, id)
	}
	return sqlc.GetIncomeByIDRow{}, nil
}

func (m *mockIncomeQuerier) ListIncomeByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.ListIncomeByBudgetIDRow, error) {
	if m.listIncomeFunc != nil {
		return m.listIncomeFunc(ctx, budgetID)
	}
	return []sqlc.ListIncomeByBudgetIDRow{}, nil
}

func (m *mockIncomeQuerier) UpdateIncome(ctx context.Context, arg sqlc.UpdateIncomeParams) (sqlc.UpdateIncomeRow, error) {
	if m.updateIncomeFunc != nil {
		return m.updateIncomeFunc(ctx, arg)
	}
	return sqlc.UpdateIncomeRow{}, nil
}

func (m *mockIncomeQuerier) SoftDeleteIncome(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteIncomeFunc != nil {
		return m.softDeleteIncomeFunc(ctx, id)
	}
	return 0, nil
}

func testIncomeRow() sqlc.CreateIncomeRow {
	amount, _ := decimal.Parse("4500.00")
	incomeDate := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	sourceOccurrence := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	generationMonth := pgtype.Date{Time: time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC), Valid: true}
	templateID := uuid.New()
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.CreateIncomeRow{
		ID:                   uuid.New(),
		UserID:               uuid.New(),
		BudgetID:             uuid.New(),
		Name:                 "Paycheck",
		Amount:               amount,
		Date:                 incomeDate,
		SourceType:           sqlc.IncomeSourceTypeMANUAL,
		SourceTemplateID:     pgtype.UUID{Bytes: templateID, Valid: true},
		SourceOccurrenceDate: sourceOccurrence,
		GenerationMonth:      generationMonth,
		CreatedAt:            timestamp,
		UpdatedAt:            timestamp,
		DeletedAt:            pgtype.Timestamptz{},
	}
}

func TestIncomeService_Create(t *testing.T) {
	ctx := context.Background()
	row := testIncomeRow()

	mock := &mockIncomeQuerier{
		createIncomeFunc: func(ctx context.Context, arg sqlc.CreateIncomeParams) (sqlc.CreateIncomeRow, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.BudgetID, arg.BudgetID)
			assert.Equal(t, row.Amount, arg.Amount)
			return row, nil
		},
	}

	svc := NewIncomeService(mock)
	result, err := svc.Create(ctx, CreateIncomeInput{
		UserID:               row.UserID,
		BudgetID:             row.BudgetID,
		Name:                 row.Name,
		Amount:               row.Amount,
		Date:                 row.Date.Time,
		SourceType:           row.SourceType,
		SourceTemplateID:     uuidFromPGUUID(row.SourceTemplateID),
		SourceOccurrenceDate: dateFromPGDate(row.SourceOccurrenceDate),
		GenerationMonth:      dateFromPGDate(row.GenerationMonth),
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestIncomeService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testIncomeRow()
	getRow := sqlc.GetIncomeByIDRow{
		ID:                   row.ID,
		UserID:               row.UserID,
		BudgetID:             row.BudgetID,
		Name:                 row.Name,
		Amount:               row.Amount,
		Date:                 row.Date,
		SourceType:           row.SourceType,
		SourceTemplateID:     row.SourceTemplateID,
		SourceOccurrenceDate: row.SourceOccurrenceDate,
		GenerationMonth:      row.GenerationMonth,
		CreatedAt:            row.CreatedAt,
		UpdatedAt:            row.UpdatedAt,
		DeletedAt:            row.DeletedAt,
	}

	mock := &mockIncomeQuerier{
		getIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetIncomeByIDRow, error) {
			assert.Equal(t, row.ID, id)
			return getRow, nil
		},
	}

	svc := NewIncomeService(mock)
	result, err := svc.GetByID(ctx, row.ID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestIncomeService_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()
	row := testIncomeRow()

	mock := &mockIncomeQuerier{
		getIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetIncomeByIDRow, error) {
			return sqlc.GetIncomeByIDRow{}, pgx.ErrNoRows
		},
	}

	svc := NewIncomeService(mock)
	result, err := svc.GetByID(ctx, row.ID)

	assert.ErrorIs(t, err, ErrNotFound)
	assert.Nil(t, result)
}

func TestIncomeService_ListByBudgetID(t *testing.T) {
	ctx := context.Background()
	row1 := testIncomeRow()
	row2 := testIncomeRow()
	row2.ID = uuid.New()

	listRow1 := sqlc.ListIncomeByBudgetIDRow{
		ID:                   row1.ID,
		UserID:               row1.UserID,
		BudgetID:             row1.BudgetID,
		Name:                 row1.Name,
		Amount:               row1.Amount,
		Date:                 row1.Date,
		SourceType:           row1.SourceType,
		SourceTemplateID:     row1.SourceTemplateID,
		SourceOccurrenceDate: row1.SourceOccurrenceDate,
		GenerationMonth:      row1.GenerationMonth,
		CreatedAt:            row1.CreatedAt,
		UpdatedAt:            row1.UpdatedAt,
		DeletedAt:            row1.DeletedAt,
	}
	listRow2 := sqlc.ListIncomeByBudgetIDRow{
		ID:                   row2.ID,
		UserID:               row2.UserID,
		BudgetID:             row2.BudgetID,
		Name:                 row2.Name,
		Amount:               row2.Amount,
		Date:                 row2.Date,
		SourceType:           row2.SourceType,
		SourceTemplateID:     row2.SourceTemplateID,
		SourceOccurrenceDate: row2.SourceOccurrenceDate,
		GenerationMonth:      row2.GenerationMonth,
		CreatedAt:            row2.CreatedAt,
		UpdatedAt:            row2.UpdatedAt,
		DeletedAt:            row2.DeletedAt,
	}

	mock := &mockIncomeQuerier{
		listIncomeFunc: func(ctx context.Context, budgetID uuid.UUID) ([]sqlc.ListIncomeByBudgetIDRow, error) {
			assert.Equal(t, row1.BudgetID, budgetID)
			return []sqlc.ListIncomeByBudgetIDRow{listRow1, listRow2}, nil
		},
	}

	svc := NewIncomeService(mock)
	result, err := svc.ListByBudgetID(ctx, row1.BudgetID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestIncomeService_Update(t *testing.T) {
	ctx := context.Background()
	row := testIncomeRow()
	updatedAmount, _ := decimal.Parse("5000.00")

	mock := &mockIncomeQuerier{
		updateIncomeFunc: func(ctx context.Context, arg sqlc.UpdateIncomeParams) (sqlc.UpdateIncomeRow, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedAmount, arg.Amount)
			updated := sqlc.UpdateIncomeRow{
				ID:                   row.ID,
				UserID:               row.UserID,
				BudgetID:             row.BudgetID,
				Name:                 row.Name,
				Amount:               updatedAmount,
				Date:                 row.Date,
				SourceType:           row.SourceType,
				SourceTemplateID:     row.SourceTemplateID,
				SourceOccurrenceDate: row.SourceOccurrenceDate,
				GenerationMonth:      row.GenerationMonth,
				CreatedAt:            row.CreatedAt,
				UpdatedAt:            row.UpdatedAt,
				DeletedAt:            row.DeletedAt,
			}
			return updated, nil
		},
	}

	svc := NewIncomeService(mock)
	result, err := svc.Update(ctx, UpdateIncomeInput{
		ID:                   row.ID,
		Name:                 row.Name,
		Amount:               updatedAmount,
		Date:                 row.Date.Time,
		SourceType:           row.SourceType,
		SourceTemplateID:     uuidFromPGUUID(row.SourceTemplateID),
		SourceOccurrenceDate: dateFromPGDate(row.SourceOccurrenceDate),
		GenerationMonth:      dateFromPGDate(row.GenerationMonth),
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedAmount, result.Amount)
}

func TestIncomeService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testIncomeRow()

	mock := &mockIncomeQuerier{
		softDeleteIncomeFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			assert.Equal(t, row.ID, id)
			return 1, nil
		},
	}

	svc := NewIncomeService(mock)
	err := svc.Delete(ctx, row.ID)
	assert.NoError(t, err)
}

func TestIncomeService_Delete_NotFound(t *testing.T) {
	ctx := context.Background()
	row := testIncomeRow()

	mock := &mockIncomeQuerier{
		softDeleteIncomeFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			return 0, nil
		},
	}

	svc := NewIncomeService(mock)
	err := svc.Delete(ctx, row.ID)
	assert.ErrorIs(t, err, ErrNotFound)
}
