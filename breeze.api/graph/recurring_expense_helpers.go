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

func createRecurringExpenseInputFromModel(input model.CreateRecurringExpenseInput) (service.CreateRecurringExpenseInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateRecurringExpenseInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.CreateRecurringExpenseInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	startDate, err := parseDate(input.StartDate)
	if err != nil {
		return service.CreateRecurringExpenseInput{}, fmt.Errorf("invalid start date: %w", err)
	}

	endDate, err := parseOptionalDate(input.EndDate)
	if err != nil {
		return service.CreateRecurringExpenseInput{}, err
	}

	paydayDayOfMonth := int32Ptr(input.PaydayDayOfMonth)

	personID, err := parseOptionalUUID(input.PersonID)
	if err != nil {
		return service.CreateRecurringExpenseInput{}, err
	}

	return service.CreateRecurringExpenseInput{
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

func updateRecurringExpenseInputFromModel(input model.UpdateRecurringExpenseInput) (service.UpdateRecurringExpenseInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateRecurringExpenseInput{}, fmt.Errorf("invalid recurring expense id: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.UpdateRecurringExpenseInput{}, fmt.Errorf("invalid amount: %w", err)
	}

	startDate, err := parseDate(input.StartDate)
	if err != nil {
		return service.UpdateRecurringExpenseInput{}, fmt.Errorf("invalid start date: %w", err)
	}

	endDate, err := parseOptionalDate(input.EndDate)
	if err != nil {
		return service.UpdateRecurringExpenseInput{}, err
	}

	paydayDayOfMonth := int32Ptr(input.PaydayDayOfMonth)

	personID, err := parseOptionalUUID(input.PersonID)
	if err != nil {
		return service.UpdateRecurringExpenseInput{}, err
	}

	return service.UpdateRecurringExpenseInput{
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

func mapRecurringExpenseToModel(expense *service.RecurringExpense) *model.RecurringExpense {
	if expense == nil {
		return nil
	}

	return &model.RecurringExpense{
		ID:                 expense.ID.String(),
		UserID:             expense.UserID.String(),
		Name:               expense.Name,
		Amount:             expense.Amount.String(),
		RecurrenceInterval: model.RecurrenceInterval(expense.RecurrenceInterval),
		PaydayDayOfMonth:   int32PtrToInt(expense.PaydayDayOfMonth),
		StartDate:          expense.StartDate.Format(time.RFC3339),
		EndDate:            formatOptionalDate(expense.EndDate),
		PersonID:           uuidPtrToString(expense.PersonID),
		CreatedAt:          expense.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          expense.UpdatedAt.Format(time.RFC3339),
	}
}
