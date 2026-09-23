package graph

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
)

// generateExpenseCategoriesForBudget creates one expense category per active
// recurring expense template, with the template's amount normalized to a
// monthly allocation. Budget expenses (actual spending) are recorded
// separately against these categories.
func generateExpenseCategoriesForBudget(
	ctx context.Context,
	recurringSvc *service.RecurringExpenseService,
	categorySvc *service.ExpenseCategoryService,
	userID uuid.UUID,
	budgetID uuid.UUID,
	budgetDate time.Time,
) error {
	templates, err := recurringSvc.ListByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("list recurring expenses: %w", err)
	}
	slog.Info("generateExpenseCategoriesForBudget: found templates", "count", len(templates))

	monthStart := time.Date(budgetDate.Year(), budgetDate.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, -1)

	for i := range templates {
		t := &templates[i]
		if t.EndDate != nil && t.EndDate.Before(monthStart) {
			continue
		}
		if t.StartDate.After(monthEnd) {
			continue
		}

		if _, err := categorySvc.Create(ctx, &service.CreateExpenseCategoryInput{
			UserID:           userID,
			BudgetID:         budgetID,
			Name:             t.Name,
			Allocation:       t.MonthlyAmount(),
			CurrentSpend:     decimalZero(),
			SourceType:       sqlc.ExpenseSourceTypeRECURRINGTEMPLATE,
			SourceTemplateID: &t.ID,
			GenerationMonth:  &monthStart,
		}); err != nil {
			return fmt.Errorf("create recurring expense category for %q: %w", t.Name, err)
		}
	}
	return nil
}

// removeRecurringExpenseCategoriesForBudget soft-deletes all expense categories
// and their expenses that were generated from recurring templates.
func removeRecurringExpenseCategoriesForBudget(
	ctx context.Context,
	categorySvc *service.ExpenseCategoryService,
	expenseSvc *service.ExpenseService,
	userID, budgetID uuid.UUID,
) error {
	// Remove generated expenses first
	existingExpenses, err := expenseSvc.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return err
	}
	for i := range existingExpenses {
		if existingExpenses[i].SourceType == sqlc.ExpenseSourceTypeRECURRINGTEMPLATE {
			_ = expenseSvc.Delete(ctx, userID, existingExpenses[i].ID)
		}
	}

	// Remove generated categories
	existingCategories, err := categorySvc.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return err
	}
	for i := range existingCategories {
		if existingCategories[i].SourceType == sqlc.ExpenseSourceTypeRECURRINGTEMPLATE {
			_ = categorySvc.Delete(ctx, userID, existingCategories[i].ID)
		}
	}
	return nil
}

// recalculateBudgetExpenses sums the allocation of all expense categories for
// the budget and updates the budget's MonthlyExpenses.
func recalculateBudgetExpenses(
	ctx context.Context,
	categorySvc *service.ExpenseCategoryService,
	budgetSvc *service.BudgetService,
	userID uuid.UUID,
	budget *service.Budget,
) *service.Budget {
	categories, listErr := categorySvc.ListByBudgetID(ctx, budget.ID)
	if listErr != nil {
		slog.Warn("recalculateBudgetExpenses: failed to list categories", "error", listErr)
		return budget
	}
	total := decimalZero()
	for i := range categories {
		total, _ = total.Add(categories[i].Allocation)
	}
	updated, updateErr := budgetSvc.Update(ctx, userID, &service.UpdateBudgetInput{
		ID:              budget.ID,
		MonthlyIncome:   budget.MonthlyIncome,
		MonthlyExpenses: total,
	})
	if updateErr != nil {
		slog.Warn("recalculateBudgetExpenses: failed to update budget", "error", updateErr)
		return budget
	}
	return updated
}
