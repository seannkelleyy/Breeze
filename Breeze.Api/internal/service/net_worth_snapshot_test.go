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

type mockNetWorthSnapshotQuerier struct {
	createNetWorthSnapshotFunc    func(context.Context, sqlc.CreateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error)
	getNetWorthSnapshotFunc       func(context.Context, uuid.UUID) (sqlc.NetWorthSnapshot, error)
	getNetWorthSnapshotByDateFunc func(context.Context, sqlc.GetNetWorthSnapshotByDateParams) (sqlc.NetWorthSnapshot, error)
	listNetWorthSnapshotsFunc     func(context.Context, uuid.UUID) ([]sqlc.NetWorthSnapshot, error)
	updateNetWorthSnapshotFunc    func(context.Context, sqlc.UpdateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error)
	deleteNetWorthSnapshotFunc    func(context.Context, uuid.UUID) error
}

func (m *mockNetWorthSnapshotQuerier) CreateNetWorthSnapshot(ctx context.Context, arg sqlc.CreateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error) {
	if m.createNetWorthSnapshotFunc != nil {
		return m.createNetWorthSnapshotFunc(ctx, arg)
	}
	return sqlc.NetWorthSnapshot{}, nil
}

func (m *mockNetWorthSnapshotQuerier) GetNetWorthSnapshot(ctx context.Context, id uuid.UUID) (sqlc.NetWorthSnapshot, error) {
	if m.getNetWorthSnapshotFunc != nil {
		return m.getNetWorthSnapshotFunc(ctx, id)
	}
	return sqlc.NetWorthSnapshot{}, nil
}

func (m *mockNetWorthSnapshotQuerier) GetNetWorthSnapshotByDate(ctx context.Context, arg sqlc.GetNetWorthSnapshotByDateParams) (sqlc.NetWorthSnapshot, error) {
	if m.getNetWorthSnapshotByDateFunc != nil {
		return m.getNetWorthSnapshotByDateFunc(ctx, arg)
	}
	return sqlc.NetWorthSnapshot{}, nil
}

func (m *mockNetWorthSnapshotQuerier) ListNetWorthSnapshots(ctx context.Context, userID uuid.UUID) ([]sqlc.NetWorthSnapshot, error) {
	if m.listNetWorthSnapshotsFunc != nil {
		return m.listNetWorthSnapshotsFunc(ctx, userID)
	}
	return []sqlc.NetWorthSnapshot{}, nil
}

func (m *mockNetWorthSnapshotQuerier) UpdateNetWorthSnapshot(ctx context.Context, arg sqlc.UpdateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error) {
	if m.updateNetWorthSnapshotFunc != nil {
		return m.updateNetWorthSnapshotFunc(ctx, arg)
	}
	return sqlc.NetWorthSnapshot{}, nil
}

func (m *mockNetWorthSnapshotQuerier) DeleteNetWorthSnapshot(ctx context.Context, id uuid.UUID) error {
	if m.deleteNetWorthSnapshotFunc != nil {
		return m.deleteNetWorthSnapshotFunc(ctx, id)
	}
	return nil
}

func testNetWorthSnapshotRow() sqlc.NetWorthSnapshot {
	totalAssets, _ := decimal.Parse("450000.00")
	totalLiabilities, _ := decimal.Parse("250000.00")
	netWorth, _ := decimal.Parse("200000.00")
	snapshotDate := pgtype.Date{Time: time.Now().UTC(), Valid: true}
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.NetWorthSnapshot{
		ID:               uuid.New(),
		UserID:           uuid.New(),
		SnapshotDate:     snapshotDate,
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
		NetWorth:         netWorth,
		CreatedAt:        timestamp,
		UpdatedAt:        timestamp,
		DeletedAt:        pgtype.Timestamptz{},
	}
}

func TestNetWorthSnapshotService_Create(t *testing.T) {
	ctx := context.Background()
	row := testNetWorthSnapshotRow()

	mock := &mockNetWorthSnapshotQuerier{
		createNetWorthSnapshotFunc: func(ctx context.Context, arg sqlc.CreateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.TotalAssets, arg.TotalAssets)
			assert.Equal(t, row.SnapshotDate.Time, arg.SnapshotDate.Time)
			return row, nil
		},
	}

	svc := NewNetWorthSnapshotService(mock)
	result, err := svc.Create(ctx, CreateNetWorthSnapshotInput{
		UserID:           row.UserID,
		SnapshotDate:     row.SnapshotDate.Time,
		TotalAssets:      row.TotalAssets,
		TotalLiabilities: row.TotalLiabilities,
		NetWorth:         row.NetWorth,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestNetWorthSnapshotService_Get(t *testing.T) {
	ctx := context.Background()
	row := testNetWorthSnapshotRow()

	t.Run("retrieves by id", func(t *testing.T) {
		mock := &mockNetWorthSnapshotQuerier{
			getNetWorthSnapshotFunc: func(ctx context.Context, id uuid.UUID) (sqlc.NetWorthSnapshot, error) {
				assert.Equal(t, row.ID, id)
				return row, nil
			},
		}

		svc := NewNetWorthSnapshotService(mock)
		result, err := svc.Get(ctx, row.ID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockNetWorthSnapshotQuerier{
			getNetWorthSnapshotFunc: func(ctx context.Context, id uuid.UUID) (sqlc.NetWorthSnapshot, error) {
				return sqlc.NetWorthSnapshot{}, pgx.ErrNoRows
			},
		}

		svc := NewNetWorthSnapshotService(mock)
		result, err := svc.Get(ctx, row.ID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestNetWorthSnapshotService_GetByDate(t *testing.T) {
	ctx := context.Background()
	row := testNetWorthSnapshotRow()

	t.Run("retrieves by date", func(t *testing.T) {
		mock := &mockNetWorthSnapshotQuerier{
			getNetWorthSnapshotByDateFunc: func(ctx context.Context, arg sqlc.GetNetWorthSnapshotByDateParams) (sqlc.NetWorthSnapshot, error) {
				assert.Equal(t, row.UserID, arg.UserID)
				assert.Equal(t, row.SnapshotDate.Time, arg.SnapshotDate.Time)
				return row, nil
			},
		}

		svc := NewNetWorthSnapshotService(mock)
		result, err := svc.GetByDate(ctx, row.UserID, row.SnapshotDate.Time)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockNetWorthSnapshotQuerier{
			getNetWorthSnapshotByDateFunc: func(ctx context.Context, arg sqlc.GetNetWorthSnapshotByDateParams) (sqlc.NetWorthSnapshot, error) {
				return sqlc.NetWorthSnapshot{}, pgx.ErrNoRows
			},
		}

		svc := NewNetWorthSnapshotService(mock)
		result, err := svc.GetByDate(ctx, row.UserID, row.SnapshotDate.Time)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestNetWorthSnapshotService_List(t *testing.T) {
	ctx := context.Background()
	row1 := testNetWorthSnapshotRow()
	row2 := testNetWorthSnapshotRow()
	row2.ID = uuid.New()

	mock := &mockNetWorthSnapshotQuerier{
		listNetWorthSnapshotsFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.NetWorthSnapshot, error) {
			assert.Equal(t, row1.UserID, userID)
			return []sqlc.NetWorthSnapshot{row1, row2}, nil
		},
	}

	svc := NewNetWorthSnapshotService(mock)
	result, err := svc.List(ctx, row1.UserID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestNetWorthSnapshotService_Update(t *testing.T) {
	ctx := context.Background()
	row := testNetWorthSnapshotRow()
	updatedAssets, _ := decimal.Parse("460000.00")

	mock := &mockNetWorthSnapshotQuerier{
		updateNetWorthSnapshotFunc: func(ctx context.Context, arg sqlc.UpdateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error) {
			expectedAssets, err := decimalToPGNumeric(&updatedAssets)
			assert.NoError(t, err)
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, expectedAssets, arg.TotalAssets)

			updated := row
			updated.TotalAssets = updatedAssets
			return updated, nil
		},
	}

	svc := NewNetWorthSnapshotService(mock)
	result, err := svc.Update(ctx, UpdateNetWorthSnapshotInput{
		ID:          row.ID,
		TotalAssets: &updatedAssets,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedAssets, result.TotalAssets)
}

func TestNetWorthSnapshotService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testNetWorthSnapshotRow()

	mock := &mockNetWorthSnapshotQuerier{
		deleteNetWorthSnapshotFunc: func(ctx context.Context, id uuid.UUID) error {
			assert.Equal(t, row.ID, id)
			return nil
		},
	}

	svc := NewNetWorthSnapshotService(mock)
	err := svc.Delete(ctx, row.ID)

	assert.NoError(t, err)
}

func TestNetWorthSnapshotService_Delete_ReturnsError(t *testing.T) {
	ctx := context.Background()
	errDelete := errors.New("delete failed")

	mock := &mockNetWorthSnapshotQuerier{
		deleteNetWorthSnapshotFunc: func(ctx context.Context, id uuid.UUID) error {
			return errDelete
		},
	}

	svc := NewNetWorthSnapshotService(mock)
	err := svc.Delete(ctx, uuid.New())

	assert.ErrorIs(t, err, errDelete)
}
