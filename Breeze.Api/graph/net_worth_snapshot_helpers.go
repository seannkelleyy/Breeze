package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func mapNetWorthSnapshotToModel(s *service.NetWorthSnapshot) *model.NetWorthSnapshot {
	if s == nil {
		return nil
	}

	return &model.NetWorthSnapshot{
		ID:               s.ID.String(),
		UserID:           s.UserID.String(),
		SnapshotDate:     s.SnapshotDate.Format(time.RFC3339),
		TotalAssets:      s.TotalAssets.String(),
		TotalLiabilities: s.TotalLiabilities.String(),
		NetWorth:         s.NetWorth.String(),
		CreatedAt:        s.CreatedAt.Format(time.RFC3339),
		UpdatedAt:        s.UpdatedAt.Format(time.RFC3339),
	}
}

func mapCreateNetWorthSnapshotInput(input model.CreateNetWorthSnapshotInput) (service.CreateNetWorthSnapshotInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateNetWorthSnapshotInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	snapshotDate, err := parseDate(input.SnapshotDate)
	if err != nil {
		return service.CreateNetWorthSnapshotInput{}, fmt.Errorf("invalid snapshot date: %w", err)
	}

	totalAssets, err := decimal.Parse(input.TotalAssets)
	if err != nil {
		return service.CreateNetWorthSnapshotInput{}, fmt.Errorf("invalid total assets: %w", err)
	}

	totalLiabilities, err := decimal.Parse(input.TotalLiabilities)
	if err != nil {
		return service.CreateNetWorthSnapshotInput{}, fmt.Errorf("invalid total liabilities: %w", err)
	}

	netWorth, err := decimal.Parse(input.NetWorth)
	if err != nil {
		return service.CreateNetWorthSnapshotInput{}, fmt.Errorf("invalid net worth: %w", err)
	}

	return service.CreateNetWorthSnapshotInput{
		UserID:           userID,
		SnapshotDate:     snapshotDate,
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
		NetWorth:         netWorth,
	}, nil
}

func mapUpdateNetWorthSnapshotInput(input model.UpdateNetWorthSnapshotInput) (service.UpdateNetWorthSnapshotInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid id: %w", err)
	}

	var totalAssets *decimal.Decimal
	if input.TotalAssets != nil {
		v, err := decimal.Parse(*input.TotalAssets)
		if err != nil {
			return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid total assets: %w", err)
		}
		totalAssets = &v
	}

	var totalLiabilities *decimal.Decimal
	if input.TotalLiabilities != nil {
		v, err := decimal.Parse(*input.TotalLiabilities)
		if err != nil {
			return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid total liabilities: %w", err)
		}
		totalLiabilities = &v
	}

	var netWorth *decimal.Decimal
	if input.NetWorth != nil {
		v, err := decimal.Parse(*input.NetWorth)
		if err != nil {
			return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid net worth: %w", err)
		}
		netWorth = &v
	}

	return service.UpdateNetWorthSnapshotInput{
		ID:               id,
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
		NetWorth:         netWorth,
	}, nil
}
