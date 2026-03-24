package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/getsentry/sentry-go"
	"github.com/joho/godotenv"

	"breeze.api/internal/config"
	"breeze.api/internal/db"
	"breeze.api/internal/middleware"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	// Initialize Sentry
	if err := sentry.Init(sentry.ClientOptions{
		Dsn:              cfg.SentryDSN,
		Environment:      cfg.Env,
		TracesSampleRate: 1.0,
	}); err != nil {
		log.Fatalf("sentry.Init: %s", err)
	}
	defer sentry.Flush(2 * time.Second)

	// Configure slog
	if cfg.Env == "production" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	} else {
		slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))
	}

	slog.Info("starting server", "port", cfg.Port, "env", cfg.Env)

	// Init Clerk
	clerk.SetKey(cfg.ClerkSecretKey)

	// Init DB
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		sentry.CaptureException(err)
		os.Exit(1)
	}
	defer pool.Close()

	// TODO: uncomment once gqlgen is scaffolded
	// resolver := &graph.Resolver{DB: pool}
	// srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	mux := http.NewServeMux()

	// Health check (public)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		if _, err := fmt.Fprintln(w, "ok"); err != nil {
			slog.Error("health check write error", "error", err)
			sentry.CaptureException(err)
		}
	})

	// TODO: uncomment once gqlgen is scaffolded
	// mux.Handle("/", playground.Handler("GraphQL", "/query"))
	// mux.Handle("/query", middleware.RequireAuth(srv))

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	rateLimitCfg := middleware.RateLimiterConfig{
		RequestsPerSecond: 30, // adjust as needed
		Burst:             60,
	}
	handler := middleware.CORS(middleware.RateLimit(rateLimitCfg, mux))

	slog.Info("server running", "port", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("server error", "error", err)
		sentry.CaptureException(err)
		os.Exit(1)
	}
}
