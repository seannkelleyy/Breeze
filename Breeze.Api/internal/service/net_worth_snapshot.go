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

type NetWorthSnapshot struct {
	ID               uuid.UUID
	UserID           uuid.UUID
	SnapshotDate     time.Time
	TotalAssets      decimal.Decimal
	TotalLiabilities decimal.Decimal
	NetWorth         decimal.Decimal
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type CreateNetWorthSnapshotInput struct {
	UserID           uuid.UUID
	SnapshotDate     time.Time
	TotalAssets      decimal.Decimal
	TotalLiabilities decimal.Decimal
	NetWorth         decimal.Decimal
}

type UpdateNetWorthSnapshotInput struct {
	ID               uuid.UUID
	TotalAssets      *decimal.Decimal
	TotalLiabilities *decimal.Decimal
	NetWorth         *decimal.Decimal
}

type netWorthSnapshotQuerier interface {
	CreateNetWorthSnapshot(ctx context.Context, arg sqlc.CreateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error)
	GetNetWorthSnapshot(ctx context.Context, id uuid.UUID) (sqlc.NetWorthSnapshot, error)
	GetNetWorthSnapshotByDate(ctx context.Context, arg sqlc.GetNetWorthSnapshotByDateParams) (sqlc.NetWorthSnapshot, error)
	ListNetWorthSnapshots(ctx context.Context, userID uuid.UUID) ([]sqlc.NetWorthSnapshot, error)
	UpdateNetWorthSnapshot(ctx context.Context, arg sqlc.UpdateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error)
	DeleteNetWorthSnapshot(ctx context.Context, id uuid.UUID) error
}

type NetWorthSnapshotService struct {
	queries netWorthSnapshotQuerier
}

func NewNetWorthSnapshotService(queries netWorthSnapshotQuerier) *NetWorthSnapshotService {
	return &NetWorthSnapshotService{queries: queries}
}

func mapNetWorthSnapshotRecord(record sqlc.NetWorthSnapshot) (*NetWorthSnapshot, error) {
	return &NetWorthSnapshot{
		ID:               record.ID,
		UserID:           record.UserID,
		SnapshotDate:     record.SnapshotDate.Time,
		TotalAssets:      record.TotalAssets,
		TotalLiabilities: record.TotalLiabilities,
		NetWorth:         record.NetWorth,
		CreatedAt:        record.CreatedAt.Time,
		UpdatedAt:        record.UpdatedAt.Time,
	}, nil
}

func (s *NetWorthSnapshotService) Create(ctx context.Context, input CreateNetWorthSnapshotInput) (*NetWorthSnapshot, error) {
	row, err := s.queries.CreateNetWorthSnapshot(ctx, sqlc.CreateNetWorthSnapshotParams{
		UserID:           input.UserID,
		SnapshotDate:     pgtype.Date{Time: input.SnapshotDate, Valid: true},
		TotalAssets:      input.TotalAssets,
		TotalLiabilities: input.TotalLiabilities,
		NetWorth:         input.NetWorth,
	})
	if err != nil {
		return nil, fmt.Errorf("create net worth snapshot: %w", err)
	}

	return mapNetWorthSnapshotRecord(row)
}

func (s *NetWorthSnapshotService) Get(ctx context.Context, id uuid.UUID) (*NetWorthSnapshot, error) {
	row, err := s.queries.GetNetWorthSnapshot(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get net worth snapshot: %w", err)
	}

	return mapNetWorthSnapshotRecord(row)
}

func (s *NetWorthSnapshotService) GetByDate(ctx context.Context, userID uuid.UUID, date time.Time) (*NetWorthSnapshot, error) {
	row, err := s.queries.GetNetWorthSnapshotByDate(ctx, sqlc.GetNetWorthSnapshotByDateParams{
		UserID:       userID,
		SnapshotDate: pgtype.Date{Time: date, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get net worth snapshot by date: %w", err)
	}

	return mapNetWorthSnapshotRecord(row)
}

func (s *NetWorthSnapshotService) List(ctx context.Context, userID uuid.UUID) ([]NetWorthSnapshot, error) {
	rows, err := s.queries.ListNetWorthSnapshots(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list net worth snapshots: %w", err)
	}

	var snapshots []NetWorthSnapshot
	for _, row := range rows {
		snapshot, err := mapNetWorthSnapshotRecord(row)
		if err != nil {
			return nil, fmt.Errorf("map net worth snapshot: %w", err)
		}
		snapshots = append(snapshots, *snapshot)
	}

	return snapshots, nil
}

func (s *NetWorthSnapshotService) Update(ctx context.Context, input UpdateNetWorthSnapshotInput) (*NetWorthSnapshot, error) {
	totalAssets, err := decimalToPGNumeric(input.TotalAssets)
	if err != nil {
		return nil, fmt.Errorf("encode total assets: %w", err)
	}
	totalLiabilities, err := decimalToPGNumeric(input.TotalLiabilities)
	if err != nil {
		return nil, fmt.Errorf("encode total liabilities: %w", err)
	}
	netWorth, err := decimalToPGNumeric(input.NetWorth)
	if err != nil {
		return nil, fmt.Errorf("encode net worth: %w", err)
	}

	row, err := s.queries.UpdateNetWorthSnapshot(ctx, sqlc.UpdateNetWorthSnapshotParams{
		ID:               input.ID,
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
		NetWorth:         netWorth,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update net worth snapshot: %w", err)
	}

	return mapNetWorthSnapshotRecord(row)
}

func (s *NetWorthSnapshotService) Delete(ctx context.Context, id uuid.UUID) error {
	err := s.queries.DeleteNetWorthSnapshot(ctx, id)
	if err != nil {
		return fmt.Errorf("delete net worth snapshot: %w", err)
	}

	return nil
}
