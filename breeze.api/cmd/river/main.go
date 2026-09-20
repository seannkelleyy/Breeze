package main

import (
	"context"
	"os"
	"time"

	"breeze.api/internal/config"
	"breeze.api/internal/db"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/jobs"
	"breeze.api/internal/service"
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

	// Plaid client/service (dev-mode when local and no credentials) — same
	// selection rules as the API server.
	var plaidClient service.PlaidClient
	if cfg.IsLocalEnv() && (cfg.PlaidClientID == "" || cfg.PlaidSecret == "") {
		plaidClient = service.NewDevPlaidClient()
	} else {
		plaidHTTP, httpErr := service.NewPlaidHTTPClient(cfg)
		if httpErr != nil {
			os.Exit(1)
		}
		plaidClient = plaidHTTP
	}
	plaidService := service.NewPlaidService(sqlc.New(pool), pool, plaidClient)

	workers := river.NewWorkers()
	river.AddWorker(workers, jobs.NewPlaidSyncWorker(plaidService))
	river.AddWorker(workers, jobs.NewPlaidSyncAllWorker(plaidService))

	riverClient, err := river.NewClient(riverpgxv5.New(pool), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 10},
		},
		Workers: workers,
		PeriodicJobs: []*river.PeriodicJob{
			// Hourly refresh of every connection's balances + transactions.
			river.NewPeriodicJob(
				river.PeriodicInterval(time.Hour),
				func() (river.JobArgs, *river.InsertOpts) { return jobs.PlaidSyncAllArgs{}, nil },
				&river.PeriodicJobOpts{RunOnStart: true},
			),
		},
	})
	if err != nil {
		os.Exit(1)
	}

	if err := riverClient.Start(ctx); err != nil {
		os.Exit(1)
	}

	// Block forever — the worker process runs until killed.
	select {}
}
