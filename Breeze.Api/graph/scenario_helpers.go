package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func createScenarioInputFromModel(input model.CreateScenarioInput) (service.CreateScenarioInput, error) {
	parsed, err := parseScenarioFields(input.Name, input.CurrentAge, input.RetirementAge, input.AnnualSpend, input.SafeWithdrawalRate, input.InflationRate, input.ReturnRate, input.CurrentPortfolio)
	if err != nil {
		return service.CreateScenarioInput{}, err
	}

	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateScenarioInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	return service.CreateScenarioInput{
		UserID:             userID,
		Name:               parsed.name,
		CurrentAge:         parsed.currentAge,
		RetirementAge:      parsed.retirementAge,
		AnnualSpend:        parsed.annualSpend,
		SafeWithdrawalRate: parsed.safeWithdrawalRate,
		InflationRate:      parsed.inflationRate,
		ReturnRate:         parsed.returnRate,
		CurrentPortfolio:   parsed.currentPortfolio,
	}, nil
}

func updateScenarioInputFromModel(input model.UpdateScenarioInput) (service.UpdateScenarioInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateScenarioInput{}, fmt.Errorf("invalid scenario id: %w", err)
	}

	parsed, err := parseScenarioFields(input.Name, input.CurrentAge, input.RetirementAge, input.AnnualSpend, input.SafeWithdrawalRate, input.InflationRate, input.ReturnRate, input.CurrentPortfolio)
	if err != nil {
		return service.UpdateScenarioInput{}, err
	}

	return service.UpdateScenarioInput{
		ID:                 id,
		Name:               parsed.name,
		CurrentAge:         parsed.currentAge,
		RetirementAge:      parsed.retirementAge,
		AnnualSpend:        parsed.annualSpend,
		SafeWithdrawalRate: parsed.safeWithdrawalRate,
		InflationRate:      parsed.inflationRate,
		ReturnRate:         parsed.returnRate,
		CurrentPortfolio:   parsed.currentPortfolio,
	}, nil
}

type scenarioFields struct {
	name               string
	currentAge         int
	retirementAge      int
	annualSpend        decimal.Decimal
	safeWithdrawalRate decimal.Decimal
	inflationRate      decimal.Decimal
	returnRate         decimal.Decimal
	currentPortfolio   decimal.Decimal
}

func parseScenarioFields(name string, currentAge, retirementAge int, annualSpend, safeWithdrawalRate, inflationRate, returnRate, currentPortfolio string) (scenarioFields, error) {
	parsedAnnualSpend, err := decimal.Parse(annualSpend)
	if err != nil {
		return scenarioFields{}, fmt.Errorf("invalid annual spend: %w", err)
	}

	parsedSafeWithdrawalRate, err := decimal.Parse(safeWithdrawalRate)
	if err != nil {
		return scenarioFields{}, fmt.Errorf("invalid safe withdrawal rate: %w", err)
	}

	parsedInflationRate, err := decimal.Parse(inflationRate)
	if err != nil {
		return scenarioFields{}, fmt.Errorf("invalid inflation rate: %w", err)
	}

	parsedReturnRate, err := decimal.Parse(returnRate)
	if err != nil {
		return scenarioFields{}, fmt.Errorf("invalid return rate: %w", err)
	}

	parsedCurrentPortfolio, err := decimal.Parse(currentPortfolio)
	if err != nil {
		return scenarioFields{}, fmt.Errorf("invalid current portfolio: %w", err)
	}

	return scenarioFields{
		name:               name,
		currentAge:         currentAge,
		retirementAge:      retirementAge,
		annualSpend:        parsedAnnualSpend,
		safeWithdrawalRate: parsedSafeWithdrawalRate,
		inflationRate:      parsedInflationRate,
		returnRate:         parsedReturnRate,
		currentPortfolio:   parsedCurrentPortfolio,
	}, nil
}

func mapScenarioToModel(scenario *service.ScenarioProfile) *model.Scenario {
	return &model.Scenario{
		ID:                 scenario.ID.String(),
		UserID:             scenario.UserID.String(),
		Name:               scenario.Name,
		CurrentAge:         scenario.CurrentAge,
		RetirementAge:      scenario.RetirementAge,
		AnnualSpend:        scenario.AnnualSpend.String(),
		SafeWithdrawalRate: scenario.SafeWithdrawalRate.String(),
		InflationRate:      scenario.InflationRate.String(),
		ReturnRate:         scenario.ReturnRate.String(),
		CurrentPortfolio:   scenario.CurrentPortfolio.String(),
		CreatedAt:          scenario.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          scenario.UpdatedAt.Format(time.RFC3339),
	}
}

func mapScenarioResultToModel(result *service.ScenarioResult) *model.ScenarioResult {
	return &model.ScenarioResult{
		ScenarioProfileID:     result.ScenarioProfileID.String(),
		Name:                  result.Name,
		CurrentAge:            result.CurrentAge,
		RetirementAge:         result.RetirementAge,
		AnnualSpend:           result.AnnualSpend.String(),
		SafeWithdrawalRate:    result.SafeWithdrawalRate.String(),
		InflationRate:         result.InflationRate.String(),
		ReturnRate:            result.ReturnRate.String(),
		CurrentPortfolio:      result.CurrentPortfolio.String(),
		PortfolioAtRetirement: result.PortfolioAtRetirement.String(),
		RequiredPortfolio:     result.RequiredPortfolio.String(),
		ProjectedDepletionAge: intPtrToModelInt(result.ProjectedDepletionAge),
		IsSustainable:         result.IsSustainable,
		CreatedAt:             result.CreatedAt.Format(time.RFC3339),
		UpdatedAt:             result.UpdatedAt.Format(time.RFC3339),
	}
}

func intPtrToModelInt(value *int) *int {
	if value == nil {
		return nil
	}
	copyValue := *value
	return &copyValue
}
