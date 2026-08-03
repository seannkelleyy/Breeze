package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

// WithTx wraps a function in a database transaction. If fn returns an error, the transaction is rolled back.
func WithTx(ctx context.Context, pool *pgx.Conn, fn func(tx pgx.Tx) error) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p)
		}
	}()
	if err := fn(tx); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}
	return tx.Commit(ctx)
}
