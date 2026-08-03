package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
)

func createGoalInputFromModel(input model.CreateGoalInput) (service.CreateGoalInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateGoalInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	return service.CreateGoalInput{
		UserID:      userID,
		Description: input.Description,
		IsCompleted: input.IsCompleted,
	}, nil
}

func updateGoalInputFromModel(input model.UpdateGoalInput) (service.UpdateGoalInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateGoalInput{}, fmt.Errorf("invalid goal id: %w", err)
	}

	return service.UpdateGoalInput{
		ID:          id,
		Description: input.Description,
		IsCompleted: input.IsCompleted,
	}, nil
}

func mapGoalToModel(goal *service.Goal) *model.Goal {
	return &model.Goal{
		ID:          goal.ID.String(),
		UserID:      goal.UserID.String(),
		Description: goal.Description,
		IsCompleted: goal.IsCompleted,
		CreatedAt:   goal.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   goal.UpdatedAt.Format(time.RFC3339),
	}
}
