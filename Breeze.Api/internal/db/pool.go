package db

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(ctx context.Context, dbURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		slog.Error("Unable to create connection pool", "error", err)
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		slog.Error("Unable to connect to database", "error", err)
		return nil, err
	}
	return pool, nil
}
