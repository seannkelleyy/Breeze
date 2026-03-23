package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"breeze.api/internal/config"
	"breeze.api/internal/db"
	"breeze.api/internal/middleware"
	"github.com/joho/godotenv"

	clerk "github.com/clerk/clerk-sdk-go/v2"
	// These will be added once you scaffold gqlgen
	// "breeze.api/graph"
	// "github.com/99designs/gqlgen/graphql/handler"
	// "github.com/99designs/gqlgen/graphql/playground"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	// Configure slog based on ENV
	if cfg.Env == "production" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	} else {
		slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))
	}

	slog.Info("starting server", "port", cfg.Port, "env", cfg.Env)
	slog.Info("connecting to database", "url", cfg.DatabaseURL)

	// Init Clerk
	clerk.SetKey(cfg.ClerkSecretKey)

	// Init DB
	ctx := context.Background()
	pool := db.NewPool(ctx, cfg.DatabaseURL)
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
		}
	})

	// TODO: uncomment once gqlgen is scaffolded
	// GraphiQL playground (public, dev only)
	// mux.Handle("/", playground.Handler("GraphQL", "/query"))

	// GraphQL endpoint (protected)
	// mux.Handle("/query", middleware.RequireAuth(srv))

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	handler := middleware.CORS(mux)

	slog.Info("Server running", "port", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("Server error", "error", err)
		os.Exit(1)
	}
}
