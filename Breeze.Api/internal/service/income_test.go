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
	createIncomeFunc     func(context.Context, sqlc.CreateIncomeParams) (sqlc.Income, error)
	getIncomeByIDFunc    func(context.Context, uuid.UUID) (sqlc.Income, error)
	listIncomeFunc       func(context.Context, uuid.UUID) ([]sqlc.Income, error)
	updateIncomeFunc     func(context.Context, sqlc.UpdateIncomeParams) (sqlc.Income, error)
	softDeleteIncomeFunc func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockIncomeQuerier) CreateIncome(ctx context.Context, arg sqlc.CreateIncomeParams) (sqlc.Income, error) {
	if m.createIncomeFunc != nil {
		return m.createIncomeFunc(ctx, arg)
	}
	return sqlc.Income{}, nil
}

func (m *mockIncomeQuerier) GetIncomeByID(ctx context.Context, id uuid.UUID) (sqlc.Income, error) {
	if m.getIncomeByIDFunc != nil {
		return m.getIncomeByIDFunc(ctx, id)
	}
	return sqlc.Income{}, nil
}

func (m *mockIncomeQuerier) ListIncomeByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.Income, error) {
	if m.listIncomeFunc != nil {
		return m.listIncomeFunc(ctx, budgetID)
	}
	return []sqlc.Income{}, nil
}

func (m *mockIncomeQuerier) UpdateIncome(ctx context.Context, arg sqlc.UpdateIncomeParams) (sqlc.Income, error) {
	if m.updateIncomeFunc != nil {
		return m.updateIncomeFunc(ctx, arg)
	}
	return sqlc.Income{}, nil
}

func (m *mockIncomeQuerier) SoftDeleteIncome(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteIncomeFunc != nil {
		return m.softDeleteIncomeFunc(ctx, id)
	}
	return 0, nil
}

func testIncomeRow() sqlc.Income {
	amount, _ := decimal.Parse("4500.00")
	incomeDate := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	sourceOccurrence := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	generationMonth := pgtype.Date{Time: time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC), Valid: true}
	templateID := uuid.New()
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.Income{
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
		createIncomeFunc: func(ctx context.Context, arg sqlc.CreateIncomeParams) (sqlc.Income, error) {
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

	mock := &mockIncomeQuerier{
		getIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Income, error) {
			assert.Equal(t, row.ID, id)
			return row, nil
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
		getIncomeByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Income, error) {
			return sqlc.Income{}, pgx.ErrNoRows
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

	mock := &mockIncomeQuerier{
		listIncomeFunc: func(ctx context.Context, budgetID uuid.UUID) ([]sqlc.Income, error) {
			assert.Equal(t, row1.BudgetID, budgetID)
			return []sqlc.Income{row1, row2}, nil
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
		updateIncomeFunc: func(ctx context.Context, arg sqlc.UpdateIncomeParams) (sqlc.Income, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedAmount, arg.Amount)
			updated := row
			updated.Amount = updatedAmount
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
