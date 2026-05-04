package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func createExpenseCategoryInputFromModel(input model.CreateExpenseCategoryInput) (service.CreateExpenseCategoryInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateExpenseCategoryInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	budgetID, err := uuid.Parse(input.BudgetID)
	if err != nil {
		return service.CreateExpenseCategoryInput{}, fmt.Errorf("invalid budget id: %w", err)
	}

	allocation, err := decimal.Parse(input.Allocation)
	if err != nil {
		return service.CreateExpenseCategoryInput{}, fmt.Errorf("invalid allocation: %w", err)
	}

	currentSpend, err := decimal.Parse(input.CurrentSpend)
	if err != nil {
		return service.CreateExpenseCategoryInput{}, fmt.Errorf("invalid current spend: %w", err)
	}

	return service.CreateExpenseCategoryInput{
		UserID:       userID,
		BudgetID:     budgetID,
		Name:         input.Name,
		Allocation:   allocation,
		CurrentSpend: currentSpend,
	}, nil
}

func updateExpenseCategoryInputFromModel(input model.UpdateExpenseCategoryInput) (service.UpdateExpenseCategoryInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateExpenseCategoryInput{}, fmt.Errorf("invalid expense category id: %w", err)
	}

	allocation, err := decimal.Parse(input.Allocation)
	if err != nil {
		return service.UpdateExpenseCategoryInput{}, fmt.Errorf("invalid allocation: %w", err)
	}

	currentSpend, err := decimal.Parse(input.CurrentSpend)
	if err != nil {
		return service.UpdateExpenseCategoryInput{}, fmt.Errorf("invalid current spend: %w", err)
	}

	return service.UpdateExpenseCategoryInput{
		ID:           id,
		Name:         input.Name,
		Allocation:   allocation,
		CurrentSpend: currentSpend,
	}, nil
}

func mapExpenseCategoryToModel(category *service.ExpenseCategory) *model.ExpenseCategory {
	return &model.ExpenseCategory{
		ID:           category.ID.String(),
		UserID:       category.UserID.String(),
		BudgetID:     category.BudgetID.String(),
		Name:         category.Name,
		Allocation:   category.Allocation.String(),
		CurrentSpend: category.CurrentSpend.String(),
		CreatedAt:    category.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    category.UpdatedAt.Format(time.RFC3339),
	}
}
