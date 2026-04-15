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

	return service.CreateAssetInput{
		UserID:       userID,
		Name:         input.Name,
		AssetType:    sqlc.AssetType(input.AssetType),
		CurrentValue: currentValue,
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

	return service.UpdateAssetInput{
		ID:           id,
		Name:         input.Name,
		AssetType:    sqlc.AssetType(input.AssetType),
		CurrentValue: currentValue,
	}, nil
}

func mapAssetToModel(asset *service.Asset) *model.Asset {
	return &model.Asset{
		ID:                 asset.ID.String(),
		UserID:             asset.UserID.String(),
		Name:               asset.Name,
		AssetType:          model.AssetType(asset.AssetType),
		CurrentValue:       asset.CurrentValue.String(),
		LastValueUpdatedAt: asset.LastValueUpdatedAt.Format(time.RFC3339),
		CreatedAt:          asset.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          asset.UpdatedAt.Format(time.RFC3339),
	}
}
