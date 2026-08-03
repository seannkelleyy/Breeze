package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func upsertPlannerPersonInputFromModel(input model.UpsertPlannerPersonInput) (service.UpsertPlannerPersonInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpsertPlannerPersonInput{}, fmt.Errorf("invalid planner person id: %w", err)
	}

	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.UpsertPlannerPersonInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	annualSalary, err := decimal.Parse(input.AnnualSalary)
	if err != nil {
		return service.UpsertPlannerPersonInput{}, fmt.Errorf("invalid annual salary: %w", err)
	}

	annualBonus, err := decimal.Parse(input.AnnualBonus)
	if err != nil {
		return service.UpsertPlannerPersonInput{}, fmt.Errorf("invalid annual bonus: %w", err)
	}

	incomeGrowthRate, err := decimal.Parse(input.IncomeGrowthRate)
	if err != nil {
		return service.UpsertPlannerPersonInput{}, fmt.Errorf("invalid income growth rate: %w", err)
	}

	return service.UpsertPlannerPersonInput{
		ID:               id,
		UserID:           userID,
		Name:             input.Name,
		Birthday:         input.Birthday,
		RetirementAge:    int32(input.RetirementAge),
		AnnualSalary:     annualSalary,
		BonusMode:        input.BonusMode,
		AnnualBonus:      annualBonus,
		IncomeGrowthRate: incomeGrowthRate,
	}, nil
}

func mapPlannerPersonToModel(person *service.PlannerPerson) *model.PlannerPerson {
	return &model.PlannerPerson{
		ID:               person.ID.String(),
		UserID:           person.UserID.String(),
		Name:             person.Name,
		Birthday:         person.Birthday,
		RetirementAge:    int(person.RetirementAge),
		AnnualSalary:     person.AnnualSalary.String(),
		BonusMode:        person.BonusMode,
		AnnualBonus:      person.AnnualBonus.String(),
		IncomeGrowthRate: person.IncomeGrowthRate.String(),
		CreatedAt:        person.CreatedAt.Format(time.RFC3339),
		UpdatedAt:        person.UpdatedAt.Format(time.RFC3339),
	}
}
