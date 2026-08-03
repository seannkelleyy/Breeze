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

type mockTaxBracketQuerier struct {
	createTaxBracketFunc                     func(context.Context, sqlc.CreateTaxBracketParams) (sqlc.TaxBracket, error)
	getTaxBracketByIDFunc                    func(context.Context, uuid.UUID) (sqlc.TaxBracket, error)
	listTaxBracketsByYearAndFilingStatusFunc func(context.Context, sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error)
	updateTaxBracketFunc                     func(context.Context, sqlc.UpdateTaxBracketParams) (sqlc.TaxBracket, error)
	softDeleteTaxBracketFunc                 func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockTaxBracketQuerier) CreateTaxBracket(ctx context.Context, arg sqlc.CreateTaxBracketParams) (sqlc.TaxBracket, error) {
	if m.createTaxBracketFunc != nil {
		return m.createTaxBracketFunc(ctx, arg)
	}
	return sqlc.TaxBracket{}, nil
}

func (m *mockTaxBracketQuerier) GetTaxBracketByID(ctx context.Context, id uuid.UUID) (sqlc.TaxBracket, error) {
	if m.getTaxBracketByIDFunc != nil {
		return m.getTaxBracketByIDFunc(ctx, id)
	}
	return sqlc.TaxBracket{}, nil
}

func (m *mockTaxBracketQuerier) ListTaxBracketsByYearAndFilingStatus(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
	if m.listTaxBracketsByYearAndFilingStatusFunc != nil {
		return m.listTaxBracketsByYearAndFilingStatusFunc(ctx, arg)
	}
	return []sqlc.TaxBracket{}, nil
}

func (m *mockTaxBracketQuerier) UpdateTaxBracket(ctx context.Context, arg sqlc.UpdateTaxBracketParams) (sqlc.TaxBracket, error) {
	if m.updateTaxBracketFunc != nil {
		return m.updateTaxBracketFunc(ctx, arg)
	}
	return sqlc.TaxBracket{}, nil
}

func (m *mockTaxBracketQuerier) SoftDeleteTaxBracket(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteTaxBracketFunc != nil {
		return m.softDeleteTaxBracketFunc(ctx, id)
	}
	return 0, nil
}

func testTaxBracketRow() sqlc.TaxBracket {
	minimumAmount, _ := decimal.Parse("0.00")
	maximumAmount, _ := decimal.Parse("11000.00")
	rate, _ := decimal.Parse("0.1000")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	var max pgtype.Numeric
	_ = max.Scan(maximumAmount.String())

	return sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2026,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: minimumAmount,
		MaximumAmount: max,
		Rate:          rate,
		CreatedAt:     timestamp,
		UpdatedAt:     timestamp,
		DeletedAt:     pgtype.Timestamptz{},
	}
}

func TestTaxBracketService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testTaxBracketRow()

	t.Run("retrieves tax bracket by id", func(t *testing.T) {
		mock := &mockTaxBracketQuerier{
			getTaxBracketByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.TaxBracket, error) {
				assert.Equal(t, row.ID, id)
				return row, nil
			},
		}

		svc := NewTaxBracketService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
		assert.Equal(t, int32(2026), result.Year)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockTaxBracketQuerier{
			getTaxBracketByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.TaxBracket, error) {
				return sqlc.TaxBracket{}, pgx.ErrNoRows
			},
		}

		svc := NewTaxBracketService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestTaxBracketService_ListByYearAndFilingStatus(t *testing.T) {
	ctx := context.Background()
	row1 := testTaxBracketRow()
	row2 := testTaxBracketRow()
	row2.ID = uuid.New()
	row2.MinimumAmount, _ = decimal.Parse("11000.01")

	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			assert.Equal(t, int32(2026), arg.Year)
			assert.Equal(t, sqlc.FilingStatusSINGLE, arg.FilingStatus)
			return []sqlc.TaxBracket{row1, row2}, nil
		},
	}

	svc := NewTaxBracketService(mock)
	result, err := svc.ListByYearAndFilingStatus(ctx, 2026, sqlc.FilingStatusSINGLE)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestTaxBracketService_ListByYearAndFilingStatus_WrapsError(t *testing.T) {
	ctx := context.Background()
	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return nil, errors.New("boom")
		},
	}

	svc := NewTaxBracketService(mock)
	result, err := svc.ListByYearAndFilingStatus(ctx, 2026, sqlc.FilingStatusSINGLE)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "list tax brackets")
}

func TestTaxBracketService_Create(t *testing.T) {
	ctx := context.Background()
	row := testTaxBracketRow()
	maximumAmount, _ := decimal.Parse("11000.00")

	mock := &mockTaxBracketQuerier{
		createTaxBracketFunc: func(ctx context.Context, arg sqlc.CreateTaxBracketParams) (sqlc.TaxBracket, error) {
			assert.Equal(t, int32(2026), arg.Year)
			assert.Equal(t, sqlc.FilingStatusSINGLE, arg.FilingStatus)
			assert.Equal(t, row.MinimumAmount, arg.MinimumAmount)
			assert.Equal(t, row.Rate, arg.Rate)
			assert.True(t, arg.MaximumAmount.Valid)
			return row, nil
		},
	}

	svc := NewTaxBracketService(mock)
	result, err := svc.Create(ctx, CreateTaxBracketInput{
		Year:          2026,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: row.MinimumAmount,
		MaximumAmount: &maximumAmount,
		Rate:          row.Rate,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestTaxBracketService_Update(t *testing.T) {
	ctx := context.Background()
	row := testTaxBracketRow()
	updatedRate, _ := decimal.Parse("0.1200")

	mock := &mockTaxBracketQuerier{
		updateTaxBracketFunc: func(ctx context.Context, arg sqlc.UpdateTaxBracketParams) (sqlc.TaxBracket, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, int32(2026), arg.Year)
			assert.Equal(t, updatedRate, arg.Rate)
			updated := row
			updated.Rate = arg.Rate
			return updated, nil
		},
	}

	svc := NewTaxBracketService(mock)
	result, err := svc.Update(ctx, UpdateTaxBracketInput{
		ID:            row.ID,
		Year:          2026,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: row.MinimumAmount,
		Rate:          updatedRate,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedRate, result.Rate)
}

func TestTaxBracketService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testTaxBracketRow()

	t.Run("deletes tax bracket", func(t *testing.T) {
		mock := &mockTaxBracketQuerier{
			softDeleteTaxBracketFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				assert.Equal(t, row.ID, id)
				return 1, nil
			},
		}

		svc := NewTaxBracketService(mock)
		err := svc.Delete(ctx, row.ID)

		assert.NoError(t, err)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockTaxBracketQuerier{
			softDeleteTaxBracketFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, nil
			},
		}

		svc := NewTaxBracketService(mock)
		err := svc.Delete(ctx, row.ID)

		assert.ErrorIs(t, err, ErrNotFound)
	})
}
