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

type mockLiabilityQuerier struct {
	createLiabilityFunc         func(context.Context, sqlc.CreateLiabilityParams) (sqlc.Liability, error)
	getLiabilityByIDFunc        func(context.Context, uuid.UUID) (sqlc.Liability, error)
	listLiabilitiesByUserIDFunc func(context.Context, uuid.UUID) ([]sqlc.Liability, error)
	updateLiabilityFunc         func(context.Context, sqlc.UpdateLiabilityParams) (sqlc.Liability, error)
	softDeleteLiabilityFunc     func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockLiabilityQuerier) CreateLiability(ctx context.Context, arg sqlc.CreateLiabilityParams) (sqlc.Liability, error) {
	if m.createLiabilityFunc != nil {
		return m.createLiabilityFunc(ctx, arg)
	}
	return sqlc.Liability{}, nil
}

func (m *mockLiabilityQuerier) GetLiabilityByID(ctx context.Context, id uuid.UUID) (sqlc.Liability, error) {
	if m.getLiabilityByIDFunc != nil {
		return m.getLiabilityByIDFunc(ctx, id)
	}
	return sqlc.Liability{}, nil
}

func (m *mockLiabilityQuerier) ListLiabilitiesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Liability, error) {
	if m.listLiabilitiesByUserIDFunc != nil {
		return m.listLiabilitiesByUserIDFunc(ctx, userID)
	}
	return []sqlc.Liability{}, nil
}

func (m *mockLiabilityQuerier) UpdateLiability(ctx context.Context, arg sqlc.UpdateLiabilityParams) (sqlc.Liability, error) {
	if m.updateLiabilityFunc != nil {
		return m.updateLiabilityFunc(ctx, arg)
	}
	return sqlc.Liability{}, nil
}

func (m *mockLiabilityQuerier) SoftDeleteLiability(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteLiabilityFunc != nil {
		return m.softDeleteLiabilityFunc(ctx, id)
	}
	return 0, nil
}

func testLiabilityRow() sqlc.Liability {
	currentBalance, _ := decimal.Parse("250000.00")
	interestRate, _ := decimal.Parse("0.0650")
	minimumPayment, _ := decimal.Parse("1800.00")
	targetExtraPayment, _ := decimal.Parse("500.00")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.Liability{
		ID:                   uuid.New(),
		UserID:               uuid.New(),
		Name:                 "Mortgage",
		LiabilityType:        sqlc.LiabilityType("MORTGAGE"),
		CurrentBalance:       currentBalance,
		InterestRate:         interestRate,
		MinimumPayment:       minimumPayment,
		TargetExtraPayment:   targetExtraPayment,
		PayoffPriority:       1,
		LastBalanceUpdatedAt: timestamp,
		CreatedAt:            timestamp,
		UpdatedAt:            timestamp,
		DeletedAt:            pgtype.Timestamptz{},
	}
}

func TestLiabilityService_Create(t *testing.T) {
	ctx := context.Background()
	row := testLiabilityRow()

	mock := &mockLiabilityQuerier{
		createLiabilityFunc: func(ctx context.Context, arg sqlc.CreateLiabilityParams) (sqlc.Liability, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.Name, arg.Name)
			return row, nil
		},
	}

	svc := NewLiabilityService(mock)
	result, err := svc.Create(ctx, CreateLiabilityInput{
		UserID:             row.UserID,
		Name:               row.Name,
		LiabilityType:      row.LiabilityType,
		CurrentBalance:     row.CurrentBalance,
		InterestRate:       row.InterestRate,
		MinimumPayment:     row.MinimumPayment,
		TargetExtraPayment: row.TargetExtraPayment,
		PayoffPriority:     row.PayoffPriority,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestLiabilityService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testLiabilityRow()

	t.Run("retrieves by id", func(t *testing.T) {
		mock := &mockLiabilityQuerier{
			getLiabilityByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Liability, error) {
				assert.Equal(t, row.ID, id)
				return row, nil
			},
		}

		svc := NewLiabilityService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockLiabilityQuerier{
			getLiabilityByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Liability, error) {
				return sqlc.Liability{}, pgx.ErrNoRows
			},
		}

		svc := NewLiabilityService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestLiabilityService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	row1 := testLiabilityRow()
	row2 := testLiabilityRow()
	row2.ID = uuid.New()
	row2.Name = "Credit Card"

	mock := &mockLiabilityQuerier{
		listLiabilitiesByUserIDFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.Liability, error) {
			assert.Equal(t, row1.UserID, userID)
			return []sqlc.Liability{row1, row2}, nil
		},
	}

	svc := NewLiabilityService(mock)
	result, err := svc.ListByUserID(ctx, row1.UserID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestLiabilityService_Update(t *testing.T) {
	ctx := context.Background()
	row := testLiabilityRow()
	updatedBalance, _ := decimal.Parse("240000.00")

	mock := &mockLiabilityQuerier{
		updateLiabilityFunc: func(ctx context.Context, arg sqlc.UpdateLiabilityParams) (sqlc.Liability, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedBalance, arg.CurrentBalance)
			updated := row
			updated.CurrentBalance = arg.CurrentBalance
			return updated, nil
		},
	}

	svc := NewLiabilityService(mock)
	result, err := svc.Update(ctx, UpdateLiabilityInput{
		ID:                 row.ID,
		Name:               "Mortgage Updated",
		LiabilityType:      row.LiabilityType,
		CurrentBalance:     updatedBalance,
		InterestRate:       row.InterestRate,
		MinimumPayment:     row.MinimumPayment,
		TargetExtraPayment: row.TargetExtraPayment,
		PayoffPriority:     row.PayoffPriority,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedBalance, result.CurrentBalance)
}

func TestLiabilityService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testLiabilityRow()

	t.Run("deletes liability", func(t *testing.T) {
		mock := &mockLiabilityQuerier{
			softDeleteLiabilityFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				assert.Equal(t, row.ID, id)
				return 1, nil
			},
		}

		svc := NewLiabilityService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.NoError(t, err)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockLiabilityQuerier{
			softDeleteLiabilityFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, nil
			},
		}

		svc := NewLiabilityService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("wraps db error", func(t *testing.T) {
		mock := &mockLiabilityQuerier{
			softDeleteLiabilityFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, errors.New("boom")
			},
		}

		svc := NewLiabilityService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "delete liability")
	})
}
