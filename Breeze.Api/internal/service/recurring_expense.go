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

type RecurringExpense struct {
	ID                 uuid.UUID
	UserID             uuid.UUID
	Name               string
	Amount             decimal.Decimal
	RecurrenceInterval sqlc.RecurrenceInterval
	PaydayDayOfMonth   *int32
	StartDate          time.Time
	EndDate            *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type CreateRecurringExpenseInput struct {
	UserID             uuid.UUID
	Name               string
	Amount             decimal.Decimal
	RecurrenceInterval sqlc.RecurrenceInterval
	PaydayDayOfMonth   *int32
	StartDate          time.Time
	EndDate            *time.Time
}

type UpdateRecurringExpenseInput struct {
	ID                 uuid.UUID
	Name               string
	Amount             decimal.Decimal
	RecurrenceInterval sqlc.RecurrenceInterval
	PaydayDayOfMonth   *int32
	StartDate          time.Time
	EndDate            *time.Time
}

type recurringExpenseQuerier interface {
	CreateRecurringExpense(ctx context.Context, arg sqlc.CreateRecurringExpenseParams) (sqlc.RecurringExpense, error)
	GetRecurringExpenseByID(ctx context.Context, id uuid.UUID) (sqlc.RecurringExpense, error)
	ListRecurringExpensesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.RecurringExpense, error)
	UpdateRecurringExpense(ctx context.Context, arg sqlc.UpdateRecurringExpenseParams) (sqlc.RecurringExpense, error)
	SoftDeleteRecurringExpense(ctx context.Context, id uuid.UUID) (int64, error)
}

type RecurringExpenseService struct {
	queries recurringExpenseQuerier
}

func NewRecurringExpenseService(queries recurringExpenseQuerier) *RecurringExpenseService {
	return &RecurringExpenseService{queries: queries}
}

func (s *RecurringExpenseService) Create(ctx context.Context, input CreateRecurringExpenseInput) (*RecurringExpense, error) {
	row, err := s.queries.CreateRecurringExpense(ctx, sqlc.CreateRecurringExpenseParams{
		UserID:             input.UserID,
		Name:               input.Name,
		Amount:             input.Amount,
		RecurrenceInterval: input.RecurrenceInterval,
		PaydayDayOfMonth:   input.PaydayDayOfMonth,
		StartDate:          pgtype.Date{Time: input.StartDate, Valid: true},
		EndDate:            dateToPGDate(input.EndDate),
	})
	if err != nil {
		return nil, fmt.Errorf("create recurring expense: %w", err)
	}

	expense := mapRecurringExpenseRecord(row)
	return &expense, nil
}

func (s *RecurringExpenseService) GetByID(ctx context.Context, id uuid.UUID) (*RecurringExpense, error) {
	row, err := s.queries.GetRecurringExpenseByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get recurring expense by id: %w", err)
	}

	expense := mapRecurringExpenseRecord(row)
	return &expense, nil
}

func (s *RecurringExpenseService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]RecurringExpense, error) {
	rows, err := s.queries.ListRecurringExpensesByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list recurring expenses by user id: %w", err)
	}

	expenses := make([]RecurringExpense, 0, len(rows))
	for _, row := range rows {
		expenses = append(expenses, mapRecurringExpenseRecord(row))
	}

	return expenses, nil
}

func (s *RecurringExpenseService) Update(ctx context.Context, input UpdateRecurringExpenseInput) (*RecurringExpense, error) {
	row, err := s.queries.UpdateRecurringExpense(ctx, sqlc.UpdateRecurringExpenseParams{
		ID:                 input.ID,
		Name:               input.Name,
		Amount:             input.Amount,
		RecurrenceInterval: input.RecurrenceInterval,
		PaydayDayOfMonth:   input.PaydayDayOfMonth,
		StartDate:          pgtype.Date{Time: input.StartDate, Valid: true},
		EndDate:            dateToPGDate(input.EndDate),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update recurring expense: %w", err)
	}

	expense := mapRecurringExpenseRecord(row)
	return &expense, nil
}

func (s *RecurringExpenseService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteRecurringExpense(ctx, id)
	if err != nil {
		return fmt.Errorf("delete recurring expense: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapRecurringExpenseRecord(row sqlc.RecurringExpense) RecurringExpense {
	return RecurringExpense{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		Amount:             row.Amount,
		RecurrenceInterval: row.RecurrenceInterval,
		PaydayDayOfMonth:   row.PaydayDayOfMonth,
		StartDate:          row.StartDate.Time,
		EndDate:            dateFromPGDate(row.EndDate),
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}

// RecurringIncome converts a RecurringExpense to a RecurringIncome so it can
// be passed to the shared recurringOccurrences function.
func (e RecurringExpense) RecurringIncome() RecurringIncome {
	return RecurringIncome{
		ID:                 e.ID,
		StartDate:          e.StartDate,
		EndDate:            e.EndDate,
		RecurrenceInterval: e.RecurrenceInterval,
		PaydayDayOfMonth:   e.PaydayDayOfMonth,
	}
}
