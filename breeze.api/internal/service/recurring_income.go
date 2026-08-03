package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type RecurringIncome struct {
	ID                 uuid.UUID
	UserID             uuid.UUID
	Name               string
	Amount             decimal.Decimal
	RecurrenceInterval sqlc.RecurrenceInterval
	PaydayDayOfMonth   *int32
	StartDate          time.Time
	EndDate            *time.Time
	PersonID           *uuid.UUID
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type CreateRecurringIncomeInput struct {
	UserID             uuid.UUID
	Name               string
	Amount             decimal.Decimal
	RecurrenceInterval sqlc.RecurrenceInterval
	PaydayDayOfMonth   *int32
	StartDate          time.Time
	EndDate            *time.Time
	PersonID           *uuid.UUID
}

type UpdateRecurringIncomeInput struct {
	ID                 uuid.UUID
	Name               string
	Amount             decimal.Decimal
	RecurrenceInterval sqlc.RecurrenceInterval
	PaydayDayOfMonth   *int32
	StartDate          time.Time
	EndDate            *time.Time
	PersonID           *uuid.UUID
}

type recurringIncomeQuerier interface {
	CreateRecurringIncome(ctx context.Context, arg sqlc.CreateRecurringIncomeParams) (sqlc.CreateRecurringIncomeRow, error)
	GetRecurringIncomeByID(ctx context.Context, id uuid.UUID) (sqlc.GetRecurringIncomeByIDRow, error)
	ListRecurringIncomeByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListRecurringIncomeByUserIDRow, error)
	UpdateRecurringIncome(ctx context.Context, arg sqlc.UpdateRecurringIncomeParams) (sqlc.UpdateRecurringIncomeRow, error)
	SoftDeleteRecurringIncome(ctx context.Context, id uuid.UUID) (int64, error)
}

type RecurringIncomeService struct {
	queries recurringIncomeQuerier
}

func NewRecurringIncomeService(queries recurringIncomeQuerier) *RecurringIncomeService {
	return &RecurringIncomeService{queries: queries}
}

func (s *RecurringIncomeService) Create(ctx context.Context, input CreateRecurringIncomeInput) (*RecurringIncome, error) {
	row, err := s.queries.CreateRecurringIncome(ctx, sqlc.CreateRecurringIncomeParams{
		UserID:             input.UserID,
		Name:               input.Name,
		Amount:             input.Amount,
		RecurrenceInterval: input.RecurrenceInterval,
		PaydayDayOfMonth:   input.PaydayDayOfMonth,
		StartDate:          pgtype.Date{Time: input.StartDate, Valid: true},
		EndDate:            dateToPGDate(input.EndDate),
		PersonID:           uuidToPG(input.PersonID),
	})
	if err != nil {
		return nil, fmt.Errorf("create recurring income: %w", err)
	}

	income := mapCreateRecurringIncomeRow(row)
	return &income, nil
}

func (s *RecurringIncomeService) GetByID(ctx context.Context, id uuid.UUID) (*RecurringIncome, error) {
	row, err := s.queries.GetRecurringIncomeByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get recurring income by id: %w", err)
	}

	income := mapGetRecurringIncomeByIDRow(row)
	return &income, nil
}

func (s *RecurringIncomeService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]RecurringIncome, error) {
	rows, err := s.queries.ListRecurringIncomeByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list recurring income by user id: %w", err)
	}

	incomes := make([]RecurringIncome, 0, len(rows))
	for _, row := range rows {
		incomes = append(incomes, mapListRecurringIncomeByUserIDRow(row))
	}

	return incomes, nil
}

func (s *RecurringIncomeService) Update(ctx context.Context, input UpdateRecurringIncomeInput) (*RecurringIncome, error) {
	row, err := s.queries.UpdateRecurringIncome(ctx, sqlc.UpdateRecurringIncomeParams{
		ID:                 input.ID,
		Name:               input.Name,
		Amount:             input.Amount,
		RecurrenceInterval: input.RecurrenceInterval,
		PaydayDayOfMonth:   input.PaydayDayOfMonth,
		StartDate:          pgtype.Date{Time: input.StartDate, Valid: true},
		EndDate:            dateToPGDate(input.EndDate),
		PersonID:           uuidToPG(input.PersonID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update recurring income: %w", err)
	}

	income := mapUpdateRecurringIncomeRow(row)
	return &income, nil
}

func (s *RecurringIncomeService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteRecurringIncome(ctx, id)
	if err != nil {
		return fmt.Errorf("delete recurring income: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapCreateRecurringIncomeRow(row sqlc.CreateRecurringIncomeRow) RecurringIncome {
	return RecurringIncome{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		Amount:             row.Amount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate.Time,
		EndDate:            dateFromPGDate(row.EndDate),
		PersonID:           uuidFromPG(row.PersonID),
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}

func mapGetRecurringIncomeByIDRow(row sqlc.GetRecurringIncomeByIDRow) RecurringIncome {
	return RecurringIncome{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		Amount:             row.Amount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate.Time,
		EndDate:            dateFromPGDate(row.EndDate),
		PersonID:           uuidFromPG(row.PersonID),
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}

func mapListRecurringIncomeByUserIDRow(row sqlc.ListRecurringIncomeByUserIDRow) RecurringIncome {
	return RecurringIncome{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		Amount:             row.Amount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate.Time,
		EndDate:            dateFromPGDate(row.EndDate),
		PersonID:           uuidFromPG(row.PersonID),
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}

func mapUpdateRecurringIncomeRow(row sqlc.UpdateRecurringIncomeRow) RecurringIncome {
	return RecurringIncome{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		Amount:             row.Amount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate.Time,
		EndDate:            dateFromPGDate(row.EndDate),
		PersonID:           uuidFromPG(row.PersonID),
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}
