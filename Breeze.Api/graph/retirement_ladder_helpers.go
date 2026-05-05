package graph

import (
	"fmt"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/govalues/decimal"
)

// mapLadderStepToModel converts service.LadderStep to model.LadderStep (GraphQL).
func mapLadderStepToModel(step *service.LadderStep) *model.LadderStep {
	if step == nil {
		return nil
	}
	return &model.LadderStep{
		Year:                   step.Year,
		Age:                    step.Age,
		WithdrawalAmount:       step.WithdrawalAmount.String(),
		TaxableWithdrawal:      step.TaxableWithdrawal.String(),
		EstimatedIncomeTax:     step.EstimatedIncomeTax.String(),
		EarlyWithdrawalPenalty: step.EarlyWithdrawalPenalty.String(),
		NetWithdrawal:          step.NetWithdrawal.String(),
		RemainingBalance:       step.RemainingBalance.String(),
		IsAccessible:           step.IsAccessible,
	}
}

// mapRetirementLadderProjectionToModel converts service.RetirementLadderProjection to model.RetirementLadderProjection (GraphQL).
func mapRetirementLadderProjectionToModel(proj *service.RetirementLadderProjection) *model.RetirementLadderProjection {
	if proj == nil {
		return nil
	}

	steps := make([]*model.LadderStep, 0, len(proj.ProjectedSteps))
	for i := range proj.ProjectedSteps {
		steps = append(steps, mapLadderStepToModel(&proj.ProjectedSteps[i]))
	}

	return &model.RetirementLadderProjection{
		InitialBalance:        proj.InitialBalance.String(),
		AnnualExpenses:        proj.AnnualExpenses.String(),
		CurrentAge:            proj.CurrentAge,
		FirstWithdrawalAge:    proj.FirstWithdrawalAge,
		IsRoth:                proj.IsRoth,
		ProjectedSteps:        steps,
		IsSustainable:         proj.IsSustainable,
		ProjectedDepletionAge: proj.ProjectedDepletionAge,
	}
}

// parseRetirementLadderInput validates and converts GraphQL inputs.
func parseRetirementLadderInput(initialBalance, annualExpenses string, currentAge, firstWithdrawalAge int, isRoth bool, year int, filingStatus model.FilingStatus) (decimal.Decimal, decimal.Decimal, int32, sqlc.FilingStatus, error) {
	balDecimal, err := decimal.Parse(initialBalance)
	if err != nil {
		return decimal.Decimal{}, decimal.Decimal{}, 0, "", fmt.Errorf("parse initialBalance: %w", err)
	}

	expDecimal, err := decimal.Parse(annualExpenses)
	if err != nil {
		return decimal.Decimal{}, decimal.Decimal{}, 0, "", fmt.Errorf("parse annualExpenses: %w", err)
	}

	return balDecimal, expDecimal, int32(year), sqlc.FilingStatus(filingStatus), nil
}
