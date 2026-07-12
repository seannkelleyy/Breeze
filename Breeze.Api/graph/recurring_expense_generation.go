package graph

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

// generateExpenseCategoriesForBudget queries the user's recurring expense
// templates and creates expense category + expense records for each occurrence
// that falls within the budget month.
func generateExpenseCategoriesForBudget(
	ctx context.Context,
	recurringSvc *service.RecurringExpenseService,
	categorySvc *service.ExpenseCategoryService,
	expenseSvc *service.ExpenseService,
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

	created := 0
	for _, t := range templates {
		slog.Info("generateExpenseCategoriesForBudget: template", "name", t.Name, "amount", t.Amount.String(), "start", t.StartDate, "end", t.EndDate, "interval", t.RecurrenceInterval)
		if t.EndDate != nil && t.EndDate.Before(monthStart) {
			continue
		}
		if t.StartDate.After(monthEnd) {
			continue
		}

		occurrences := recurringOccurrences(t.RecurringIncome(), monthStart, monthEnd)
		slog.Info("generateExpenseCategoriesForBudget: occurrences", "name", t.Name, "count", len(occurrences))
		for _, occ := range occurrences {
			// Create expense category
			cat, err := categorySvc.Create(ctx, service.CreateExpenseCategoryInput{
				UserID:           userID,
				BudgetID:         budgetID,
				Name:             t.Name,
				Allocation:       t.Amount,
				CurrentSpend:     decimal.Zero,
				SourceType:       sqlc.ExpenseSourceTypeRECURRINGTEMPLATE,
				SourceTemplateID: &t.ID,
				GenerationMonth:  &monthStart,
			})
			if err != nil {
				return fmt.Errorf("create recurring expense category for %q: %w", t.Name, err)
			}

			// Create expense with a single split to the category
			_, err = expenseSvc.Create(ctx, service.CreateExpenseInput{
				UserID:           userID,
				BudgetID:         budgetID,
				Amount:           t.Amount,
				Date:             occ,
				Description:      t.Name,
				SourceType:       sqlc.ExpenseSourceTypeRECURRINGTEMPLATE,
				SourceTemplateID: &t.ID,
				GenerationMonth:  &monthStart,
				Splits: []service.ExpenseSplitInput{
					{
						CategoryID: cat.ID,
						Amount:     t.Amount,
					},
				},
			})
			if err != nil {
				return fmt.Errorf("create recurring expense for %q: %w", t.Name, err)
			}
			created++
		}
	}
	slog.Info("generateExpenseCategoriesForBudget: done", "created", created)
	return nil
}

// removeRecurringExpenseCategoriesForBudget soft-deletes all expense categories
// and their expenses that were generated from recurring templates.
func removeRecurringExpenseCategoriesForBudget(
	ctx context.Context,
	categorySvc *service.ExpenseCategoryService,
	expenseSvc *service.ExpenseService,
	budgetID uuid.UUID,
) error {
	// Remove generated expenses first
	existingExpenses, err := expenseSvc.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return err
	}
	for _, exp := range existingExpenses {
		if exp.SourceType == sqlc.ExpenseSourceTypeRECURRINGTEMPLATE {
			_ = expenseSvc.Delete(ctx, exp.ID)
		}
	}

	// Remove generated categories
	existingCategories, err := categorySvc.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return err
	}
	for _, cat := range existingCategories {
		if cat.SourceType == sqlc.ExpenseSourceTypeRECURRINGTEMPLATE {
			_ = categorySvc.Delete(ctx, cat.ID)
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
	budget *service.Budget,
) *service.Budget {
	categories, listErr := categorySvc.ListByBudgetID(ctx, budget.ID)
	if listErr != nil {
		slog.Warn("recalculateBudgetExpenses: failed to list categories", "error", listErr)
		return budget
	}
	total := decimalZero()
	for _, cat := range categories {
		total, _ = total.Add(cat.Allocation)
	}
	updated, updateErr := budgetSvc.Update(ctx, service.UpdateBudgetInput{
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
