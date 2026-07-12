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
	slog.Info("generateIncomesForBudget: found templates", "count", len(templates))

	monthStart := time.Date(budgetDate.Year(), budgetDate.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, -1)

	created := 0
	for _, t := range templates {
		slog.Info("generateIncomesForBudget: template", "name", t.Name, "amount", t.Amount.String(), "start", t.StartDate, "end", t.EndDate, "interval", t.RecurrenceInterval)
		if t.EndDate != nil && t.EndDate.Before(monthStart) {
			slog.Info("generateIncomesForBudget: skipping (end before month)", "name", t.Name)
			continue
		}
		if t.StartDate.After(monthEnd) {
			slog.Info("generateIncomesForBudget: skipping (start after month)", "name", t.Name)
			continue
		}

		occurrences := recurringOccurrences(t, monthStart, monthEnd)
		slog.Info("generateIncomesForBudget: occurrences", "name", t.Name, "count", len(occurrences))
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
			created++
		}
	}
	slog.Info("generateIncomesForBudget: done", "created", created)
	return nil
}

// recurringOccurrences returns the dates within [monthStart, monthEnd] that a
// recurring income template falls on, based on its recurrence interval.
func recurringOccurrences(t service.RecurringIncome, monthStart, monthEnd time.Time) []time.Time {
	effectiveEnd := monthEnd
	if t.EndDate != nil && t.EndDate.Before(monthEnd) {
		effectiveEnd = *t.EndDate
	}

	switch t.RecurrenceInterval {
	case sqlc.RecurrenceIntervalWEEKLY:
		var dates []time.Time
		d := firstOccurrence(t.StartDate, 7, monthStart)
		for ; !d.After(effectiveEnd); d = d.AddDate(0, 0, 7) {
			dates = append(dates, d)
		}
		return dates

	case sqlc.RecurrenceIntervalBIWEEKLY:
		var dates []time.Time
		d := firstOccurrence(t.StartDate, 14, monthStart)
		for ; !d.After(effectiveEnd); d = d.AddDate(0, 0, 14) {
			dates = append(dates, d)
		}
		return dates

	case sqlc.RecurrenceIntervalMONTHLY:
		day := 1
		if t.PaydayDayOfMonth != nil && *t.PaydayDayOfMonth > 0 {
			day = int(*t.PaydayDayOfMonth)
		}
		date := time.Date(monthStart.Year(), monthStart.Month(), day, 0, 0, 0, 0, time.UTC)
		if !date.Before(t.StartDate) && !date.After(effectiveEnd) {
			return []time.Time{date}
		}
		return nil

	case sqlc.RecurrenceIntervalQUARTERLY:
		if (monthStart.Month()-1)%3 == 0 {
			day := 1
			date := time.Date(monthStart.Year(), monthStart.Month(), day, 0, 0, 0, 0, time.UTC)
			if !date.Before(t.StartDate) && !date.After(effectiveEnd) {
				return []time.Time{date}
			}
		}
		return nil

	case sqlc.RecurrenceIntervalYEARLY:
		date := time.Date(monthStart.Year(), t.StartDate.Month(), t.StartDate.Day(), 0, 0, 0, 0, time.UTC)
		if date.Month() == monthStart.Month() && !date.Before(t.StartDate) && !date.After(effectiveEnd) {
			return []time.Time{date}
		}
		return nil

	default: // NONE or unknown — single occurrence on the start date if it falls within the month
		if !t.StartDate.Before(monthStart) && !t.StartDate.After(effectiveEnd) {
			return []time.Time{t.StartDate}
		}
		return nil
	}
}

// firstOccurrence returns the first occurrence of a schedule on or after
// target, given a start date and interval in days. The schedule starts on
// start and repeats every intervalDays.
func firstOccurrence(start time.Time, intervalDays int, target time.Time) time.Time {
	if !target.After(start) {
		return start
	}
	elapsed := int(target.Sub(start).Hours() / 24)
	intervals := (elapsed + intervalDays - 1) / intervalDays
	return start.AddDate(0, 0, intervals*intervalDays)
}
