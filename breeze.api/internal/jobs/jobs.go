package jobs

import (
	"context"

	"github.com/riverqueue/river"
)

// Plaid Sync
type PlaidSyncArgs struct {
	UserID    string `json:"user_id"`
	AccountID string `json:"account_id"`
}

func (PlaidSyncArgs) Kind() string { return "plaid_sync" }

type PlaidSyncWorker struct {
	river.WorkerDefaults[PlaidSyncArgs]
}

func (w *PlaidSyncWorker) Work(ctx context.Context, job *river.Job[PlaidSyncArgs]) error {
	// fetch from Plaid, save transactions to DB
	return nil
}
