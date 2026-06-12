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

func createLiabilityInputFromModel(input model.CreateLiabilityInput) (service.CreateLiabilityInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateLiabilityInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	currentBalance, err := decimal.Parse(input.CurrentBalance)
	if err != nil {
		return service.CreateLiabilityInput{}, fmt.Errorf("invalid current balance: %w", err)
	}

	interestRate, err := decimal.Parse(input.InterestRate)
	if err != nil {
		return service.CreateLiabilityInput{}, fmt.Errorf("invalid interest rate: %w", err)
	}

	minimumPayment, err := decimal.Parse(input.MinimumPayment)
	if err != nil {
		return service.CreateLiabilityInput{}, fmt.Errorf("invalid minimum payment: %w", err)
	}

	targetExtraPayment, err := decimal.Parse(input.TargetExtraPayment)
	if err != nil {
		return service.CreateLiabilityInput{}, fmt.Errorf("invalid target extra payment: %w", err)
	}

	contributionValue, err := decimal.Parse(input.ContributionValue)
	if err != nil {
		return service.CreateLiabilityInput{}, fmt.Errorf("invalid contribution value: %w", err)
	}

	return service.CreateLiabilityInput{
		UserID:             userID,
		Name:               input.Name,
		LiabilityType:      sqlc.LiabilityType(input.LiabilityType),
		CurrentBalance:     currentBalance,
		InterestRate:       interestRate,
		MinimumPayment:     minimumPayment,
		TargetExtraPayment: targetExtraPayment,
		PayoffPriority:     int32(input.PayoffPriority),
		Owner:              input.Owner,
		ContributionMode:   input.ContributionMode,
		ContributionValue:  contributionValue,
	}, nil
}

func updateLiabilityInputFromModel(input model.UpdateLiabilityInput) (service.UpdateLiabilityInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateLiabilityInput{}, fmt.Errorf("invalid liability id: %w", err)
	}

	currentBalance, err := decimal.Parse(input.CurrentBalance)
	if err != nil {
		return service.UpdateLiabilityInput{}, fmt.Errorf("invalid current balance: %w", err)
	}

	interestRate, err := decimal.Parse(input.InterestRate)
	if err != nil {
		return service.UpdateLiabilityInput{}, fmt.Errorf("invalid interest rate: %w", err)
	}

	minimumPayment, err := decimal.Parse(input.MinimumPayment)
	if err != nil {
		return service.UpdateLiabilityInput{}, fmt.Errorf("invalid minimum payment: %w", err)
	}

	targetExtraPayment, err := decimal.Parse(input.TargetExtraPayment)
	if err != nil {
		return service.UpdateLiabilityInput{}, fmt.Errorf("invalid target extra payment: %w", err)
	}

	contributionValue, err := decimal.Parse(input.ContributionValue)
	if err != nil {
		return service.UpdateLiabilityInput{}, fmt.Errorf("invalid contribution value: %w", err)
	}

	return service.UpdateLiabilityInput{
		ID:                 id,
		Name:               input.Name,
		LiabilityType:      sqlc.LiabilityType(input.LiabilityType),
		CurrentBalance:     currentBalance,
		InterestRate:       interestRate,
		MinimumPayment:     minimumPayment,
		TargetExtraPayment: targetExtraPayment,
		PayoffPriority:     int32(input.PayoffPriority),
		Owner:              input.Owner,
		ContributionMode:   input.ContributionMode,
		ContributionValue:  contributionValue,
	}, nil
}

func mapLiabilityToModel(liability *service.Liability) *model.Liability {
	return &model.Liability{
		ID:                   liability.ID.String(),
		UserID:               liability.UserID.String(),
		Name:                 liability.Name,
		LiabilityType:        model.LiabilityType(liability.LiabilityType),
		CurrentBalance:       liability.CurrentBalance.String(),
		InterestRate:         liability.InterestRate.String(),
		MinimumPayment:       liability.MinimumPayment.String(),
		TargetExtraPayment:   liability.TargetExtraPayment.String(),
		PayoffPriority:       int(liability.PayoffPriority),
		Owner:                liability.Owner,
		ContributionMode:     liability.ContributionMode,
		ContributionValue:    liability.ContributionValue.String(),
		LastBalanceUpdatedAt: liability.LastBalanceUpdatedAt.Format(time.RFC3339),
		CreatedAt:            liability.CreatedAt.Format(time.RFC3339),
		UpdatedAt:            liability.UpdatedAt.Format(time.RFC3339),
	}
}
