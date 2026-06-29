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

type Income struct {
	ID                   uuid.UUID
	UserID               uuid.UUID
	BudgetID             uuid.UUID
	Name                 string
	Amount               decimal.Decimal
	Date                 time.Time
	SourceType           sqlc.IncomeSourceType
	SourceTemplateID     *uuid.UUID
	SourceOccurrenceDate *time.Time
	GenerationMonth      *time.Time
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type CreateIncomeInput struct {
	UserID               uuid.UUID
	BudgetID             uuid.UUID
	Name                 string
	Amount               decimal.Decimal
	Date                 time.Time
	SourceType           sqlc.IncomeSourceType
	SourceTemplateID     *uuid.UUID
	SourceOccurrenceDate *time.Time
	GenerationMonth      *time.Time
}

type UpdateIncomeInput struct {
	ID                   uuid.UUID
	Name                 string
	Amount               decimal.Decimal
	Date                 time.Time
	SourceType           sqlc.IncomeSourceType
	SourceTemplateID     *uuid.UUID
	SourceOccurrenceDate *time.Time
	GenerationMonth      *time.Time
}

type incomeQuerier interface {
	CreateIncome(ctx context.Context, arg sqlc.CreateIncomeParams) (sqlc.Income, error)
	GetIncomeByID(ctx context.Context, id uuid.UUID) (sqlc.Income, error)
	ListIncomeByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.Income, error)
	UpdateIncome(ctx context.Context, arg sqlc.UpdateIncomeParams) (sqlc.Income, error)
	SoftDeleteIncome(ctx context.Context, id uuid.UUID) (int64, error)
}

type IncomeService struct {
	queries incomeQuerier
}

func NewIncomeService(queries incomeQuerier) *IncomeService {
	return &IncomeService{queries: queries}
}

func (s *IncomeService) Create(ctx context.Context, input CreateIncomeInput) (*Income, error) {
	row, err := s.queries.CreateIncome(ctx, sqlc.CreateIncomeParams{
		UserID:               input.UserID,
		BudgetID:             input.BudgetID,
		Name:                 input.Name,
		Amount:               input.Amount,
		Date:                 pgtype.Date{Time: input.Date, Valid: true},
		SourceType:           input.SourceType,
		SourceTemplateID:     uuidToPGUUID(input.SourceTemplateID),
		SourceOccurrenceDate: dateToPGDate(input.SourceOccurrenceDate),
		GenerationMonth:      dateToPGDate(input.GenerationMonth),
	})
	if err != nil {
		return nil, fmt.Errorf("create income: %w", err)
	}

	income := mapIncomeRecord(row)
	return &income, nil
}

func (s *IncomeService) GetByID(ctx context.Context, id uuid.UUID) (*Income, error) {
	row, err := s.queries.GetIncomeByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get income by id: %w", err)
	}

	income := mapIncomeRecord(row)
	return &income, nil
}

func (s *IncomeService) ListByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]Income, error) {
	rows, err := s.queries.ListIncomeByBudgetID(ctx, budgetID)
	if err != nil {
		return nil, fmt.Errorf("list income by budget id: %w", err)
	}

	incomes := make([]Income, 0, len(rows))
	for _, row := range rows {
		incomes = append(incomes, mapIncomeRecord(row))
	}

	return incomes, nil
}

func (s *IncomeService) Update(ctx context.Context, input UpdateIncomeInput) (*Income, error) {
	row, err := s.queries.UpdateIncome(ctx, sqlc.UpdateIncomeParams{
		ID:                   input.ID,
		Name:                 input.Name,
		Amount:               input.Amount,
		Date:                 pgtype.Date{Time: input.Date, Valid: true},
		SourceType:           input.SourceType,
		SourceTemplateID:     uuidToPGUUID(input.SourceTemplateID),
		SourceOccurrenceDate: dateToPGDate(input.SourceOccurrenceDate),
		GenerationMonth:      dateToPGDate(input.GenerationMonth),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update income: %w", err)
	}

	income := mapIncomeRecord(row)
	return &income, nil
}

func (s *IncomeService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteIncome(ctx, id)
	if err != nil {
		return fmt.Errorf("delete income: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapIncomeRecord(row sqlc.Income) Income {
	return Income{
		ID:                   row.ID,
		UserID:               row.UserID,
		BudgetID:             row.BudgetID,
		Name:                 row.Name,
		Amount:               row.Amount,
		Date:                 row.Date.Time,
		SourceType:           row.SourceType,
		SourceTemplateID:     uuidFromPGUUID(row.SourceTemplateID),
		SourceOccurrenceDate: dateFromPGDate(row.SourceOccurrenceDate),
		GenerationMonth:      dateFromPGDate(row.GenerationMonth),
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}
}
