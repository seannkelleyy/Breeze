package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
)

type Asset struct {
	ID                              uuid.UUID
	UserID                          uuid.UUID
	Name                            string
	AssetType                       sqlc.AssetType
	CurrentValue                    decimal.Decimal
	ContributionMode                string
	ContributionValue               decimal.Decimal
	EmployerMatchRate               decimal.Decimal
	EmployerMatchMaxPercentOfSalary decimal.Decimal
	AnnualRate                      decimal.Decimal
	PersonIDs                       []uuid.UUID
	PurchaseDate                    *string
	PurchasePrice                   *decimal.Decimal
	HomeGrowthProfile               *string
	VehicleDepreciationProfile      *string
	LinkedLiabilityID               *uuid.UUID
	PlaidAccountID                  *uuid.UUID
	LastValueUpdatedAt              time.Time
	CreatedAt                       time.Time
	UpdatedAt                       time.Time
}

type CreateAssetInput struct {
	UserID                          uuid.UUID
	Name                            string
	AssetType                       sqlc.AssetType
	CurrentValue                    decimal.Decimal
	ContributionMode                string
	ContributionValue               decimal.Decimal
	EmployerMatchRate               decimal.Decimal
	EmployerMatchMaxPercentOfSalary decimal.Decimal
	AnnualRate                      decimal.Decimal
	PersonIDs                       []uuid.UUID
	PurchaseDate                    *string
	PurchasePrice                   *decimal.Decimal
	HomeGrowthProfile               *string
	VehicleDepreciationProfile      *string
	LinkedLiabilityID               *uuid.UUID
}

type UpdateAssetInput struct {
	ID                              uuid.UUID
	Name                            string
	AssetType                       sqlc.AssetType
	CurrentValue                    decimal.Decimal
	ContributionMode                string
	ContributionValue               decimal.Decimal
	EmployerMatchRate               decimal.Decimal
	EmployerMatchMaxPercentOfSalary decimal.Decimal
	AnnualRate                      decimal.Decimal
	PersonIDs                       []uuid.UUID
	PurchaseDate                    *string
	PurchasePrice                   *decimal.Decimal
	HomeGrowthProfile               *string
	VehicleDepreciationProfile      *string
	LinkedLiabilityID               *uuid.UUID
}

type assetQuerier interface {
	CreateAsset(ctx context.Context, arg sqlc.CreateAssetParams) (sqlc.CreateAssetRow, error)
	GetAssetByID(ctx context.Context, id uuid.UUID) (sqlc.GetAssetByIDRow, error)
	ListAssetsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListAssetsByUserIDRow, error)
	UpdateAsset(ctx context.Context, arg sqlc.UpdateAssetParams) (sqlc.UpdateAssetRow, error)
	SoftDeleteAsset(ctx context.Context, id uuid.UUID) (int64, error)
}

type AssetService struct {
	queries assetQuerier
}

func NewAssetService(queries assetQuerier) *AssetService {
	return &AssetService{queries: queries}
}

func (s *AssetService) Create(ctx context.Context, input CreateAssetInput) (*Asset, error) {
	purchaseDate := pgtypeDateFromString(input.PurchaseDate)
	purchasePrice := pgtypeNumericFromDecimal(input.PurchasePrice)
	linkedLiabilityID := pgtypeUUIDFromPtr(input.LinkedLiabilityID)

	row, err := s.queries.CreateAsset(ctx, sqlc.CreateAssetParams{
		UserID:                          input.UserID,
		Name:                            input.Name,
		AssetType:                       input.AssetType,
		CurrentValue:                    input.CurrentValue,
		ContributionMode:                input.ContributionMode,
		ContributionValue:               input.ContributionValue,
		EmployerMatchRate:               input.EmployerMatchRate,
		EmployerMatchMaxPercentOfSalary: input.EmployerMatchMaxPercentOfSalary,
		AnnualRate:                      input.AnnualRate,
		PersonIds:                       input.PersonIDs,
		PurchaseDate:                    purchaseDate,
		PurchasePrice:                   purchasePrice,
		HomeGrowthProfile:               input.HomeGrowthProfile,
		VehicleDepreciationProfile:      input.VehicleDepreciationProfile,
		LinkedLiabilityID:               linkedLiabilityID,
	})
	if err != nil {
		return nil, fmt.Errorf("create asset: %w", err)
	}

	asset := mapCreateAssetRow(row)
	return &asset, nil
}

func (s *AssetService) GetByID(ctx context.Context, id uuid.UUID) (*Asset, error) {
	row, err := s.queries.GetAssetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get asset by id: %w", err)
	}

	asset := mapGetAssetByIDRow(row)
	return &asset, nil
}

func (s *AssetService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]Asset, error) {
	rows, err := s.queries.ListAssetsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list assets by user id: %w", err)
	}

	assets := make([]Asset, 0, len(rows))
	for _, row := range rows {
		assets = append(assets, mapListAssetsByUserIDRow(row))
	}

	return assets, nil
}

func (s *AssetService) Update(ctx context.Context, input UpdateAssetInput) (*Asset, error) {
	purchaseDate := pgtypeDateFromString(input.PurchaseDate)
	purchasePrice := pgtypeNumericFromDecimal(input.PurchasePrice)
	linkedLiabilityID := pgtypeUUIDFromPtr(input.LinkedLiabilityID)

	row, err := s.queries.UpdateAsset(ctx, sqlc.UpdateAssetParams{
		ID:                              input.ID,
		Name:                            input.Name,
		AssetType:                       input.AssetType,
		CurrentValue:                    input.CurrentValue,
		ContributionMode:                input.ContributionMode,
		ContributionValue:               input.ContributionValue,
		EmployerMatchRate:               input.EmployerMatchRate,
		EmployerMatchMaxPercentOfSalary: input.EmployerMatchMaxPercentOfSalary,
		AnnualRate:                      input.AnnualRate,
		PersonIds:                       input.PersonIDs,
		PurchaseDate:                    purchaseDate,
		PurchasePrice:                   purchasePrice,
		HomeGrowthProfile:               input.HomeGrowthProfile,
		VehicleDepreciationProfile:      input.VehicleDepreciationProfile,
		LinkedLiabilityID:               linkedLiabilityID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update asset: %w", err)
	}

	asset := mapUpdateAssetRow(row)
	return &asset, nil
}

func (s *AssetService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteAsset(ctx, id)
	if err != nil {
		return fmt.Errorf("delete asset: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapCreateAssetRow(row sqlc.CreateAssetRow) Asset {
	return Asset{
		ID:           row.ID,
		UserID:       row.UserID,
		Name:         row.Name,
		AssetType:    row.AssetType,
		CurrentValue: row.CurrentValue,

		ContributionMode:                row.ContributionMode,
		ContributionValue:               row.ContributionValue,
		EmployerMatchRate:               row.EmployerMatchRate,
		EmployerMatchMaxPercentOfSalary: row.EmployerMatchMaxPercentOfSalary,
		AnnualRate:                      row.AnnualRate,
		PersonIDs:                       row.PersonIds,
		PurchaseDate:                    pgtypeDateToString(row.PurchaseDate),
		PurchasePrice:                   pgtypeNumericToDecimal(row.PurchasePrice),
		HomeGrowthProfile:               row.HomeGrowthProfile,
		VehicleDepreciationProfile:      row.VehicleDepreciationProfile,
		LinkedLiabilityID:               pgtypeUUIDToPtr(row.LinkedLiabilityID),
		PlaidAccountID:                  pgtypeUUIDToPtr(row.PlaidAccountID),
		LastValueUpdatedAt:              timestamptzToTime(row.LastValueUpdatedAt),
		CreatedAt:                       timestamptzToTime(row.CreatedAt),
		UpdatedAt:                       timestamptzToTime(row.UpdatedAt),
	}
}

func mapGetAssetByIDRow(row sqlc.GetAssetByIDRow) Asset {
	return Asset{
		ID:           row.ID,
		UserID:       row.UserID,
		Name:         row.Name,
		AssetType:    row.AssetType,
		CurrentValue: row.CurrentValue,

		ContributionMode:                row.ContributionMode,
		ContributionValue:               row.ContributionValue,
		EmployerMatchRate:               row.EmployerMatchRate,
		EmployerMatchMaxPercentOfSalary: row.EmployerMatchMaxPercentOfSalary,
		AnnualRate:                      row.AnnualRate,
		PersonIDs:                       row.PersonIds,
		PurchaseDate:                    pgtypeDateToString(row.PurchaseDate),
		PurchasePrice:                   pgtypeNumericToDecimal(row.PurchasePrice),
		HomeGrowthProfile:               row.HomeGrowthProfile,
		VehicleDepreciationProfile:      row.VehicleDepreciationProfile,
		LinkedLiabilityID:               pgtypeUUIDToPtr(row.LinkedLiabilityID),
		PlaidAccountID:                  pgtypeUUIDToPtr(row.PlaidAccountID),
		LastValueUpdatedAt:              timestamptzToTime(row.LastValueUpdatedAt),
		CreatedAt:                       timestamptzToTime(row.CreatedAt),
		UpdatedAt:                       timestamptzToTime(row.UpdatedAt),
	}
}

func mapListAssetsByUserIDRow(row sqlc.ListAssetsByUserIDRow) Asset {
	return Asset{
		ID:           row.ID,
		UserID:       row.UserID,
		Name:         row.Name,
		AssetType:    row.AssetType,
		CurrentValue: row.CurrentValue,

		ContributionMode:                row.ContributionMode,
		ContributionValue:               row.ContributionValue,
		EmployerMatchRate:               row.EmployerMatchRate,
		EmployerMatchMaxPercentOfSalary: row.EmployerMatchMaxPercentOfSalary,
		AnnualRate:                      row.AnnualRate,
		PersonIDs:                       row.PersonIds,
		PurchaseDate:                    pgtypeDateToString(row.PurchaseDate),
		PurchasePrice:                   pgtypeNumericToDecimal(row.PurchasePrice),
		HomeGrowthProfile:               row.HomeGrowthProfile,
		VehicleDepreciationProfile:      row.VehicleDepreciationProfile,
		LinkedLiabilityID:               pgtypeUUIDToPtr(row.LinkedLiabilityID),
		PlaidAccountID:                  pgtypeUUIDToPtr(row.PlaidAccountID),
		LastValueUpdatedAt:              timestamptzToTime(row.LastValueUpdatedAt),
		CreatedAt:                       timestamptzToTime(row.CreatedAt),
		UpdatedAt:                       timestamptzToTime(row.UpdatedAt),
	}
}

func mapUpdateAssetRow(row sqlc.UpdateAssetRow) Asset {
	return Asset{
		ID:           row.ID,
		UserID:       row.UserID,
		Name:         row.Name,
		AssetType:    row.AssetType,
		CurrentValue: row.CurrentValue,

		ContributionMode:                row.ContributionMode,
		ContributionValue:               row.ContributionValue,
		EmployerMatchRate:               row.EmployerMatchRate,
		EmployerMatchMaxPercentOfSalary: row.EmployerMatchMaxPercentOfSalary,
		AnnualRate:                      row.AnnualRate,
		PersonIDs:                       row.PersonIds,
		PurchaseDate:                    pgtypeDateToString(row.PurchaseDate),
		PurchasePrice:                   pgtypeNumericToDecimal(row.PurchasePrice),
		HomeGrowthProfile:               row.HomeGrowthProfile,
		VehicleDepreciationProfile:      row.VehicleDepreciationProfile,
		LinkedLiabilityID:               pgtypeUUIDToPtr(row.LinkedLiabilityID),
		PlaidAccountID:                  pgtypeUUIDToPtr(row.PlaidAccountID),
		LastValueUpdatedAt:              timestamptzToTime(row.LastValueUpdatedAt),
		CreatedAt:                       timestamptzToTime(row.CreatedAt),
		UpdatedAt:                       timestamptzToTime(row.UpdatedAt),
	}
}
