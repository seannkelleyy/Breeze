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

type mockAssetQuerier struct {
	createAssetFunc        func(context.Context, sqlc.CreateAssetParams) (sqlc.Asset, error)
	getAssetByIDFunc       func(context.Context, uuid.UUID) (sqlc.Asset, error)
	listAssetsByUserIDFunc func(context.Context, uuid.UUID) ([]sqlc.Asset, error)
	updateAssetFunc        func(context.Context, sqlc.UpdateAssetParams) (sqlc.Asset, error)
	softDeleteAssetFunc    func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockAssetQuerier) CreateAsset(ctx context.Context, params sqlc.CreateAssetParams) (sqlc.Asset, error) {
	if m.createAssetFunc != nil {
		return m.createAssetFunc(ctx, params)
	}
	return sqlc.Asset{}, nil
}

func (m *mockAssetQuerier) GetAssetByID(ctx context.Context, id uuid.UUID) (sqlc.Asset, error) {
	if m.getAssetByIDFunc != nil {
		return m.getAssetByIDFunc(ctx, id)
	}
	return sqlc.Asset{}, nil
}

func (m *mockAssetQuerier) ListAssetsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Asset, error) {
	if m.listAssetsByUserIDFunc != nil {
		return m.listAssetsByUserIDFunc(ctx, userID)
	}
	return []sqlc.Asset{}, nil
}

func (m *mockAssetQuerier) UpdateAsset(ctx context.Context, params sqlc.UpdateAssetParams) (sqlc.Asset, error) {
	if m.updateAssetFunc != nil {
		return m.updateAssetFunc(ctx, params)
	}
	return sqlc.Asset{}, nil
}

func (m *mockAssetQuerier) SoftDeleteAsset(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteAssetFunc != nil {
		return m.softDeleteAssetFunc(ctx, id)
	}
	return 0, nil
}

func testAssetRow() sqlc.Asset {
	assetID := uuid.New()
	userID := uuid.New()
	currentValue, _ := decimal.Parse("125000.55")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.Asset{
		ID:                 assetID,
		UserID:             userID,
		Name:               "Brokerage",
		AssetType:          sqlc.AssetTypeINVESTMENT,
		CurrentValue:       currentValue,
		LastValueUpdatedAt: timestamp,
		CreatedAt:          timestamp,
		UpdatedAt:          timestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func TestAssetService_Create(t *testing.T) {
	ctx := context.Background()
	assetRow := testAssetRow()

	mock := &mockAssetQuerier{
		createAssetFunc: func(ctx context.Context, params sqlc.CreateAssetParams) (sqlc.Asset, error) {
			assert.Equal(t, assetRow.UserID, params.UserID)
			assert.Equal(t, "Brokerage", params.Name)
			return assetRow, nil
		},
	}

	svc := NewAssetService(mock)
	input := CreateAssetInput{
		UserID:       assetRow.UserID,
		Name:         "Brokerage",
		AssetType:    sqlc.AssetTypeINVESTMENT,
		CurrentValue: assetRow.CurrentValue,
	}

	result, err := svc.Create(ctx, input)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, assetRow.ID, result.ID)
	assert.Equal(t, assetRow.Name, result.Name)
}

func TestAssetService_GetByID(t *testing.T) {
	ctx := context.Background()
	assetRow := testAssetRow()

	t.Run("retrieves by id", func(t *testing.T) {
		mock := &mockAssetQuerier{
			getAssetByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Asset, error) {
				assert.Equal(t, assetRow.ID, id)
				return assetRow, nil
			},
		}

		svc := NewAssetService(mock)
		result, err := svc.GetByID(ctx, assetRow.ID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, assetRow.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockAssetQuerier{
			getAssetByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.Asset, error) {
				return sqlc.Asset{}, pgx.ErrNoRows
			},
		}

		svc := NewAssetService(mock)
		result, err := svc.GetByID(ctx, assetRow.ID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestAssetService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	asset1 := testAssetRow()
	asset2 := testAssetRow()
	asset2.ID = uuid.New()
	asset2.Name = "Checking"

	mock := &mockAssetQuerier{
		listAssetsByUserIDFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.Asset, error) {
			assert.Equal(t, asset1.UserID, userID)
			return []sqlc.Asset{asset1, asset2}, nil
		},
	}

	svc := NewAssetService(mock)
	result, err := svc.ListByUserID(ctx, asset1.UserID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, asset1.ID, result[0].ID)
	assert.Equal(t, asset2.ID, result[1].ID)
}

func TestAssetService_Update(t *testing.T) {
	ctx := context.Background()
	assetRow := testAssetRow()
	updatedValue, _ := decimal.Parse("130000.00")

	mock := &mockAssetQuerier{
		updateAssetFunc: func(ctx context.Context, params sqlc.UpdateAssetParams) (sqlc.Asset, error) {
			assert.Equal(t, assetRow.ID, params.ID)
			assert.Equal(t, "Brokerage Updated", params.Name)
			updated := assetRow
			updated.Name = params.Name
			updated.CurrentValue = params.CurrentValue
			return updated, nil
		},
	}

	svc := NewAssetService(mock)
	result, err := svc.Update(ctx, UpdateAssetInput{
		ID:           assetRow.ID,
		Name:         "Brokerage Updated",
		AssetType:    sqlc.AssetTypeINVESTMENT,
		CurrentValue: updatedValue,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Brokerage Updated", result.Name)
}

func TestAssetService_Delete(t *testing.T) {
	ctx := context.Background()
	assetRow := testAssetRow()

	t.Run("deletes asset", func(t *testing.T) {
		mock := &mockAssetQuerier{
			softDeleteAssetFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				assert.Equal(t, assetRow.ID, id)
				return 1, nil
			},
		}

		svc := NewAssetService(mock)
		err := svc.Delete(ctx, assetRow.ID)
		assert.NoError(t, err)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockAssetQuerier{
			softDeleteAssetFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, nil
			},
		}

		svc := NewAssetService(mock)
		err := svc.Delete(ctx, assetRow.ID)
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("wraps db error", func(t *testing.T) {
		mock := &mockAssetQuerier{
			softDeleteAssetFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, errors.New("boom")
			},
		}

		svc := NewAssetService(mock)
		err := svc.Delete(ctx, assetRow.ID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "delete asset")
	})
}
