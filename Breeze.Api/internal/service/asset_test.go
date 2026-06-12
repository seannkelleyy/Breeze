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
	createAssetFunc        func(context.Context, sqlc.CreateAssetParams) (sqlc.CreateAssetRow, error)
	getAssetByIDFunc       func(context.Context, uuid.UUID) (sqlc.GetAssetByIDRow, error)
	listAssetsByUserIDFunc func(context.Context, uuid.UUID) ([]sqlc.ListAssetsByUserIDRow, error)
	updateAssetFunc        func(context.Context, sqlc.UpdateAssetParams) (sqlc.UpdateAssetRow, error)
	softDeleteAssetFunc    func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockAssetQuerier) CreateAsset(ctx context.Context, params sqlc.CreateAssetParams) (sqlc.CreateAssetRow, error) {
	if m.createAssetFunc != nil {
		return m.createAssetFunc(ctx, params)
	}
	return sqlc.CreateAssetRow{}, nil
}

func (m *mockAssetQuerier) GetAssetByID(ctx context.Context, id uuid.UUID) (sqlc.GetAssetByIDRow, error) {
	if m.getAssetByIDFunc != nil {
		return m.getAssetByIDFunc(ctx, id)
	}
	return sqlc.GetAssetByIDRow{}, nil
}

func (m *mockAssetQuerier) ListAssetsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListAssetsByUserIDRow, error) {
	if m.listAssetsByUserIDFunc != nil {
		return m.listAssetsByUserIDFunc(ctx, userID)
	}
	return []sqlc.ListAssetsByUserIDRow{}, nil
}

func (m *mockAssetQuerier) UpdateAsset(ctx context.Context, params sqlc.UpdateAssetParams) (sqlc.UpdateAssetRow, error) {
	if m.updateAssetFunc != nil {
		return m.updateAssetFunc(ctx, params)
	}
	return sqlc.UpdateAssetRow{}, nil
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
		AssetType:          sqlc.AssetTypeBROKERAGE,
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
		createAssetFunc: func(ctx context.Context, params sqlc.CreateAssetParams) (sqlc.CreateAssetRow, error) {
			assert.Equal(t, assetRow.UserID, params.UserID)
			assert.Equal(t, "Brokerage", params.Name)
			return sqlc.CreateAssetRow{
				ID:                              assetRow.ID,
				UserID:                          assetRow.UserID,
				Name:                            assetRow.Name,
				AssetType:                       assetRow.AssetType,
				CurrentValue:                    assetRow.CurrentValue,
				Owner:                           assetRow.Owner,
				ContributionMode:                assetRow.ContributionMode,
				ContributionValue:               assetRow.ContributionValue,
				EmployerMatchRate:               assetRow.EmployerMatchRate,
				EmployerMatchMaxPercentOfSalary: assetRow.EmployerMatchMaxPercentOfSalary,
				AnnualRate:                      assetRow.AnnualRate,
				LastValueUpdatedAt:              assetRow.LastValueUpdatedAt,
				CreatedAt:                       assetRow.CreatedAt,
				UpdatedAt:                       assetRow.UpdatedAt,
				DeletedAt:                       assetRow.DeletedAt,
			}, nil
		},
	}

	svc := NewAssetService(mock)
	input := CreateAssetInput{
		UserID:       assetRow.UserID,
		Name:         "Brokerage",
		AssetType:    sqlc.AssetTypeBROKERAGE,
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
			getAssetByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetAssetByIDRow, error) {
				assert.Equal(t, assetRow.ID, id)
				return sqlc.GetAssetByIDRow{
					ID:                              assetRow.ID,
					UserID:                          assetRow.UserID,
					Name:                            assetRow.Name,
					AssetType:                       assetRow.AssetType,
					CurrentValue:                    assetRow.CurrentValue,
					Owner:                           assetRow.Owner,
					ContributionMode:                assetRow.ContributionMode,
					ContributionValue:               assetRow.ContributionValue,
					EmployerMatchRate:               assetRow.EmployerMatchRate,
					EmployerMatchMaxPercentOfSalary: assetRow.EmployerMatchMaxPercentOfSalary,
					AnnualRate:                      assetRow.AnnualRate,
					LastValueUpdatedAt:              assetRow.LastValueUpdatedAt,
					CreatedAt:                       assetRow.CreatedAt,
					UpdatedAt:                       assetRow.UpdatedAt,
					DeletedAt:                       assetRow.DeletedAt,
				}, nil
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
			getAssetByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetAssetByIDRow, error) {
				return sqlc.GetAssetByIDRow{}, pgx.ErrNoRows
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
		listAssetsByUserIDFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.ListAssetsByUserIDRow, error) {
			assert.Equal(t, asset1.UserID, userID)
			return []sqlc.ListAssetsByUserIDRow{
				{
					ID:                              asset1.ID,
					UserID:                          asset1.UserID,
					Name:                            asset1.Name,
					AssetType:                       asset1.AssetType,
					CurrentValue:                    asset1.CurrentValue,
					Owner:                           asset1.Owner,
					ContributionMode:                asset1.ContributionMode,
					ContributionValue:               asset1.ContributionValue,
					EmployerMatchRate:               asset1.EmployerMatchRate,
					EmployerMatchMaxPercentOfSalary: asset1.EmployerMatchMaxPercentOfSalary,
					AnnualRate:                      asset1.AnnualRate,
					LastValueUpdatedAt:              asset1.LastValueUpdatedAt,
					CreatedAt:                       asset1.CreatedAt,
					UpdatedAt:                       asset1.UpdatedAt,
					DeletedAt:                       asset1.DeletedAt,
				},
				{
					ID:                              asset2.ID,
					UserID:                          asset2.UserID,
					Name:                            asset2.Name,
					AssetType:                       asset2.AssetType,
					CurrentValue:                    asset2.CurrentValue,
					Owner:                           asset2.Owner,
					ContributionMode:                asset2.ContributionMode,
					ContributionValue:               asset2.ContributionValue,
					EmployerMatchRate:               asset2.EmployerMatchRate,
					EmployerMatchMaxPercentOfSalary: asset2.EmployerMatchMaxPercentOfSalary,
					AnnualRate:                      asset2.AnnualRate,
					LastValueUpdatedAt:              asset2.LastValueUpdatedAt,
					CreatedAt:                       asset2.CreatedAt,
					UpdatedAt:                       asset2.UpdatedAt,
					DeletedAt:                       asset2.DeletedAt,
				},
			}, nil
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
		updateAssetFunc: func(ctx context.Context, params sqlc.UpdateAssetParams) (sqlc.UpdateAssetRow, error) {
			assert.Equal(t, assetRow.ID, params.ID)
			assert.Equal(t, "Brokerage Updated", params.Name)
			updated := assetRow
			updated.Name = params.Name
			updated.CurrentValue = params.CurrentValue
			return sqlc.UpdateAssetRow{
				ID:                              updated.ID,
				UserID:                          updated.UserID,
				Name:                            updated.Name,
				AssetType:                       updated.AssetType,
				CurrentValue:                    updated.CurrentValue,
				Owner:                           updated.Owner,
				ContributionMode:                updated.ContributionMode,
				ContributionValue:               updated.ContributionValue,
				EmployerMatchRate:               updated.EmployerMatchRate,
				EmployerMatchMaxPercentOfSalary: updated.EmployerMatchMaxPercentOfSalary,
				AnnualRate:                      updated.AnnualRate,
				LastValueUpdatedAt:              updated.LastValueUpdatedAt,
				CreatedAt:                       updated.CreatedAt,
				UpdatedAt:                       updated.UpdatedAt,
				DeletedAt:                       updated.DeletedAt,
			}, nil
		},
	}

	svc := NewAssetService(mock)
	result, err := svc.Update(ctx, UpdateAssetInput{
		ID:           assetRow.ID,
		Name:         "Brokerage Updated",
		AssetType:    sqlc.AssetTypeBROKERAGE,
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
