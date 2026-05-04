package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	gqlhandler "github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/getsentry/sentry-go"
	"github.com/joho/godotenv"

	"breeze.api/graph"
	"breeze.api/graph/generated"
	"breeze.api/internal/config"
	"breeze.api/internal/db"
	dbsqlc "breeze.api/internal/db/sqlc"
	"breeze.api/internal/middleware"
	"breeze.api/internal/service"
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

	// Init Clerk when auth is enforced.
	if !cfg.IsLocalEnv() {
		clerk.SetKey(cfg.ClerkSecretKey)
	}

	// Init DB
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		sentry.CaptureException(err)
		os.Exit(1)
	}
	defer pool.Close()

	healthService := service.NewHealthService()
	queries := dbsqlc.New(pool)
	userService := service.NewUserService(queries)
	assetService := service.NewAssetService(queries)
	liabilityService := service.NewLiabilityService(queries)
	budgetService := service.NewBudgetService(queries)
	goalService := service.NewGoalService(queries)
	retirementService := service.NewRetirementAccountService(queries)
	expenseCategoryService := service.NewExpenseCategoryService(queries)
	expenseService := service.NewExpenseService(queries, pool)
	incomeService := service.NewIncomeService(queries)
	recurringIncomeService := service.NewRecurringIncomeService(queries)
	taxBracketService := service.NewTaxBracketService(queries)
	netWorthSnapshotService := service.NewNetWorthSnapshotService(queries)
	resolver := &graph.Resolver{
		HealthService:           healthService,
		UserService:             userService,
		AssetService:            assetService,
		LiabilityService:        liabilityService,
		BudgetService:           budgetService,
		GoalService:             goalService,
		RetirementService:       retirementService,
		ExpenseCategoryService:  expenseCategoryService,
		ExpenseService:          expenseService,
		IncomeService:           incomeService,
		RecurringIncomeService:  recurringIncomeService,
		TaxBracketService:       taxBracketService,
		NetWorthSnapshotService: netWorthSnapshotService,
	}
	srv := gqlhandler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: resolver}))

	mux := http.NewServeMux()

	// Health check (public)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		if _, err := fmt.Fprintln(w, "ok"); err != nil {
			slog.Error("health check write error", "error", err)
			sentry.CaptureException(err)
		}
	})

	mux.Handle("/graphql", playground.Handler("GraphQL", "/query"))
	mux.Handle("/query", srv)

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	rateLimitCfg := middleware.RateLimiterConfig{
		RequestsPerSecond: 30, // adjust as needed
		Burst:             60,
	}

	var handler http.Handler = mux
	if cfg.IsLocalEnv() {
		slog.Info("running without auth and rate limiting", "env", cfg.Env)
		handler = middleware.CORS(handler)
	} else {
		handler = middleware.CORS(middleware.RateLimit(rateLimitCfg, middleware.RequireAuth(handler)))
	}

	slog.Info("server running", "port", port)
	slog.Info("graphql playground", "url", fmt.Sprintf("http://localhost:%s/graphql", port))
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("server error", "error", err)
		sentry.CaptureException(err)
		os.Exit(1)
	}
}
