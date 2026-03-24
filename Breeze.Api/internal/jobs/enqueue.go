package jobs

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
)

func EnqueuePlaidSync(ctx context.Context, client *river.Client[pgx.Tx], userID, accountID string) error {
	_, err := client.Insert(ctx, PlaidSyncArgs{
		UserID:    userID,
		AccountID: accountID,
	}, nil)
	return err
}
