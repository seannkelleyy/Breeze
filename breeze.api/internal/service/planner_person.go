package service

import (
	"context"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

type PlannerPerson struct {
	ID                   uuid.UUID
	UserID               uuid.UUID
	Name                 string
	Birthday             string
	RetirementAge        int32
	AnnualSalary         decimal.Decimal
	BonusMode            string
	AnnualBonus          decimal.Decimal
	IncomeGrowthRate     decimal.Decimal
	PayType              string
	PayDay               int32
	PayCadence           string
	HourlyRate           decimal.Decimal
	ExpectedHoursPerWeek decimal.Decimal
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type UpsertPlannerPersonInput struct {
	ID                   uuid.UUID
	UserID               uuid.UUID
	Name                 string
	Birthday             string
	RetirementAge        int32
	AnnualSalary         decimal.Decimal
	BonusMode            string
	AnnualBonus          decimal.Decimal
	IncomeGrowthRate     decimal.Decimal
	PayType              string
	PayDay               int32
	PayCadence           string
	HourlyRate           decimal.Decimal
	ExpectedHoursPerWeek decimal.Decimal
}

type plannerPersonQuerier interface {
	UpsertPlannerPerson(ctx context.Context, arg sqlc.UpsertPlannerPersonParams) (sqlc.UpsertPlannerPersonRow, error)
	ListPlannerPeopleByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListPlannerPeopleByUserIDRow, error)
	SoftDeletePlannerPerson(ctx context.Context, id uuid.UUID) (int64, error)
	SoftDeletePlannerPeopleByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
}

type PlannerPersonService struct {
	queries plannerPersonQuerier
}

func NewPlannerPersonService(queries plannerPersonQuerier) *PlannerPersonService {
	return &PlannerPersonService{queries: queries}
}

func (s *PlannerPersonService) Upsert(ctx context.Context, input *UpsertPlannerPersonInput) (*PlannerPerson, error) {
	row, err := s.queries.UpsertPlannerPerson(ctx, sqlc.UpsertPlannerPersonParams{
		ID:                   input.ID,
		UserID:               input.UserID,
		Name:                 input.Name,
		Birthday:             input.Birthday,
		RetirementAge:        input.RetirementAge,
		AnnualSalary:         input.AnnualSalary,
		BonusMode:            input.BonusMode,
		AnnualBonus:          input.AnnualBonus,
		IncomeGrowthRate:     input.IncomeGrowthRate,
		PayType:              input.PayType,
		PayDay:               input.PayDay,
		PayCadence:           input.PayCadence,
		HourlyRate:           input.HourlyRate,
		ExpectedHoursPerWeek: input.ExpectedHoursPerWeek,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert planner person: %w", err)
	}

	person := mapPlannerPersonUpsertRecord(&row)
	return &person, nil
}

func (s *PlannerPersonService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]PlannerPerson, error) {
	rows, err := s.queries.ListPlannerPeopleByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list planner people by user id: %w", err)
	}

	people := make([]PlannerPerson, 0, len(rows))
	for i := range rows {
		people = append(people, mapPlannerPersonRecord(&rows[i]))
	}

	return people, nil
}

func (s *PlannerPersonService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeletePlannerPerson(ctx, id)
	if err != nil {
		return fmt.Errorf("delete planner person: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapPlannerPersonRecord(row *sqlc.ListPlannerPeopleByUserIDRow) PlannerPerson {
	return PlannerPerson{
		ID:                   row.ID,
		UserID:               row.UserID,
		Name:                 row.Name,
		Birthday:             row.Birthday,
		RetirementAge:        row.RetirementAge,
		AnnualSalary:         row.AnnualSalary,
		BonusMode:            row.BonusMode,
		AnnualBonus:          row.AnnualBonus,
		IncomeGrowthRate:     row.IncomeGrowthRate,
		PayType:              row.PayType,
		PayDay:               row.PayDay,
		PayCadence:           row.PayCadence,
		HourlyRate:           row.HourlyRate,
		ExpectedHoursPerWeek: row.ExpectedHoursPerWeek,
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}
}

func mapPlannerPersonUpsertRecord(row *sqlc.UpsertPlannerPersonRow) PlannerPerson {
	return PlannerPerson{
		ID:                   row.ID,
		UserID:               row.UserID,
		Name:                 row.Name,
		Birthday:             row.Birthday,
		RetirementAge:        row.RetirementAge,
		AnnualSalary:         row.AnnualSalary,
		BonusMode:            row.BonusMode,
		AnnualBonus:          row.AnnualBonus,
		IncomeGrowthRate:     row.IncomeGrowthRate,
		PayType:              row.PayType,
		PayDay:               row.PayDay,
		PayCadence:           row.PayCadence,
		HourlyRate:           row.HourlyRate,
		ExpectedHoursPerWeek: row.ExpectedHoursPerWeek,
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}
}
