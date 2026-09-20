package jobs

import (
	"context"
	"fmt"
	"log/slog"

	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/riverqueue/river"
)

// PlaidSyncArgs syncs every connection belonging to one user.
type PlaidSyncArgs struct {
	UserID string `json:"user_id"`
}

func (PlaidSyncArgs) Kind() string { return "plaid_sync" }

// PlaidSyncAllArgs syncs every active connection in the system. Enqueued
// periodically by the river worker so balances and transactions stay fresh
// without waiting for a page load.
type PlaidSyncAllArgs struct{}

func (PlaidSyncAllArgs) Kind() string { return "plaid_sync_all" }

type PlaidSyncWorker struct {
	river.WorkerDefaults[PlaidSyncArgs]
	plaidService *service.PlaidService
}

func NewPlaidSyncWorker(plaidService *service.PlaidService) *PlaidSyncWorker {
	return &PlaidSyncWorker{plaidService: plaidService}
}

func (w *PlaidSyncWorker) Work(ctx context.Context, job *river.Job[PlaidSyncArgs]) error {
	userID, err := uuid.Parse(job.Args.UserID)
	if err != nil {
		return fmt.Errorf("invalid user id: %w", err)
	}

	connections, err := w.plaidService.ListByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("list plaid connections: %w", err)
	}
	for _, conn := range connections {
		if err := w.plaidService.SyncConnection(ctx, conn.ID); err != nil {
			slog.Warn("plaid sync failed for connection", "connection", conn.ID, "error", err)
		}
	}
	return nil
}

type PlaidSyncAllWorker struct {
	river.WorkerDefaults[PlaidSyncAllArgs]
	plaidService *service.PlaidService
}

func NewPlaidSyncAllWorker(plaidService *service.PlaidService) *PlaidSyncAllWorker {
	return &PlaidSyncAllWorker{plaidService: plaidService}
}

func (w *PlaidSyncAllWorker) Work(ctx context.Context, job *river.Job[PlaidSyncAllArgs]) error {
	connections, err := w.plaidService.ListAllConnections(ctx)
	if err != nil {
		return fmt.Errorf("list plaid connections: %w", err)
	}
	slog.Info("plaid sync-all starting", "connections", len(connections))
	for _, conn := range connections {
		if err := w.plaidService.SyncConnection(ctx, conn.ID); err != nil {
			slog.Warn("plaid sync failed for connection", "connection", conn.ID, "error", err)
		}
	}
	return nil
}
