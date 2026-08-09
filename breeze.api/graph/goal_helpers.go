package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/govalues/decimal"
	"github.com/google/uuid"
)

func createGoalInputFromModel(input model.CreateGoalInput) (service.CreateGoalInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateGoalInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	var targetAmount *decimal.Decimal
	if input.TargetAmount != nil {
		parsed, parseErr := decimal.Parse(*input.TargetAmount)
		if parseErr != nil {
			return service.CreateGoalInput{}, fmt.Errorf("invalid target amount: %w", parseErr)
		}
		targetAmount = &parsed
	}

	var targetDate *time.Time
	if input.TargetDate != nil {
		parsed, parseErr := time.Parse(time.RFC3339, *input.TargetDate)
		if parseErr != nil {
			return service.CreateGoalInput{}, fmt.Errorf("invalid target date: %w", parseErr)
		}
		targetDate = &parsed
	}

	var connectedAccountIDs []uuid.UUID
	for _, id := range input.ConnectedAccountIds {
		parsed, parseErr := uuid.Parse(id)
		if parseErr != nil {
			return service.CreateGoalInput{}, fmt.Errorf("invalid connected account id: %w", parseErr)
		}
		connectedAccountIDs = append(connectedAccountIDs, parsed)
	}

	return service.CreateGoalInput{
		UserID:               userID,
		Description:          input.Description,
		IsCompleted:          input.IsCompleted,
		TargetAmount:         targetAmount,
		TargetDate:           targetDate,
		Category:             input.Category,
		CustomCategory:       input.CustomCategory,
		Priority:             int32(input.Priority),
		Notes:                input.Notes,
		ConnectedAccountIDs:  connectedAccountIDs,
		IsFinancialOrderStep: input.IsFinancialOrderStep,
		FinancialOrderStep:   int32Ptr(input.FinancialOrderStep),
	}, nil
}

func updateGoalInputFromModel(input model.UpdateGoalInput) (service.UpdateGoalInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateGoalInput{}, fmt.Errorf("invalid goal id: %w", err)
	}

	var targetAmount *decimal.Decimal
	if input.TargetAmount != nil {
		parsed, parseErr := decimal.Parse(*input.TargetAmount)
		if parseErr != nil {
			return service.UpdateGoalInput{}, fmt.Errorf("invalid target amount: %w", parseErr)
		}
		targetAmount = &parsed
	}

	var targetDate *time.Time
	if input.TargetDate != nil {
		parsed, parseErr := time.Parse(time.RFC3339, *input.TargetDate)
		if parseErr != nil {
			return service.UpdateGoalInput{}, fmt.Errorf("invalid target date: %w", parseErr)
		}
		targetDate = &parsed
	}

	var connectedAccountIDs []uuid.UUID
	for _, id := range input.ConnectedAccountIds {
		parsed, parseErr := uuid.Parse(id)
		if parseErr != nil {
			return service.UpdateGoalInput{}, fmt.Errorf("invalid connected account id: %w", parseErr)
		}
		connectedAccountIDs = append(connectedAccountIDs, parsed)
	}

	return service.UpdateGoalInput{
		ID:                   id,
		Description:          input.Description,
		IsCompleted:          input.IsCompleted,
		TargetAmount:         targetAmount,
		TargetDate:           targetDate,
		Category:             input.Category,
		CustomCategory:       input.CustomCategory,
		Priority:             int32(input.Priority),
		Notes:                input.Notes,
		ConnectedAccountIDs:  connectedAccountIDs,
		IsFinancialOrderStep: input.IsFinancialOrderStep,
		FinancialOrderStep:   int32Ptr(input.FinancialOrderStep),
	}, nil
}

func mapGoalToModel(goal *service.Goal) *model.Goal {
	var targetAmount *string
	if goal.TargetAmount != nil {
		value := goal.TargetAmount.String()
		targetAmount = &value
	}

	var targetDate *string
	if goal.TargetDate != nil {
		value := goal.TargetDate.Format(time.RFC3339)
		targetDate = &value
	}

	var connectedAccountIds []string
	for _, id := range goal.ConnectedAccountIDs {
		connectedAccountIds = append(connectedAccountIds, id.String())
	}

	return &model.Goal{
		ID:                   goal.ID.String(),
		UserID:               goal.UserID.String(),
		Description:          goal.Description,
		IsCompleted:          goal.IsCompleted,
		TargetAmount:         targetAmount,
		TargetDate:           targetDate,
		Category:             goal.Category,
		CustomCategory:       goal.CustomCategory,
		Priority:             int(goal.Priority),
		Notes:                goal.Notes,
		ConnectedAccountIds:  connectedAccountIds,
		IsFinancialOrderStep: goal.IsFinancialOrderStep,
		FinancialOrderStep:   int32PtrToInt(goal.FinancialOrderStep),
		CreatedAt:            goal.CreatedAt.Format(time.RFC3339),
		UpdatedAt:            goal.UpdatedAt.Format(time.RFC3339),
	}
}
