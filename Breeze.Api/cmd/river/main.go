package main

import (
	"context"
	"os"

	"breeze.api/internal/config"
	"breeze.api/internal/db"
	"breeze.api/internal/jobs"
	"github.com/joho/godotenv"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		os.Exit(1)
	}
	defer pool.Close()

	workers := river.NewWorkers()
	river.AddWorker(workers, &jobs.PlaidSyncWorker{})
	// register more workers here as you add them

	riverClient, err := river.NewClient(riverpgxv5.New(pool), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 10},
		},
		Workers: workers,
	})
	if err != nil {
		os.Exit(1)
	}

	riverClient.Start(ctx)
}
