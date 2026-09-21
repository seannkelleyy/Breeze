package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"breeze.api/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// Seed applies db/seed/seed.sql (idempotent reference data) to the database.
// Runs on deploy so fresh environments get tax tables and IRS limits.
func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	sql, err := os.ReadFile("db/seed/seed.sql")
	if err != nil {
		log.Fatalf("read seed: %v", err)
	}

	// No arguments -> pgx uses the simple query protocol, which supports
	// the multi-statement script.
	if _, err := pool.Exec(ctx, string(sql)); err != nil {
		log.Fatalf("seed: %v", err)
	}

	fmt.Println("seed applied")
}
