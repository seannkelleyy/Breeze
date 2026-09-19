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

	return service.UpsertPaycheckDeductionInput{
		ID:       id,
		UserID:   userID,
		PersonID: personID,
		Name:     input.Name,
		Amount:   amount,
		Pretax:   input.Pretax,
	}, nil
}

func mapPaycheckDeductionToModel(deduction *service.PaycheckDeduction) *model.PaycheckDeduction {
	return &model.PaycheckDeduction{
		ID:        deduction.ID.String(),
		UserID:    deduction.UserID.String(),
		PersonID:  deduction.PersonID.String(),
		Name:      deduction.Name,
		Amount:    deduction.Amount.String(),
		Pretax:    deduction.Pretax,
		CreatedAt: deduction.CreatedAt.Format(time.RFC3339),
		UpdatedAt: deduction.UpdatedAt.Format(time.RFC3339),
	}
}
