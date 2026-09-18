package graph

import (
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
)

// ─── firstOccurrence ────────────────────────────────────

func TestFirstOccurrence(t *testing.T) {
	t.Run("target before start returns start", func(t *testing.T) {
		start := time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC)
		target := time.Date(2024, 6, 10, 0, 0, 0, 0, time.UTC)
		result := firstOccurrence(start, 7, target)
		if !result.Equal(start) {
			t.Fatalf("expected start, got %v", result)
		}
	})

	t.Run("target equals start returns start", func(t *testing.T) {
		start := time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC)
		result := firstOccurrence(start, 7, start)
		if !result.Equal(start) {
			t.Fatalf("expected start, got %v", result)
		}
	})

	t.Run("weekly: target 3 days after start returns next occurrence", func(t *testing.T) {
		start := time.Date(2024, 6, 10, 0, 0, 0, 0, time.UTC)  // Monday
		target := time.Date(2024, 6, 13, 0, 0, 0, 0, time.UTC) // Thursday (3 days later)
		result := firstOccurrence(start, 7, target)
		expected := time.Date(2024, 6, 17, 0, 0, 0, 0, time.UTC) // Next Monday
		if !result.Equal(expected) {
			t.Fatalf("expected %v, got %v", expected, result)
		}
	})

	t.Run("weekly: target on occurrence day returns that day", func(t *testing.T) {
		start := time.Date(2024, 6, 10, 0, 0, 0, 0, time.UTC)  // Monday
		target := time.Date(2024, 6, 17, 0, 0, 0, 0, time.UTC) // Next Monday
		result := firstOccurrence(start, 7, target)
		if !result.Equal(target) {
			t.Fatalf("expected %v, got %v", target, result)
		}
	})

	t.Run("biweekly: 10 days after start", func(t *testing.T) {
		start := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		target := time.Date(2024, 6, 11, 0, 0, 0, 0, time.UTC) // 10 days later
		result := firstOccurrence(start, 14, target)
		expected := time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC) // 14 days after start
		if !result.Equal(expected) {
			t.Fatalf("expected %v, got %v", expected, result)
		}
	})
}

// ─── recurringOccurrences: WEEKLY ──────────────────────

func TestRecurringOccurrencesWeekly(t *testing.T) {
	t.Run("single occurrence in month", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 6, 3, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalWEEKLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 4 {
			t.Fatalf("expected 4 weekly occurrences, got %d", len(result))
		}
		// All should be on Mondays (June 3, 10, 17, 24)
		expectedDays := []int{3, 10, 17, 24}
		for i, d := range result {
			if d.Day() != expectedDays[i] {
				t.Fatalf("occurrence %d: expected day %d, got %d", i, expectedDays[i], d.Day())
			}
		}
	})

	t.Run("no occurrences when start after month", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalWEEKLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 0 {
			t.Fatalf("expected 0, got %d", len(result))
		}
	})

	t.Run("end date clips occurrences", func(t *testing.T) {
		endDate := time.Date(2024, 6, 14, 0, 0, 0, 0, time.UTC)
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 6, 3, 0, 0, 0, 0, time.UTC),
			EndDate:            &endDate,
			RecurrenceInterval: sqlc.RecurrenceIntervalWEEKLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		// Only June 3 and 10 fall before end date (June 14)
		if len(result) != 2 {
			t.Fatalf("expected 2 occurrences, got %d", len(result))
		}
	})
}

// ─── recurringOccurrences: BIWEEKLY ────────────────────

func TestRecurringOccurrencesBiweekly(t *testing.T) {
	t.Run("three occurrences in month", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalBIWEEKLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 3 {
			t.Fatalf("expected 3 biweekly occurrences, got %d", len(result))
		}
		expectedDays := []int{1, 15, 29}
		for i, d := range result {
			if d.Day() != expectedDays[i] {
				t.Fatalf("occurrence %d: expected day %d, got %d", i, expectedDays[i], d.Day())
			}
		}
	})
}

// ─── recurringOccurrences: MONTHLY ─────────────────────

func TestRecurringOccurrencesMonthly(t *testing.T) {
	t.Run("with payday day of month", func(t *testing.T) {
		payday := int32(15)
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
			PaydayDayOfMonth:   &payday,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 1 {
			t.Fatalf("expected 1, got %d", len(result))
		}
		if result[0].Day() != 15 {
			t.Fatalf("expected day 15, got %d", result[0].Day())
		}
	})

	t.Run("without payday defaults to day 1", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 1 {
			t.Fatalf("expected 1, got %d", len(result))
		}
		if result[0].Day() != 1 {
			t.Fatalf("expected day 1, got %d", result[0].Day())
		}
	})

	t.Run("day 31 in 30-day month returns no occurrences", func(t *testing.T) {
		payday := int32(31)
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
			PaydayDayOfMonth:   &payday,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 0 {
			t.Fatalf("expected 0 (day 31 doesn't exist in June), got %d", len(result))
		}
	})

	t.Run("start date after payday day returns no occurrences", func(t *testing.T) {
		payday := int32(10)
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
			PaydayDayOfMonth:   &payday,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 0 {
			t.Fatalf("expected 0 (start date is after payday), got %d", len(result))
		}
	})
}

// ─── recurringOccurrences: QUARTERLY ───────────────────

func TestRecurringOccurrencesQuarterly(t *testing.T) {
	t.Run("Q1 month (January)", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalQUARTERLY,
		}
		monthStart := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 1 {
			t.Fatalf("expected 1, got %d", len(result))
		}
	})

	t.Run("non-Q1 month (February) returns none", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalQUARTERLY,
		}
		monthStart := time.Date(2024, 2, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 2, 29, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 0 {
			t.Fatalf("expected 0 for non-quarter month, got %d", len(result))
		}
	})

	t.Run("Q2 month (April)", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalQUARTERLY,
		}
		monthStart := time.Date(2024, 4, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 4, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 1 {
			t.Fatalf("expected 1 for Q2, got %d", len(result))
		}
	})
}

// ─── recurringOccurrences: YEARLY ──────────────────────

func TestRecurringOccurrencesYearly(t *testing.T) {
	t.Run("occurrence in correct month", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2020, 6, 15, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalYEARLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 1 {
			t.Fatalf("expected 1, got %d", len(result))
		}
		if result[0].Day() != 15 {
			t.Fatalf("expected day 15, got %d", result[0].Day())
		}
		if result[0].Year() != 2024 {
			t.Fatalf("expected year 2024, got %d", result[0].Year())
		}
	})

	t.Run("wrong month returns none", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2020, 6, 15, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalYEARLY,
		}
		monthStart := time.Date(2024, 7, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 0 {
			t.Fatalf("expected 0, got %d", len(result))
		}
	})
}

// ─── recurringOccurrences: NONE ────────────────────────

func TestRecurringOccurrencesNone(t *testing.T) {
	t.Run("start date within month", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalNONE,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 1 {
			t.Fatalf("expected 1, got %d", len(result))
		}
	})

	t.Run("start date before month returns none", func(t *testing.T) {
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 5, 15, 0, 0, 0, 0, time.UTC),
			RecurrenceInterval: sqlc.RecurrenceIntervalNONE,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 0 {
			t.Fatalf("expected 0, got %d", len(result))
		}
	})
}

// ─── End date clipping edge cases ──────────────────────

func TestRecurringOccurrencesEndClipping(t *testing.T) {
	t.Run("end date before month start skips template", func(t *testing.T) {
		endDate := time.Date(2024, 5, 1, 0, 0, 0, 0, time.UTC)
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			EndDate:            &endDate,
			RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		if len(result) != 0 {
			t.Fatalf("expected 0, got %d", len(result))
		}
	})

	t.Run("end date mid-month clips to end date", func(t *testing.T) {
		endDate := time.Date(2024, 6, 10, 0, 0, 0, 0, time.UTC)
		tmpl := service.RecurringIncome{
			StartDate:          time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
			EndDate:            &endDate,
			RecurrenceInterval: sqlc.RecurrenceIntervalWEEKLY,
		}
		monthStart := time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC)
		monthEnd := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)
		result := recurringOccurrences(&tmpl, monthStart, monthEnd)
		// Only June 1, 8 fall before end date (June 10)
		if len(result) != 2 {
			t.Fatalf("expected 2, got %d", len(result))
		}
	})
}
