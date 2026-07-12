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

func createExpenseInputFromModel(input model.CreateExpenseInput) (service.CreateExpenseInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateExpenseInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	budgetID, err := uuid.Parse(input.BudgetID)
	if err != nil {
		return service.CreateExpenseInput{}, fmt.Errorf("invalid budget id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.CreateExpenseInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	expenseDate, err := parseDate(input.Date)
	if err != nil {
		return service.CreateExpenseInput{}, fmt.Errorf("invalid expense date: %w", err)
	}

	splits, err := mapExpenseSplitInputs(input.Splits)
	if err != nil {
		return service.CreateExpenseInput{}, err
	}

	return service.CreateExpenseInput{
		UserID:      userID,
		BudgetID:    budgetID,
		Amount:      amount,
		Date:        expenseDate,
		Description: input.Description,
		SourceType:  sqlc.ExpenseSourceTypeMANUAL,
		Splits:      splits,
	}, nil
}

func updateExpenseInputFromModel(input model.UpdateExpenseInput) (service.UpdateExpenseInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateExpenseInput{}, fmt.Errorf("invalid expense id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.UpdateExpenseInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	expenseDate, err := parseDate(input.Date)
	if err != nil {
		return service.UpdateExpenseInput{}, fmt.Errorf("invalid expense date: %w", err)
	}

	splits, err := mapExpenseSplitInputs(input.Splits)
	if err != nil {
		return service.UpdateExpenseInput{}, err
	}

	return service.UpdateExpenseInput{
		ID:          id,
		Amount:      amount,
		Date:        expenseDate,
		Description: input.Description,
		Splits:      splits,
	}, nil
}

func mapExpenseSplitInputs(inputs []*model.ExpenseSplitInput) ([]service.ExpenseSplitInput, error) {
	if len(inputs) == 0 {
		return nil, nil
	}

	splits := make([]service.ExpenseSplitInput, 0, len(inputs))
	for _, split := range inputs {
		if split == nil {
			continue
		}

		categoryID, err := uuid.Parse(split.CategoryID)
		if err != nil {
			return nil, fmt.Errorf("invalid category id: %w", err)
		}

		amount, err := decimal.Parse(split.Amount)
		if err != nil {
			return nil, fmt.Errorf("invalid split amount: %w", err)
		}

		splits = append(splits, service.ExpenseSplitInput{
			CategoryID:  categoryID,
			Amount:      amount,
			Description: split.Description,
		})
	}

	return splits, nil
}

func mapExpenseToModel(expense *service.Expense) *model.Expense {
	if expense == nil {
		return nil
	}

	splits := make([]*model.ExpenseSplit, 0, len(expense.Splits))
	for i := range expense.Splits {
		split := expense.Splits[i]
		splits = append(splits, mapExpenseSplitToModel(&split))
	}

	return &model.Expense{
		ID:               expense.ID.String(),
		UserID:           expense.UserID.String(),
		BudgetID:         expense.BudgetID.String(),
		Amount:           expense.Amount.String(),
		Date:             expense.Date.Format(time.RFC3339),
		Description:      expense.Description,
		Splits:           splits,
		SourceType:       model.ExpenseSourceType(expense.SourceType),
		SourceTemplateID: uuidPtrToString(expense.SourceTemplateID),
		GenerationMonth:  formatOptionalDate(expense.GenerationMonth),
		CreatedAt:        expense.CreatedAt.Format(time.RFC3339),
		UpdatedAt:        expense.UpdatedAt.Format(time.RFC3339),
	}
}

func mapExpenseSplitToModel(split *service.ExpenseSplit) *model.ExpenseSplit {
	if split == nil {
		return nil
	}

	return &model.ExpenseSplit{
		ID:          split.ID.String(),
		ExpenseID:   split.ExpenseID.String(),
		CategoryID:  split.CategoryID.String(),
		Amount:      split.Amount.String(),
		Description: split.Description,
		CreatedAt:   split.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   split.UpdatedAt.Format(time.RFC3339),
	}
}
