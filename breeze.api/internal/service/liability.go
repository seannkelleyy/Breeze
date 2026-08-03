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

type Liability struct {
	ID                   uuid.UUID
	UserID               uuid.UUID
	Name                 string
	LiabilityType        sqlc.LiabilityType
	CurrentBalance       decimal.Decimal
	OriginalLoanAmount   *decimal.Decimal
	InterestRate         decimal.Decimal
	MinimumPayment       decimal.Decimal
	TargetExtraPayment   decimal.Decimal
	PayoffPriority       int32
	ContributionMode     string
	ContributionValue    decimal.Decimal
	PersonIDs            []uuid.UUID
	PlaidAccountID       *uuid.UUID
	LastBalanceUpdatedAt time.Time
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type CreateLiabilityInput struct {
	UserID             uuid.UUID
	Name               string
	LiabilityType      sqlc.LiabilityType
	CurrentBalance     decimal.Decimal
	OriginalLoanAmount *decimal.Decimal
	InterestRate       decimal.Decimal
	MinimumPayment     decimal.Decimal
	TargetExtraPayment decimal.Decimal
	PayoffPriority     int32
	ContributionMode   string
	ContributionValue  decimal.Decimal
	PersonIDs          []uuid.UUID
}

type UpdateLiabilityInput struct {
	ID                 uuid.UUID
	Name               string
	LiabilityType      sqlc.LiabilityType
	CurrentBalance     decimal.Decimal
	OriginalLoanAmount *decimal.Decimal
	InterestRate       decimal.Decimal
	MinimumPayment     decimal.Decimal
	TargetExtraPayment decimal.Decimal
	PayoffPriority     int32
	ContributionMode   string
	ContributionValue  decimal.Decimal
	PersonIDs          []uuid.UUID
}

type liabilityQuerier interface {
	CreateLiability(ctx context.Context, arg sqlc.CreateLiabilityParams) (sqlc.CreateLiabilityRow, error)
	GetLiabilityByID(ctx context.Context, id uuid.UUID) (sqlc.GetLiabilityByIDRow, error)
	ListLiabilitiesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListLiabilitiesByUserIDRow, error)
	UpdateLiability(ctx context.Context, arg sqlc.UpdateLiabilityParams) (sqlc.UpdateLiabilityRow, error)
	SoftDeleteLiability(ctx context.Context, id uuid.UUID) (int64, error)
}

type LiabilityService struct {
	queries liabilityQuerier
}

func NewLiabilityService(queries liabilityQuerier) *LiabilityService {
	return &LiabilityService{queries: queries}
}

func (s *LiabilityService) Create(ctx context.Context, input CreateLiabilityInput) (*Liability, error) {
	row, err := s.queries.CreateLiability(ctx, sqlc.CreateLiabilityParams{
		UserID:             input.UserID,
		Name:               input.Name,
		LiabilityType:      input.LiabilityType,
		CurrentBalance:     input.CurrentBalance,
		OriginalLoanAmount: pgtypeNumericFromDecimal(input.OriginalLoanAmount),
		InterestRate:       input.InterestRate,
		MinimumPayment:     input.MinimumPayment,
		TargetExtraPayment: input.TargetExtraPayment,
		PayoffPriority:     input.PayoffPriority,
		ContributionMode:   input.ContributionMode,
		ContributionValue:  input.ContributionValue,
		PersonIds:          input.PersonIDs,
	})
	if err != nil {
		return nil, fmt.Errorf("create liability: %w", err)
	}

	liability := mapCreateLiabilityRow(row)
	return &liability, nil
}

func (s *LiabilityService) GetByID(ctx context.Context, id uuid.UUID) (*Liability, error) {
	row, err := s.queries.GetLiabilityByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get liability by id: %w", err)
	}

	liability := mapGetLiabilityByIDRow(row)
	return &liability, nil
}

func (s *LiabilityService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]Liability, error) {
	rows, err := s.queries.ListLiabilitiesByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list liabilities by user id: %w", err)
	}

	liabilities := make([]Liability, 0, len(rows))
	for _, row := range rows {
		liabilities = append(liabilities, mapListLiabilitiesByUserIDRow(row))
	}

	return liabilities, nil
}

func (s *LiabilityService) Update(ctx context.Context, input UpdateLiabilityInput) (*Liability, error) {
	row, err := s.queries.UpdateLiability(ctx, sqlc.UpdateLiabilityParams{
		ID:                 input.ID,
		Name:               input.Name,
		LiabilityType:      input.LiabilityType,
		CurrentBalance:     input.CurrentBalance,
		OriginalLoanAmount: pgtypeNumericFromDecimal(input.OriginalLoanAmount),
		InterestRate:       input.InterestRate,
		MinimumPayment:     input.MinimumPayment,
		TargetExtraPayment: input.TargetExtraPayment,
		PayoffPriority:     input.PayoffPriority,
		ContributionMode:   input.ContributionMode,
		ContributionValue:  input.ContributionValue,
		PersonIds:          input.PersonIDs,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update liability: %w", err)
	}

	liability := mapUpdateLiabilityRow(row)
	return &liability, nil
}

func (s *LiabilityService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteLiability(ctx, id)
	if err != nil {
		return fmt.Errorf("delete liability: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapCreateLiabilityRow(row sqlc.CreateLiabilityRow) Liability {
	return Liability{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		LiabilityType:      row.LiabilityType,
		CurrentBalance:     row.CurrentBalance,
		OriginalLoanAmount: pgtypeNumericToDecimal(row.OriginalLoanAmount),
		InterestRate:       row.InterestRate,
		MinimumPayment:     row.MinimumPayment,
		TargetExtraPayment: row.TargetExtraPayment,
		PayoffPriority:     row.PayoffPriority,

		ContributionMode:     row.ContributionMode,
		ContributionValue:    row.ContributionValue,
		PersonIDs:            row.PersonIds,
		PlaidAccountID:       pgtypeUUIDToPtr(row.PlaidAccountID),
		LastBalanceUpdatedAt: timestamptzToTime(row.LastBalanceUpdatedAt),
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}
}

func mapGetLiabilityByIDRow(row sqlc.GetLiabilityByIDRow) Liability {
	return Liability{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		LiabilityType:      row.LiabilityType,
		CurrentBalance:     row.CurrentBalance,
		OriginalLoanAmount: pgtypeNumericToDecimal(row.OriginalLoanAmount),
		InterestRate:       row.InterestRate,
		MinimumPayment:     row.MinimumPayment,
		TargetExtraPayment: row.TargetExtraPayment,
		PayoffPriority:     row.PayoffPriority,

		ContributionMode:     row.ContributionMode,
		ContributionValue:    row.ContributionValue,
		PersonIDs:            row.PersonIds,
		PlaidAccountID:       pgtypeUUIDToPtr(row.PlaidAccountID),
		LastBalanceUpdatedAt: timestamptzToTime(row.LastBalanceUpdatedAt),
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}
}

func mapListLiabilitiesByUserIDRow(row sqlc.ListLiabilitiesByUserIDRow) Liability {
	return Liability{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		LiabilityType:      row.LiabilityType,
		CurrentBalance:     row.CurrentBalance,
		OriginalLoanAmount: pgtypeNumericToDecimal(row.OriginalLoanAmount),
		InterestRate:       row.InterestRate,
		MinimumPayment:     row.MinimumPayment,
		TargetExtraPayment: row.TargetExtraPayment,
		PayoffPriority:     row.PayoffPriority,

		ContributionMode:     row.ContributionMode,
		ContributionValue:    row.ContributionValue,
		PersonIDs:            row.PersonIds,
		PlaidAccountID:       pgtypeUUIDToPtr(row.PlaidAccountID),
		LastBalanceUpdatedAt: timestamptzToTime(row.LastBalanceUpdatedAt),
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}
}

func mapUpdateLiabilityRow(row sqlc.UpdateLiabilityRow) Liability {
	return Liability{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		LiabilityType:      row.LiabilityType,
		CurrentBalance:     row.CurrentBalance,
		OriginalLoanAmount: pgtypeNumericToDecimal(row.OriginalLoanAmount),
		InterestRate:       row.InterestRate,
		MinimumPayment:     row.MinimumPayment,
		TargetExtraPayment: row.TargetExtraPayment,
		PayoffPriority:     row.PayoffPriority,

		ContributionMode:     row.ContributionMode,
		ContributionValue:    row.ContributionValue,
		PersonIDs:            row.PersonIds,
		PlaidAccountID:       pgtypeUUIDToPtr(row.PlaidAccountID),
		LastBalanceUpdatedAt: timestamptzToTime(row.LastBalanceUpdatedAt),
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}
}
