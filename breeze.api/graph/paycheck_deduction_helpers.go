package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func upsertPaycheckDeductionInputFromModel(input *model.UpsertPaycheckDeductionInput) (service.UpsertPaycheckDeductionInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpsertPaycheckDeductionInput{}, fmt.Errorf("invalid paycheck deduction id: %w", err)
	}

	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.UpsertPaycheckDeductionInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	personID, err := uuid.Parse(input.PersonID)
	if err != nil {
		return service.UpsertPaycheckDeductionInput{}, fmt.Errorf("invalid person id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.UpsertPaycheckDeductionInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	var linked *uuid.UUID
	if input.LinkedAccountID != nil && *input.LinkedAccountID != "" {
		parsed, parseErr := uuid.Parse(*input.LinkedAccountID)
		if parseErr != nil {
			return service.UpsertPaycheckDeductionInput{}, fmt.Errorf("invalid linked account id: %w", parseErr)
		}
		linked = &parsed
	}

	return service.UpsertPaycheckDeductionInput{
		ID:              id,
		UserID:          userID,
		PersonID:        personID,
		Name:            input.Name,
		Amount:          amount,
		Pretax:          input.Pretax,
		Kind:            input.Kind,
		LinkedAccountID: linked,
	}, nil
}

func mapPaycheckDeductionToModel(deduction *service.PaycheckDeduction) *model.PaycheckDeduction {
	var linkedAccountID *string
	if deduction.LinkedAccountID != nil {
		id := deduction.LinkedAccountID.String()
		linkedAccountID = &id
	}
	return &model.PaycheckDeduction{
		ID:              deduction.ID.String(),
		UserID:          deduction.UserID.String(),
		PersonID:        deduction.PersonID.String(),
		Name:            deduction.Name,
		Amount:          deduction.Amount.String(),
		Pretax:          deduction.Pretax,
		Kind:            deduction.Kind,
		LinkedAccountID: linkedAccountID,
		CreatedAt:       deduction.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       deduction.UpdatedAt.Format(time.RFC3339),
	}
}
