package graph

import (
	"context"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
)

// generateIncomesForBudget queries the user's recurring income templates and
// creates income records for each occurrence that falls within the budget month.
func generateIncomesForBudget(
	ctx context.Context,
	recurringSvc *service.RecurringIncomeService,
	incomeSvc *service.IncomeService,
	userID uuid.UUID,
	budgetID uuid.UUID,
	budgetDate time.Time,
) error {
	templates, err := recurringSvc.ListByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("list recurring incomes: %w", err)
	}

	monthStart := time.Date(budgetDate.Year(), budgetDate.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, -1)

	for _, t := range templates {
		if t.EndDate != nil && t.EndDate.Before(monthStart) {
			continue
		}
		if t.StartDate.After(monthEnd) {
			continue
		}

		occurrences := recurringOccurrences(t, monthStart, monthEnd)
		for _, occ := range occurrences {
			if _, err := incomeSvc.Create(ctx, service.CreateIncomeInput{
				UserID:               userID,
				BudgetID:             budgetID,
				Name:                 t.Name,
				Amount:               t.Amount,
				Date:                 occ,
				SourceType:           sqlc.IncomeSourceTypeRECURRINGTEMPLATE,
				SourceTemplateID:     &t.ID,
				SourceOccurrenceDate: &occ,
				GenerationMonth:      &monthStart,
			}); err != nil {
				return fmt.Errorf("create recurring income for %q: %w", t.Name, err)
			}
		}
	}

	return nil
}

// recurringOccurrences returns the dates within [monthStart, monthEnd] that a
// recurring income template falls on, based on its recurrence interval.
func recurringOccurrences(t service.RecurringIncome, monthStart, monthEnd time.Time) []time.Time {
	effectiveStart := t.StartDate
	if effectiveStart.Before(monthStart) {
		effectiveStart = monthStart
	}
	effectiveEnd := monthEnd
	if t.EndDate != nil && t.EndDate.Before(monthEnd) {
		effectiveEnd = *t.EndDate
	}

	switch t.RecurrenceInterval {
	case sqlc.RecurrenceIntervalWEEKLY:
		var dates []time.Time
		for d := effectiveStart; !d.After(effectiveEnd); d = d.AddDate(0, 0, 7) {
			dates = append(dates, d)
		}
		return dates

	case sqlc.RecurrenceIntervalBIWEEKLY:
		var dates []time.Time
		for d := effectiveStart; !d.After(effectiveEnd); d = d.AddDate(0, 0, 14) {
			dates = append(dates, d)
		}
		return dates

	case sqlc.RecurrenceIntervalMONTHLY:
		day := 1
		if t.PaydayDayOfMonth != nil && *t.PaydayDayOfMonth > 0 {
			day = int(*t.PaydayDayOfMonth)
		}
		date := time.Date(monthStart.Year(), monthStart.Month(), day, 0, 0, 0, 0, time.UTC)
		if !date.Before(effectiveStart) && !date.After(effectiveEnd) {
			return []time.Time{date}
		}
		return nil

	case sqlc.RecurrenceIntervalQUARTERLY:
		if (monthStart.Month()-1)%3 == 0 {
			day := 1
			date := time.Date(monthStart.Year(), monthStart.Month(), day, 0, 0, 0, 0, time.UTC)
			if !date.Before(effectiveStart) && !date.After(effectiveEnd) {
				return []time.Time{date}
			}
		}
		return nil

	case sqlc.RecurrenceIntervalYEARLY:
		date := time.Date(monthStart.Year(), t.StartDate.Month(), t.StartDate.Day(), 0, 0, 0, 0, time.UTC)
		if date.Month() == monthStart.Month() && !date.Before(effectiveStart) && !date.After(effectiveEnd) {
			return []time.Time{date}
		}
		return nil

	default: // NONE or unknown — single occurrence on the start date if it falls within the month
		if !t.StartDate.Before(effectiveStart) && !t.StartDate.After(effectiveEnd) {
			return []time.Time{t.StartDate}
		}
		return nil
	}
}
