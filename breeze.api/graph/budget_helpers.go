package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

// budgetMonthInputFromModel maps the CreateBudget mutation input. UserID is
// filled in by the resolver from the authenticated caller.
func budgetMonthInputFromModel(input *model.CreateBudgetInput) (service.BudgetMonthInput, error) {
	budgetDate, err := time.Parse(time.RFC3339, input.Date)
	if err != nil {
		return service.BudgetMonthInput{}, fmt.Errorf("invalid budget date: %w", err)
	}

	monthlyIncome, err := decimal.Parse(input.MonthlyIncome)
	if err != nil {
		return service.BudgetMonthInput{}, fmt.Errorf("invalid monthly income: %w", err)
	}

	monthlyExpenses, err := decimal.Parse(input.MonthlyExpenses)
	if err != nil {
		return service.BudgetMonthInput{}, fmt.Errorf("invalid monthly expenses: %w", err)
	}

	payrollIncomes, err := payrollIncomesFromModel(input.PayrollIncomes)
	if err != nil {
		return service.BudgetMonthInput{}, err
	}

	return service.BudgetMonthInput{
		Date:            budgetDate,
		MonthlyIncome:   monthlyIncome,
		MonthlyExpenses: monthlyExpenses,
		PayrollIncomes:  payrollIncomes,
	}, nil
}

// payrollIncomesFromModel returns nil when the mutation omitted payroll
// incomes, which tells the service to leave existing payroll rows untouched.
func payrollIncomesFromModel(items []*model.PayrollIncomeInput) ([]service.PayrollIncome, error) {
	if items == nil {
		return nil, nil
	}

	out := make([]service.PayrollIncome, 0, len(items))
	for _, item := range items {
		if item == nil {
			continue
		}
		personID, err := uuid.Parse(item.PersonID)
		if err != nil {
			return nil, fmt.Errorf("invalid payroll income person id: %w", err)
		}
		amount, err := decimal.Parse(item.Amount)
		if err != nil {
			return nil, fmt.Errorf("invalid payroll income amount: %w", err)
		}
		date, err := parseDate(item.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid payroll income date: %w", err)
		}

		out = append(out, service.PayrollIncome{
			PersonID: personID,
			Name:     item.Name,
			Amount:   amount,
			Date:     date,
		})
	}
	return out, nil
}

func updateBudgetInputFromModel(input *model.UpdateBudgetInput) (service.UpdateBudgetInput, error) {
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
