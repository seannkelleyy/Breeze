package service

import (
	"context"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

// PaycheckDeduction is a per-person paycheck withholding that has no account
// behind it — health insurance, FSA, dental, etc. Savings-type deductions
// (401(k), HSA) are accounts and live in the accounts system instead.
type PaycheckDeduction struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	PersonID  uuid.UUID
	Name      string
	Amount    decimal.Decimal
	Pretax    bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type UpsertPaycheckDeductionInput struct {
	ID       uuid.UUID
	UserID   uuid.UUID
	PersonID uuid.UUID
	Name     string
	Amount   decimal.Decimal
	Pretax   bool
}

type paycheckDeductionQuerier interface {
	UpsertPaycheckDeduction(ctx context.Context, arg sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error)
	ListPaycheckDeductionsByPersonID(ctx context.Context, arg sqlc.ListPaycheckDeductionsByPersonIDParams) ([]sqlc.PaycheckDeduction, error)
	SoftDeletePaycheckDeduction(ctx context.Context, id uuid.UUID) (int64, error)
}

type PaycheckDeductionService struct {
	queries paycheckDeductionQuerier
}

func NewPaycheckDeductionService(queries paycheckDeductionQuerier) *PaycheckDeductionService {
	return &PaycheckDeductionService{queries: queries}
}

func (s *PaycheckDeductionService) Upsert(ctx context.Context, input *UpsertPaycheckDeductionInput) (*PaycheckDeduction, error) {
	row, err := s.queries.UpsertPaycheckDeduction(ctx, sqlc.UpsertPaycheckDeductionParams{
		ID:       input.ID,
		UserID:   input.UserID,
		PersonID: input.PersonID,
		Name:     input.Name,
		Amount:   input.Amount,
		Pretax:   input.Pretax,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert paycheck deduction: %w", err)
	}

	deduction := mapPaycheckDeductionRecord(row)
	return &deduction, nil
}

func (s *PaycheckDeductionService) ListByPersonID(ctx context.Context, userID, personID uuid.UUID) ([]PaycheckDeduction, error) {
	rows, err := s.queries.ListPaycheckDeductionsByPersonID(ctx, sqlc.ListPaycheckDeductionsByPersonIDParams{
		UserID:   userID,
		PersonID: personID,
	})
	if err != nil {
		return nil, fmt.Errorf("list paycheck deductions by person id: %w", err)
	}

	deductions := make([]PaycheckDeduction, 0, len(rows))
	for i := range rows {
		deductions = append(deductions, mapPaycheckDeductionRecord(rows[i]))
	}

	return deductions, nil
}

func (s *PaycheckDeductionService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeletePaycheckDeduction(ctx, id)
	if err != nil {
		return fmt.Errorf("delete paycheck deduction: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapPaycheckDeductionRecord(row sqlc.PaycheckDeduction) PaycheckDeduction {
	return PaycheckDeduction{
		ID:        row.ID,
		UserID:    row.UserID,
		PersonID:  row.PersonID,
		Name:      row.Name,
		Amount:    row.Amount,
		Pretax:    row.Pretax,
		CreatedAt: timestamptzToTime(row.CreatedAt),
		UpdatedAt: timestamptzToTime(row.UpdatedAt),
	}
}
