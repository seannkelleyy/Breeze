package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func createBudgetInputFromModel(input model.CreateBudgetInput) (service.CreateBudgetInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateBudgetInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	budgetDate, err := time.Parse(time.RFC3339, input.Date)
	if err != nil {
		return service.CreateBudgetInput{}, fmt.Errorf("invalid budget date: %w", err)
	}

	monthlyIncome, err := decimal.Parse(input.MonthlyIncome)
	if err != nil {
		return service.CreateBudgetInput{}, fmt.Errorf("invalid monthly income: %w", err)
	}

	monthlyExpenses, err := decimal.Parse(input.MonthlyExpenses)
	if err != nil {
		return service.CreateBudgetInput{}, fmt.Errorf("invalid monthly expenses: %w", err)
	}

	return service.CreateBudgetInput{
		UserID:          userID,
		Date:            budgetDate,
		MonthlyIncome:   monthlyIncome,
		MonthlyExpenses: monthlyExpenses,
	}, nil
}

func updateBudgetInputFromModel(input model.UpdateBudgetInput) (service.UpdateBudgetInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateBudgetInput{}, fmt.Errorf("invalid budget id: %w", err)
	}

	monthlyIncome, err := decimal.Parse(input.MonthlyIncome)
	if err != nil {
		return service.UpdateBudgetInput{}, fmt.Errorf("invalid monthly income: %w", err)
	}

	monthlyExpenses, err := decimal.Parse(input.MonthlyExpenses)
	if err != nil {
		return service.UpdateBudgetInput{}, fmt.Errorf("invalid monthly expenses: %w", err)
	}

	return service.UpdateBudgetInput{
		ID:              id,
		MonthlyIncome:   monthlyIncome,
		MonthlyExpenses: monthlyExpenses,
	}, nil
}

func mapBudgetToModel(budget *service.Budget) *model.Budget {
	return &model.Budget{
		ID:              budget.ID.String(),
		UserID:          budget.UserID.String(),
		Date:            budget.Date.Format(time.RFC3339),
		MonthlyIncome:   budget.MonthlyIncome.String(),
		MonthlyExpenses: budget.MonthlyExpenses.String(),
		CreatedAt:       budget.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       budget.UpdatedAt.Format(time.RFC3339),
	}
}
