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

func createIncomeInputFromModel(input model.CreateIncomeInput) (service.CreateIncomeInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateIncomeInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	budgetID, err := uuid.Parse(input.BudgetID)
	if err != nil {
		return service.CreateIncomeInput{}, fmt.Errorf("invalid budget id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.CreateIncomeInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	incomeDate, err := parseDate(input.Date)
	if err != nil {
		return service.CreateIncomeInput{}, fmt.Errorf("invalid income date: %w", err)
	}

	sourceTemplateID, err := parseOptionalUUID(input.SourceTemplateID)
	if err != nil {
		return service.CreateIncomeInput{}, err
	}

	sourceOccurrenceDate, err := parseOptionalDate(input.SourceOccurrenceDate)
	if err != nil {
		return service.CreateIncomeInput{}, err
	}

	generationMonth, err := parseOptionalDate(input.GenerationMonth)
	if err != nil {
		return service.CreateIncomeInput{}, err
	}

	personID, err := parseOptionalUUID(input.PersonID)
	if err != nil {
		return service.CreateIncomeInput{}, err
	}

	return service.CreateIncomeInput{
		UserID:               userID,
		BudgetID:             budgetID,
		Name:                 input.Name,
		Amount:               amount,
		Date:                 incomeDate,
		PersonID:             personID,
		SourceType:           sqlc.IncomeSourceType(input.SourceType),
		SourceTemplateID:     sourceTemplateID,
		SourceOccurrenceDate: sourceOccurrenceDate,
		GenerationMonth:      generationMonth,
	}, nil
}

func updateIncomeInputFromModel(input model.UpdateIncomeInput) (service.UpdateIncomeInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateIncomeInput{}, fmt.Errorf("invalid income id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.UpdateIncomeInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	incomeDate, err := parseDate(input.Date)
	if err != nil {
		return service.UpdateIncomeInput{}, fmt.Errorf("invalid income date: %w", err)
	}

	sourceTemplateID, err := parseOptionalUUID(input.SourceTemplateID)
	if err != nil {
		return service.UpdateIncomeInput{}, err
	}

	sourceOccurrenceDate, err := parseOptionalDate(input.SourceOccurrenceDate)
	if err != nil {
		return service.UpdateIncomeInput{}, err
	}

	generationMonth, err := parseOptionalDate(input.GenerationMonth)
	if err != nil {
		return service.UpdateIncomeInput{}, err
	}

	personID, err := parseOptionalUUID(input.PersonID)
	if err != nil {
		return service.UpdateIncomeInput{}, err
	}

	return service.UpdateIncomeInput{
		ID:                   id,
		Name:                 input.Name,
		Amount:               amount,
		Date:                 incomeDate,
		PersonID:             personID,
		SourceType:           sqlc.IncomeSourceType(input.SourceType),
		SourceTemplateID:     sourceTemplateID,
		SourceOccurrenceDate: sourceOccurrenceDate,
		GenerationMonth:      generationMonth,
	}, nil
}

func createRecurringIncomeInputFromModel(input model.CreateRecurringIncomeInput) (service.CreateRecurringIncomeInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateRecurringIncomeInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.CreateRecurringIncomeInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	startDate, err := parseDate(input.StartDate)
	if err != nil {
		return service.CreateRecurringIncomeInput{}, fmt.Errorf("invalid start date: %w", err)
	}

	endDate, err := parseOptionalDate(input.EndDate)
	if err != nil {
		return service.CreateRecurringIncomeInput{}, err
	}

	paydayDayOfMonth := int32Ptr(input.PaydayDayOfMonth)

	personID, err := parseOptionalUUID(input.PersonID)
	if err != nil {
		return service.CreateRecurringIncomeInput{}, err
	}

	return service.CreateRecurringIncomeInput{
		UserID:             userID,
		Name:               input.Name,
		Amount:             amount,
		RecurrenceInterval: sqlc.RecurrenceInterval(input.RecurrenceInterval),
		PaydayDayOfMonth:   paydayDayOfMonth,
		StartDate:          startDate,
		EndDate:            endDate,
		PersonID:           personID,
	}, nil
}

func updateRecurringIncomeInputFromModel(input model.UpdateRecurringIncomeInput) (service.UpdateRecurringIncomeInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateRecurringIncomeInput{}, fmt.Errorf("invalid recurring income id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.UpdateRecurringIncomeInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	startDate, err := parseDate(input.StartDate)
	if err != nil {
		return service.UpdateRecurringIncomeInput{}, fmt.Errorf("invalid start date: %w", err)
	}

	endDate, err := parseOptionalDate(input.EndDate)
	if err != nil {
		return service.UpdateRecurringIncomeInput{}, err
	}

	paydayDayOfMonth := int32Ptr(input.PaydayDayOfMonth)

	personID, err := parseOptionalUUID(input.PersonID)
	if err != nil {
		return service.UpdateRecurringIncomeInput{}, err
	}

	return service.UpdateRecurringIncomeInput{
		ID:                 id,
		Name:               input.Name,
		Amount:             amount,
		RecurrenceInterval: sqlc.RecurrenceInterval(input.RecurrenceInterval),
		PaydayDayOfMonth:   paydayDayOfMonth,
		StartDate:          startDate,
		EndDate:            endDate,
		PersonID:           personID,
	}, nil
}

func mapIncomeToModel(income *service.Income) *model.Income {
	if income == nil {
		return nil
	}

	return &model.Income{
		ID:                   income.ID.String(),
		UserID:               income.UserID.String(),
		BudgetID:             income.BudgetID.String(),
		Name:                 income.Name,
		Amount:               income.Amount.String(),
		Date:                 income.Date.Format(time.RFC3339),
		SourceType:           model.IncomeSourceType(income.SourceType),
		SourceTemplateID:     uuidPtrToString(income.SourceTemplateID),
		SourceOccurrenceDate: formatOptionalDate(income.SourceOccurrenceDate),
		GenerationMonth:      formatOptionalDate(income.GenerationMonth),
		PersonID:             uuidPtrToString(income.PersonID),
		CreatedAt:            income.CreatedAt.Format(time.RFC3339),
		UpdatedAt:            income.UpdatedAt.Format(time.RFC3339),
	}
}

func mapRecurringIncomeToModel(income *service.RecurringIncome) *model.RecurringIncome {
	if income == nil {
		return nil
	}

	return &model.RecurringIncome{
		ID:                 income.ID.String(),
		UserID:             income.UserID.String(),
		Name:               income.Name,
		Amount:             income.Amount.String(),
		RecurrenceInterval: model.RecurrenceInterval(income.RecurrenceInterval),
		PaydayDayOfMonth:   int32PtrToInt(income.PaydayDayOfMonth),
		StartDate:          income.StartDate.Format(time.RFC3339),
		EndDate:            formatOptionalDate(income.EndDate),
		PersonID:           uuidPtrToString(income.PersonID),
		CreatedAt:          income.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          income.UpdatedAt.Format(time.RFC3339),
	}
}

func parseOptionalUUID(value *string) (*uuid.UUID, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	parsed, err := uuid.Parse(*value)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}
	return &parsed, nil
}

func parseDate(value string) (time.Time, error) {
	parsed, err := time.Parse(time.RFC3339, value)
	if err == nil {
		return parsed, nil
	}
	parsed, err = time.Parse("2006-01-02", value)
	if err == nil {
		return parsed, nil
	}
	return time.Time{}, fmt.Errorf("cannot parse date %q: expected RFC3339 or YYYY-MM-DD", value)
}

func parseOptionalDate(value *string) (*time.Time, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	parsed, err := parseDate(*value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func formatOptionalDate(value *time.Time) *string {
	if value == nil {
		return nil
	}
	formatted := value.Format(time.RFC3339)
	return &formatted
}

func uuidPtrToString(value *uuid.UUID) *string {
	if value == nil {
		return nil
	}
	text := value.String()
	return &text
}

func int32Ptr(value *int) *int32 {
	if value == nil {
		return nil
	}
	v := int32(*value)
	return &v
}

func int32PtrToInt(value *int32) *int {
	if value == nil {
		return nil
	}
	v := int(*value)
	return &v
}

func parseUUIDSlice(values []string) ([]uuid.UUID, error) {
	ids := make([]uuid.UUID, 0, len(values))
	for _, v := range values {
		parsed, err := uuid.Parse(v)
		if err != nil {
			return nil, fmt.Errorf("invalid id %q: %w", v, err)
		}
		ids = append(ids, parsed)
	}
	return ids, nil
}

func uuidSliceToStringSlice(values []uuid.UUID) []string {
	strs := make([]string, 0, len(values))
	for _, v := range values {
		strs = append(strs, v.String())
	}
	return strs
}
