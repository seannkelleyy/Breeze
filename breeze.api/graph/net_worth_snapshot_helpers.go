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

	items := make([]*model.NetWorthSnapshotItem, 0, len(s.Items))
	for i := range s.Items {
		items = append(items, mapNetWorthSnapshotItemToModel(&s.Items[i]))
	}

	return &model.NetWorthSnapshot{
		ID:               s.ID.String(),
		UserID:           s.UserID.String(),
		SnapshotDate:     s.SnapshotDate.Format(time.RFC3339),
		TotalAssets:      s.TotalAssets.String(),
		TotalLiabilities: s.TotalLiabilities.String(),
		NetWorth:         s.NetWorth.String(),
		Items:            items,
		CreatedAt:        s.CreatedAt.Format(time.RFC3339),
		UpdatedAt:        s.UpdatedAt.Format(time.RFC3339),
	}
}

func mapNetWorthSnapshotItemToModel(item *service.NetWorthSnapshotItem) *model.NetWorthSnapshotItem {
	var accountID *string
	if item.AccountID != nil {
		id := item.AccountID.String()
		accountID = &id
	}

	return &model.NetWorthSnapshotItem{
		ID:         item.ID.String(),
		SnapshotID: item.SnapshotID.String(),
		AccountID:  accountID,
		Label:      item.Label,
		Amount:     item.Amount.String(),
		Kind:       item.Kind,
		CreatedAt:  item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  item.UpdatedAt.Format(time.RFC3339),
	}
}

func mapSnapshotItemInputs(inputs []*model.NetWorthSnapshotItemInput) ([]service.NetWorthSnapshotItemInput, error) {
	if len(inputs) == 0 {
		return nil, nil
	}

	items := make([]service.NetWorthSnapshotItemInput, 0, len(inputs))
	for _, in := range inputs {
		if in == nil {
			continue
		}
		amount, err := decimal.Parse(in.Amount)
		if err != nil {
			return nil, fmt.Errorf("invalid item amount: %w", err)
		}
		var accountID *uuid.UUID
		if in.AccountID != nil && *in.AccountID != "" {
			parsed, err := uuid.Parse(*in.AccountID)
			if err != nil {
				return nil, fmt.Errorf("invalid item account id: %w", err)
			}
			accountID = &parsed
		}
		items = append(items, service.NetWorthSnapshotItemInput{
			AccountID: accountID,
			Label:     in.Label,
			Amount:    amount,
			Kind:      in.Kind,
		})
	}
	return items, nil
}

func mapCreateNetWorthSnapshotInput(input *model.CreateNetWorthSnapshotInput) (service.CreateNetWorthSnapshotInput, error) {
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

	items, err := mapSnapshotItemInputs(input.Items)
	if err != nil {
		return service.CreateNetWorthSnapshotInput{}, err
	}

	return service.CreateNetWorthSnapshotInput{
		UserID:           userID,
		SnapshotDate:     snapshotDate,
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
		NetWorth:         netWorth,
		Items:            items,
	}, nil
}

func mapUpdateNetWorthSnapshotInput(input *model.UpdateNetWorthSnapshotInput) (service.UpdateNetWorthSnapshotInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid id: %w", err)
	}

	var totalAssets *decimal.Decimal
	if input.TotalAssets != nil {
		v, parseErr := decimal.Parse(*input.TotalAssets)
		if parseErr != nil {
			return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid total assets: %w", parseErr)
		}
		totalAssets = &v
	}

	var totalLiabilities *decimal.Decimal
	if input.TotalLiabilities != nil {
		v, parseErr := decimal.Parse(*input.TotalLiabilities)
		if parseErr != nil {
			return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid total liabilities: %w", parseErr)
		}
		totalLiabilities = &v
	}

	var netWorth *decimal.Decimal
	if input.NetWorth != nil {
		v, parseErr := decimal.Parse(*input.NetWorth)
		if parseErr != nil {
			return service.UpdateNetWorthSnapshotInput{}, fmt.Errorf("invalid net worth: %w", parseErr)
		}
		netWorth = &v
	}

	items, err := mapSnapshotItemInputs(input.Items)
	if err != nil {
		return service.UpdateNetWorthSnapshotInput{}, err
	}

	return service.UpdateNetWorthSnapshotInput{
		ID:               id,
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
		NetWorth:         netWorth,
		Items:            items,
	}, nil
}
