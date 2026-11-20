package service

import (
	"time"

	"breeze.api/internal/db/sqlc"
)

// budgetMonthBounds returns the first and last day of the budget month that
// contains date, in UTC.
func budgetMonthBounds(date time.Time) (start, end time.Time) {
	start = time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
	return start, start.AddDate(0, 1, -1)
}

// templateCoversMonth reports whether a recurring template is active at any
// point in the month.
func templateCoversMonth(start time.Time, end *time.Time, monthStart, monthEnd time.Time) bool {
	if end != nil && end.Before(monthStart) {
		return false
	}
	return !start.After(monthEnd)
}

// recurringOccurrences returns the dates within [monthStart, monthEnd] that a
// recurring income template falls on, based on its recurrence interval.
func recurringOccurrences(t *RecurringIncome, monthStart, monthEnd time.Time) []time.Time {
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
			date := time.Date(monthStart.Year(), monthStart.Month(), 1, 0, 0, 0, 0, time.UTC)
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
