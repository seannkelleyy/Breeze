package graph

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func decimalZero() decimal.Decimal {
	return decimal.MustParse("0")
}

func createBudgetInputFromModel(input *model.CreateBudgetInput) (service.CreateBudgetInput, error) {
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

// removeRecurringIncomesForBudget soft-deletes all incomes for a budget
// that were generated from recurring templates.
func removeRecurringIncomesForBudget(ctx context.Context, incomeSvc *service.IncomeService, userID, budgetID uuid.UUID) error {
	existingIncomes, err := incomeSvc.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return err
	}
	for i := range existingIncomes {
		if existingIncomes[i].SourceType == sqlc.IncomeSourceTypeRECURRINGTEMPLATE {
			_ = incomeSvc.Delete(ctx, userID, existingIncomes[i].ID)
		}
	}
	return nil
}

// recalculateBudgetIncome sums all income records for the budget and updates
// the budget's MonthlyIncome so it reflects the actual total.
func recalculateBudgetIncome(
	ctx context.Context,
	incomeSvc *service.IncomeService,
	budgetSvc *service.BudgetService,
	userID uuid.UUID,
	budget *service.Budget,
) *service.Budget {
	incomes, listErr := incomeSvc.ListByBudgetID(ctx, budget.ID)
	if listErr != nil {
		slog.Warn("recalculateBudgetIncome: failed to list incomes", "error", listErr)
		return budget
	}
	slog.Info("recalculateBudgetIncome: found incomes", "count", len(incomes))
	total := decimalZero()
	for i := range incomes {
		total, _ = total.Add(incomes[i].Amount)
		slog.Info("recalculateBudgetIncome: income", "name", incomes[i].Name, "amount", incomes[i].Amount.String())
	}
	slog.Info("recalculateBudgetIncome: total", "total", total.String())
	updated, updateErr := budgetSvc.Update(ctx, userID, &service.UpdateBudgetInput{
		ID:              budget.ID,
		MonthlyIncome:   total,
		MonthlyExpenses: budget.MonthlyExpenses,
	})
	if updateErr != nil {
		slog.Warn("recalculateBudgetIncome: failed to update budget", "error", updateErr)
		return budget
	}
	slog.Info("recalculateBudgetIncome: updated budget", "monthlyIncome", updated.MonthlyIncome.String())
	return updated
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

// replacePayrollIncomesForBudget swaps the budget's people-payroll incomes
// (per-person paycheck net amounts computed by the planner) for the provided
// set. A nil/empty input clears existing payroll rows, keeping regeneration
// idempotent.
func replacePayrollIncomesForBudget(
	ctx context.Context,
	incomeSvc *service.IncomeService,
	userID uuid.UUID,
	budgetID uuid.UUID,
	budgetDate time.Time,
	items []*model.PayrollIncomeInput,
) error {
	existingIncomes, err := incomeSvc.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return err
	}
	for i := range existingIncomes {
		if existingIncomes[i].SourceType == sqlc.IncomeSourceTypePEOPLEPAYROLL {
			_ = incomeSvc.Delete(ctx, userID, existingIncomes[i].ID)
		}
	}

	monthStart := time.Date(budgetDate.Year(), budgetDate.Month(), 1, 0, 0, 0, 0, time.UTC)
	for _, item := range items {
		if item == nil {
			continue
		}
		personID, err := uuid.Parse(item.PersonID)
		if err != nil {
			return fmt.Errorf("invalid payroll income person id: %w", err)
		}
		amount, err := decimal.Parse(item.Amount)
		if err != nil {
			return fmt.Errorf("invalid payroll income amount: %w", err)
		}
		date, err := parseDate(item.Date)
		if err != nil {
			return fmt.Errorf("invalid payroll income date: %w", err)
		}

		if _, err := incomeSvc.Create(ctx, &service.CreateIncomeInput{
			UserID:          userID,
			BudgetID:        budgetID,
			Name:            item.Name,
			Amount:          amount,
			Date:            date,
			PersonID:        &personID,
			SourceType:      sqlc.IncomeSourceTypePEOPLEPAYROLL,
			GenerationMonth: &monthStart,
		}); err != nil {
			return fmt.Errorf("create payroll income for %q: %w", item.Name, err)
		}
	}
	return nil
}
