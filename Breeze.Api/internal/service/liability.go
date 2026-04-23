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
	InterestRate         decimal.Decimal
	MinimumPayment       decimal.Decimal
	TargetExtraPayment   decimal.Decimal
	PayoffPriority       int32
	LastBalanceUpdatedAt time.Time
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type CreateLiabilityInput struct {
	UserID             uuid.UUID
	Name               string
	LiabilityType      sqlc.LiabilityType
	CurrentBalance     decimal.Decimal
	InterestRate       decimal.Decimal
	MinimumPayment     decimal.Decimal
	TargetExtraPayment decimal.Decimal
	PayoffPriority     int32
}

type UpdateLiabilityInput struct {
	ID                 uuid.UUID
	Name               string
	LiabilityType      sqlc.LiabilityType
	CurrentBalance     decimal.Decimal
	InterestRate       decimal.Decimal
	MinimumPayment     decimal.Decimal
	TargetExtraPayment decimal.Decimal
	PayoffPriority     int32
}

type liabilityQuerier interface {
	CreateLiability(ctx context.Context, arg sqlc.CreateLiabilityParams) (sqlc.Liability, error)
	GetLiabilityByID(ctx context.Context, id uuid.UUID) (sqlc.Liability, error)
	ListLiabilitiesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Liability, error)
	UpdateLiability(ctx context.Context, arg sqlc.UpdateLiabilityParams) (sqlc.Liability, error)
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
		InterestRate:       input.InterestRate,
		MinimumPayment:     input.MinimumPayment,
		TargetExtraPayment: input.TargetExtraPayment,
		PayoffPriority:     input.PayoffPriority,
	})
	if err != nil {
		return nil, fmt.Errorf("create liability: %w", err)
	}

	liability, err := mapLiabilityRecord(row)
	if err != nil {
		return nil, fmt.Errorf("map created liability: %w", err)
	}

	return liability, nil
}

func (s *LiabilityService) GetByID(ctx context.Context, id uuid.UUID) (*Liability, error) {
	row, err := s.queries.GetLiabilityByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get liability by id: %w", err)
	}

	liability, err := mapLiabilityRecord(row)
	if err != nil {
		return nil, fmt.Errorf("map liability: %w", err)
	}

	return liability, nil
}

func (s *LiabilityService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]Liability, error) {
	rows, err := s.queries.ListLiabilitiesByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list liabilities by user id: %w", err)
	}

	liabilities := make([]Liability, 0, len(rows))
	for _, row := range rows {
		liability, mapErr := mapLiabilityRecord(row)
		if mapErr != nil {
			return nil, fmt.Errorf("map liability: %w", mapErr)
		}
		liabilities = append(liabilities, *liability)
	}

	return liabilities, nil
}

func (s *LiabilityService) Update(ctx context.Context, input UpdateLiabilityInput) (*Liability, error) {
	row, err := s.queries.UpdateLiability(ctx, sqlc.UpdateLiabilityParams{
		ID:                 input.ID,
		Name:               input.Name,
		LiabilityType:      input.LiabilityType,
		CurrentBalance:     input.CurrentBalance,
		InterestRate:       input.InterestRate,
		MinimumPayment:     input.MinimumPayment,
		TargetExtraPayment: input.TargetExtraPayment,
		PayoffPriority:     input.PayoffPriority,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update liability: %w", err)
	}

	liability, err := mapLiabilityRecord(row)
	if err != nil {
		return nil, fmt.Errorf("map updated liability: %w", err)
	}

	return liability, nil
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

func mapLiabilityRecord(row sqlc.Liability) (*Liability, error) {
	return &Liability{
		ID:                   row.ID,
		UserID:               row.UserID,
		Name:                 row.Name,
		LiabilityType:        row.LiabilityType,
		CurrentBalance:       row.CurrentBalance,
		InterestRate:         row.InterestRate,
		MinimumPayment:       row.MinimumPayment,
		TargetExtraPayment:   row.TargetExtraPayment,
		PayoffPriority:       row.PayoffPriority,
		LastBalanceUpdatedAt: timestamptzToTime(row.LastBalanceUpdatedAt),
		CreatedAt:            timestamptzToTime(row.CreatedAt),
		UpdatedAt:            timestamptzToTime(row.UpdatedAt),
	}, nil
}
