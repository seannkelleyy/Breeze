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
	"github.com/jackc/pgx/v5/pgxpool"
)

// NetWorthSnapshot is one point-in-time reading of the user's net worth.
// Totals stand alone — or, when items are provided, are derived from them so
// the breakdown and the headline number can never disagree.
type NetWorthSnapshot struct {
	ID               uuid.UUID
	UserID           uuid.UUID
	SnapshotDate     time.Time
	TotalAssets      decimal.Decimal
	TotalLiabilities decimal.Decimal
	NetWorth         decimal.Decimal
	Items            []NetWorthSnapshotItem
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type NetWorthSnapshotItem struct {
	ID         uuid.UUID
	SnapshotID uuid.UUID
	AccountID  *uuid.UUID
	Label      string
	Amount     decimal.Decimal
	Kind       string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type NetWorthSnapshotItemInput struct {
	AccountID *uuid.UUID
	Label     string
	Amount    decimal.Decimal
	Kind      string
}

type CreateNetWorthSnapshotInput struct {
	UserID           uuid.UUID
	SnapshotDate     time.Time
	TotalAssets      decimal.Decimal
	TotalLiabilities decimal.Decimal
	NetWorth         decimal.Decimal
	Items            []NetWorthSnapshotItemInput
}

type UpdateNetWorthSnapshotInput struct {
	ID               uuid.UUID
	TotalAssets      *decimal.Decimal
	TotalLiabilities *decimal.Decimal
	NetWorth         *decimal.Decimal
	Items            []NetWorthSnapshotItemInput
}

type netWorthSnapshotQuerier interface {
	CreateNetWorthSnapshot(ctx context.Context, arg sqlc.CreateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error)
	GetNetWorthSnapshot(ctx context.Context, id uuid.UUID) (sqlc.NetWorthSnapshot, error)
	GetNetWorthSnapshotByDate(ctx context.Context, arg sqlc.GetNetWorthSnapshotByDateParams) (sqlc.NetWorthSnapshot, error)
	ListNetWorthSnapshots(ctx context.Context, userID uuid.UUID) ([]sqlc.NetWorthSnapshot, error)
	UpdateNetWorthSnapshot(ctx context.Context, arg sqlc.UpdateNetWorthSnapshotParams) (sqlc.NetWorthSnapshot, error)
	DeleteNetWorthSnapshot(ctx context.Context, id uuid.UUID) error
	CreateNetWorthSnapshotItem(ctx context.Context, arg sqlc.CreateNetWorthSnapshotItemParams) (sqlc.NetWorthSnapshotItem, error)
	ListNetWorthSnapshotItemsBySnapshotID(ctx context.Context, snapshotID uuid.UUID) ([]sqlc.NetWorthSnapshotItem, error)
	SoftDeleteNetWorthSnapshotItems(ctx context.Context, snapshotID uuid.UUID) (int64, error)
}

type netWorthSnapshotTxQuerier interface {
	netWorthSnapshotQuerier
	WithTx(tx pgx.Tx) *sqlc.Queries
}

type NetWorthSnapshotService struct {
	queries netWorthSnapshotQuerier
	pool    *pgxpool.Pool
}

func NewNetWorthSnapshotService(queries netWorthSnapshotQuerier, pool *pgxpool.Pool) *NetWorthSnapshotService {
	return &NetWorthSnapshotService{queries: queries, pool: pool}
}

// deriveTotals computes the snapshot totals from its items.
func deriveTotals(items []NetWorthSnapshotItemInput) (assets, liabilities, netWorth decimal.Decimal, err error) {
	assets = decimal.Zero
	liabilities = decimal.Zero
	for _, item := range items {
		if item.Kind != "ASSET" && item.Kind != "LIABILITY" {
			return assets, liabilities, netWorth, fmt.Errorf("invalid snapshot item kind %q", item.Kind)
		}
		if item.Amount.IsNeg() {
			return assets, liabilities, netWorth, fmt.Errorf("snapshot item amounts must be non-negative")
		}
		if item.Kind == "ASSET" {
			assets, err = assets.Add(item.Amount)
			if err != nil {
				return assets, liabilities, netWorth, fmt.Errorf("sum assets: %w", err)
			}
		} else {
			liabilities, err = liabilities.Add(item.Amount)
			if err != nil {
				return assets, liabilities, netWorth, fmt.Errorf("sum liabilities: %w", err)
			}
		}
	}
	netWorth, err = assets.Sub(liabilities)
	if err != nil {
		return assets, liabilities, netWorth, fmt.Errorf("compute net worth: %w", err)
	}
	return assets, liabilities, netWorth, nil
}

func (s *NetWorthSnapshotService) runInTx(ctx context.Context, fn func(q netWorthSnapshotQuerier) error) error {
	if s.pool == nil {
		return fn(s.queries)
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	qtx, ok := s.queries.(netWorthSnapshotTxQuerier)
	if !ok {
		return fmt.Errorf("net worth queries do not support transactions")
	}
	if err := fn(qtx.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func insertSnapshotItems(ctx context.Context, q netWorthSnapshotQuerier, snapshotID uuid.UUID, items []NetWorthSnapshotItemInput) error {
	for _, item := range items {
		if _, err := q.CreateNetWorthSnapshotItem(ctx, sqlc.CreateNetWorthSnapshotItemParams{
			SnapshotID: snapshotID,
			AccountID:  uuidToPGUUID(item.AccountID),
			Label:      item.Label,
			Amount:     item.Amount,
			Kind:       item.Kind,
		}); err != nil {
			return fmt.Errorf("create snapshot item: %w", err)
		}
	}
	return nil
}

func (s *NetWorthSnapshotService) Create(ctx context.Context, input *CreateNetWorthSnapshotInput) (*NetWorthSnapshot, error) {
	totalAssets, totalLiabilities, netWorth := input.TotalAssets, input.TotalLiabilities, input.NetWorth
	if len(input.Items) > 0 {
		var err error
		if totalAssets, totalLiabilities, netWorth, err = deriveTotals(input.Items); err != nil {
			return nil, err
		}
	}

	var created *NetWorthSnapshot
	err := s.runInTx(ctx, func(q netWorthSnapshotQuerier) error {
		row, err := q.CreateNetWorthSnapshot(ctx, sqlc.CreateNetWorthSnapshotParams{
			UserID:           input.UserID,
			SnapshotDate:     pgtype.Date{Time: input.SnapshotDate, Valid: true},
			TotalAssets:      totalAssets,
			TotalLiabilities: totalLiabilities,
			NetWorth:         netWorth,
		})
		if err != nil {
			return fmt.Errorf("create net worth snapshot: %w", err)
		}

		if insertErr := insertSnapshotItems(ctx, q, row.ID, input.Items); insertErr != nil {
			return insertErr
		}

		created, err = mapNetWorthSnapshotRecord(&row)
		return err
	})
	if err != nil {
		return nil, err
	}

	if err := s.loadItems(ctx, created); err != nil {
		return nil, err
	}
	return created, nil
}

func (s *NetWorthSnapshotService) Get(ctx context.Context, id uuid.UUID) (*NetWorthSnapshot, error) {
	row, err := s.queries.GetNetWorthSnapshot(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get net worth snapshot: %w", err)
	}

	snapshot, err := mapNetWorthSnapshotRecord(&row)
	if err != nil {
		return nil, err
	}
	if err := s.loadItems(ctx, snapshot); err != nil {
		return nil, err
	}
	return snapshot, nil
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

	snapshot, err := mapNetWorthSnapshotRecord(&row)
	if err != nil {
		return nil, err
	}
	if err := s.loadItems(ctx, snapshot); err != nil {
		return nil, err
	}
	return snapshot, nil
}

func (s *NetWorthSnapshotService) List(ctx context.Context, userID uuid.UUID) ([]NetWorthSnapshot, error) {
	rows, err := s.queries.ListNetWorthSnapshots(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list net worth snapshots: %w", err)
	}

	snapshots := make([]NetWorthSnapshot, 0, len(rows))
	for i := range rows {
		snapshot, err := mapNetWorthSnapshotRecord(&rows[i])
		if err != nil {
			return nil, fmt.Errorf("map net worth snapshot: %w", err)
		}
		if err := s.loadItems(ctx, snapshot); err != nil {
			return nil, err
		}
		snapshots = append(snapshots, *snapshot)
	}

	return snapshots, nil
}

func (s *NetWorthSnapshotService) Update(ctx context.Context, input *UpdateNetWorthSnapshotInput) (*NetWorthSnapshot, error) {
	// An item set replaces the stored breakdown and drives the totals.
	if len(input.Items) > 0 {
		assets, liabilities, netWorth, err := deriveTotals(input.Items)
		if err != nil {
			return nil, err
		}
		input.TotalAssets, input.TotalLiabilities, input.NetWorth = &assets, &liabilities, &netWorth
	}

	err := s.runInTx(ctx, func(q netWorthSnapshotQuerier) error {
		var totalAssets, totalLiabilities, netWorth pgtype.Numeric
		if input.TotalAssets != nil {
			v, encErr := decimalToPGNumeric(input.TotalAssets)
			if encErr != nil {
				return fmt.Errorf("encode total assets: %w", encErr)
			}
			totalAssets = v
		}
		if input.TotalLiabilities != nil {
			v, encErr := decimalToPGNumeric(input.TotalLiabilities)
			if encErr != nil {
				return fmt.Errorf("encode total liabilities: %w", encErr)
			}
			totalLiabilities = v
		}
		if input.NetWorth != nil {
			v, encErr := decimalToPGNumeric(input.NetWorth)
			if encErr != nil {
				return fmt.Errorf("encode net worth: %w", encErr)
			}
			netWorth = v
		}

		_, err := q.UpdateNetWorthSnapshot(ctx, sqlc.UpdateNetWorthSnapshotParams{
			ID:               input.ID,
			TotalAssets:      totalAssets,
			TotalLiabilities: totalLiabilities,
			NetWorth:         netWorth,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrNotFound
			}
			return fmt.Errorf("update net worth snapshot: %w", err)
		}

		if input.Items != nil {
			if _, err := q.SoftDeleteNetWorthSnapshotItems(ctx, input.ID); err != nil {
				return fmt.Errorf("clear snapshot items: %w", err)
			}
			if err := insertSnapshotItems(ctx, q, input.ID, input.Items); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return s.Get(ctx, input.ID)
}

func (s *NetWorthSnapshotService) Delete(ctx context.Context, id uuid.UUID) error {
	err := s.queries.DeleteNetWorthSnapshot(ctx, id)
	if err != nil {
		return fmt.Errorf("delete net worth snapshot: %w", err)
	}

	return nil
}

func (s *NetWorthSnapshotService) loadItems(ctx context.Context, snapshot *NetWorthSnapshot) error {
	rows, err := s.queries.ListNetWorthSnapshotItemsBySnapshotID(ctx, snapshot.ID)
	if err != nil {
		return fmt.Errorf("list snapshot items: %w", err)
	}
	snapshot.Items = make([]NetWorthSnapshotItem, 0, len(rows))
	for i := range rows {
		snapshot.Items = append(snapshot.Items, mapNetWorthSnapshotItemRecord(&rows[i]))
	}
	return nil
}

func mapNetWorthSnapshotRecord(record *sqlc.NetWorthSnapshot) (*NetWorthSnapshot, error) {
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

func mapNetWorthSnapshotItemRecord(row *sqlc.NetWorthSnapshotItem) NetWorthSnapshotItem {
	return NetWorthSnapshotItem{
		ID:         row.ID,
		SnapshotID: row.SnapshotID,
		AccountID:  uuidFromPGUUID(row.AccountID),
		Label:      row.Label,
		Amount:     row.Amount,
		Kind:       row.Kind,
		CreatedAt:  timestamptzToTime(row.CreatedAt),
		UpdatedAt:  timestamptzToTime(row.UpdatedAt),
	}
}
