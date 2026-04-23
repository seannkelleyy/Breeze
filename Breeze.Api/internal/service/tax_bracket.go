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
)

type TaxBracket struct {
	ID            uuid.UUID
	Year          int32
	FilingStatus  sqlc.FilingStatus
	MinimumAmount decimal.Decimal
	MaximumAmount *decimal.Decimal
	Rate          decimal.Decimal
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type CreateTaxBracketInput struct {
	Year          int32
	FilingStatus  sqlc.FilingStatus
	MinimumAmount decimal.Decimal
	MaximumAmount *decimal.Decimal
	Rate          decimal.Decimal
}

type UpdateTaxBracketInput struct {
	ID            uuid.UUID
	Year          int32
	FilingStatus  sqlc.FilingStatus
	MinimumAmount decimal.Decimal
	MaximumAmount *decimal.Decimal
	Rate          decimal.Decimal
}

type taxBracketQuerier interface {
	CreateTaxBracket(ctx context.Context, arg sqlc.CreateTaxBracketParams) (sqlc.TaxBracket, error)
	GetTaxBracketByID(ctx context.Context, id uuid.UUID) (sqlc.TaxBracket, error)
	ListTaxBracketsByYearAndFilingStatus(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error)
	UpdateTaxBracket(ctx context.Context, arg sqlc.UpdateTaxBracketParams) (sqlc.TaxBracket, error)
	SoftDeleteTaxBracket(ctx context.Context, id uuid.UUID) (int64, error)
}

type TaxBracketService struct {
	queries taxBracketQuerier
}

func NewTaxBracketService(queries taxBracketQuerier) *TaxBracketService {
	return &TaxBracketService{queries: queries}
}

func (s *TaxBracketService) Create(ctx context.Context, input CreateTaxBracketInput) (*TaxBracket, error) {
	maximumAmount, err := decimalToPGNumeric(input.MaximumAmount)
	if err != nil {
		return nil, fmt.Errorf("encode maximum amount: %w", err)
	}

	row, err := s.queries.CreateTaxBracket(ctx, sqlc.CreateTaxBracketParams{
		Year:          input.Year,
		FilingStatus:  input.FilingStatus,
		MinimumAmount: input.MinimumAmount,
		MaximumAmount: maximumAmount,
		Rate:          input.Rate,
	})
	if err != nil {
		return nil, fmt.Errorf("create tax bracket: %w", err)
	}

	bracket, err := mapTaxBracketRecord(row)
	if err != nil {
		return nil, fmt.Errorf("map created tax bracket: %w", err)
	}

	return bracket, nil
}

func (s *TaxBracketService) GetByID(ctx context.Context, id uuid.UUID) (*TaxBracket, error) {
	row, err := s.queries.GetTaxBracketByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get tax bracket by id: %w", err)
	}

	bracket, err := mapTaxBracketRecord(row)
	if err != nil {
		return nil, fmt.Errorf("map tax bracket: %w", err)
	}

	return bracket, nil
}

func (s *TaxBracketService) ListByYearAndFilingStatus(ctx context.Context, year int32, filingStatus sqlc.FilingStatus) ([]TaxBracket, error) {
	rows, err := s.queries.ListTaxBracketsByYearAndFilingStatus(ctx, sqlc.ListTaxBracketsByYearAndFilingStatusParams{
		Year:         year,
		FilingStatus: filingStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("list tax brackets: %w", err)
	}

	brackets := make([]TaxBracket, 0, len(rows))
	for _, row := range rows {
		bracket, mapErr := mapTaxBracketRecord(row)
		if mapErr != nil {
			return nil, fmt.Errorf("map tax bracket: %w", mapErr)
		}
		brackets = append(brackets, *bracket)
	}

	return brackets, nil
}

func (s *TaxBracketService) Update(ctx context.Context, input UpdateTaxBracketInput) (*TaxBracket, error) {
	maximumAmount, err := decimalToPGNumeric(input.MaximumAmount)
	if err != nil {
		return nil, fmt.Errorf("encode maximum amount: %w", err)
	}

	row, err := s.queries.UpdateTaxBracket(ctx, sqlc.UpdateTaxBracketParams{
		ID:            input.ID,
		Year:          input.Year,
		FilingStatus:  input.FilingStatus,
		MinimumAmount: input.MinimumAmount,
		MaximumAmount: maximumAmount,
		Rate:          input.Rate,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update tax bracket: %w", err)
	}

	bracket, err := mapTaxBracketRecord(row)
	if err != nil {
		return nil, fmt.Errorf("map updated tax bracket: %w", err)
	}

	return bracket, nil
}

func (s *TaxBracketService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteTaxBracket(ctx, id)
	if err != nil {
		return fmt.Errorf("delete tax bracket: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapTaxBracketRecord(row sqlc.TaxBracket) (*TaxBracket, error) {
	maximumAmount, err := decimalFromPGNumeric(row.MaximumAmount)
	if err != nil {
		return nil, err
	}

	return &TaxBracket{
		ID:            row.ID,
		Year:          row.Year,
		FilingStatus:  row.FilingStatus,
		MinimumAmount: row.MinimumAmount,
		MaximumAmount: maximumAmount,
		Rate:          row.Rate,
		CreatedAt:     timestamptzToTime(row.CreatedAt),
		UpdatedAt:     timestamptzToTime(row.UpdatedAt),
	}, nil
}
