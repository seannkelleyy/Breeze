package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func createAssetInputFromModel(input model.CreateAssetInput) (service.CreateAssetInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateAssetInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	currentValue, err := decimal.Parse(input.CurrentValue)
	if err != nil {
		return service.CreateAssetInput{}, fmt.Errorf("invalid current value: %w", err)
	}

	employerMatchRate, err := decimal.Parse(input.EmployerMatchRate)
	if err != nil {
		return service.CreateAssetInput{}, fmt.Errorf("invalid employer match rate: %w", err)
	}

	employerMatchMaxPercentOfSalary, err := decimal.Parse(input.EmployerMatchMaxPercentOfSalary)
	if err != nil {
		return service.CreateAssetInput{}, fmt.Errorf("invalid employer match max percent of salary: %w", err)
	}

	contributionValue, err := decimal.Parse(input.ContributionValue)
	if err != nil {
		return service.CreateAssetInput{}, fmt.Errorf("invalid contribution value: %w", err)
	}

	annualRate, err := decimal.Parse(input.AnnualRate)
	if err != nil {
		return service.CreateAssetInput{}, fmt.Errorf("invalid annual rate: %w", err)
	}

	personIDs, err := parseUUIDSlice(input.PersonIds)
	if err != nil {
		return service.CreateAssetInput{}, err
	}

	var purchasePrice *decimal.Decimal
	if input.PurchasePrice != nil {
		v, err := decimal.Parse(*input.PurchasePrice)
		if err != nil {
			return service.CreateAssetInput{}, fmt.Errorf("invalid purchase price: %w", err)
		}
		purchasePrice = &v
	}

	var linkedLiabilityID *uuid.UUID
	if input.LinkedLiabilityID != nil {
		id, err := uuid.Parse(*input.LinkedLiabilityID)
		if err != nil {
			return service.CreateAssetInput{}, fmt.Errorf("invalid linked liability id: %w", err)
		}
		linkedLiabilityID = &id
	}

	return service.CreateAssetInput{
		UserID:                          userID,
		Name:                            input.Name,
		AssetType:                       sqlc.AssetType(input.AssetType),
		CurrentValue:                    currentValue,
		ContributionMode:                input.ContributionMode,
		ContributionValue:               contributionValue,
		EmployerMatchRate:               employerMatchRate,
		EmployerMatchMaxPercentOfSalary: employerMatchMaxPercentOfSalary,
		AnnualRate:                      annualRate,
		PersonIDs:                       personIDs,
		PurchaseDate:                    input.PurchaseDate,
		PurchasePrice:                   purchasePrice,
		HomeGrowthProfile:               input.HomeGrowthProfile,
		VehicleDepreciationProfile:      input.VehicleDepreciationProfile,
		LinkedLiabilityID:               linkedLiabilityID,
	}, nil
}

func updateAssetInputFromModel(input model.UpdateAssetInput) (service.UpdateAssetInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateAssetInput{}, fmt.Errorf("invalid asset id: %w", err)
	}

	currentValue, err := decimal.Parse(input.CurrentValue)
	if err != nil {
		return service.UpdateAssetInput{}, fmt.Errorf("invalid current value: %w", err)
	}

	employerMatchRate, err := decimal.Parse(input.EmployerMatchRate)
	if err != nil {
		return service.UpdateAssetInput{}, fmt.Errorf("invalid employer match rate: %w", err)
	}

	employerMatchMaxPercentOfSalary, err := decimal.Parse(input.EmployerMatchMaxPercentOfSalary)
	if err != nil {
		return service.UpdateAssetInput{}, fmt.Errorf("invalid employer match max percent of salary: %w", err)
	}

	contributionValue, err := decimal.Parse(input.ContributionValue)
	if err != nil {
		return service.UpdateAssetInput{}, fmt.Errorf("invalid contribution value: %w", err)
	}

	annualRate, err := decimal.Parse(input.AnnualRate)
	if err != nil {
		return service.UpdateAssetInput{}, fmt.Errorf("invalid annual rate: %w", err)
	}

	personIDs, err := parseUUIDSlice(input.PersonIds)
	if err != nil {
		return service.UpdateAssetInput{}, err
	}

	var purchasePrice *decimal.Decimal
	if input.PurchasePrice != nil {
		v, err := decimal.Parse(*input.PurchasePrice)
		if err != nil {
			return service.UpdateAssetInput{}, fmt.Errorf("invalid purchase price: %w", err)
		}
		purchasePrice = &v
	}

	var linkedLiabilityID *uuid.UUID
	if input.LinkedLiabilityID != nil {
		lid, err := uuid.Parse(*input.LinkedLiabilityID)
		if err != nil {
			return service.UpdateAssetInput{}, fmt.Errorf("invalid linked liability id: %w", err)
		}
		linkedLiabilityID = &lid
	}

	return service.UpdateAssetInput{
		ID:                              id,
		Name:                            input.Name,
		AssetType:                       sqlc.AssetType(input.AssetType),
		CurrentValue:                    currentValue,
		ContributionMode:                input.ContributionMode,
		ContributionValue:               contributionValue,
		EmployerMatchRate:               employerMatchRate,
		EmployerMatchMaxPercentOfSalary: employerMatchMaxPercentOfSalary,
		AnnualRate:                      annualRate,
		PersonIDs:                       personIDs,
		PurchaseDate:                    input.PurchaseDate,
		PurchasePrice:                   purchasePrice,
		HomeGrowthProfile:               input.HomeGrowthProfile,
		VehicleDepreciationProfile:      input.VehicleDepreciationProfile,
		LinkedLiabilityID:               linkedLiabilityID,
	}, nil
}

func mapAssetToModel(asset *service.Asset) *model.Asset {
	var p *string
	if asset.PurchasePrice != nil {
		s := asset.PurchasePrice.String()
		p = &s
	}
	var linkedID *string
	if asset.LinkedLiabilityID != nil {
		s := asset.LinkedLiabilityID.String()
		linkedID = &s
	}
	return &model.Asset{
		ID:                              asset.ID.String(),
		UserID:                          asset.UserID.String(),
		Name:                            asset.Name,
		AssetType:                       model.AssetType(asset.AssetType),
		CurrentValue:                    asset.CurrentValue.String(),
		ContributionMode:                asset.ContributionMode,
		ContributionValue:               asset.ContributionValue.String(),
		EmployerMatchRate:               asset.EmployerMatchRate.String(),
		EmployerMatchMaxPercentOfSalary: asset.EmployerMatchMaxPercentOfSalary.String(),
		AnnualRate:                      asset.AnnualRate.String(),
		PersonIds:                       uuidSliceToStringSlice(asset.PersonIDs),
		PurchaseDate:                    asset.PurchaseDate,
		PurchasePrice:                   p,
		HomeGrowthProfile:               asset.HomeGrowthProfile,
		VehicleDepreciationProfile:      asset.VehicleDepreciationProfile,
		LinkedLiabilityID:               linkedID,
		LastValueUpdatedAt:              asset.LastValueUpdatedAt.Format(time.RFC3339),
		CreatedAt:                       asset.CreatedAt.Format(time.RFC3339),
		UpdatedAt:                       asset.UpdatedAt.Format(time.RFC3339),
	}
}
