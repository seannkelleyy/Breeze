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

	// Init Clerk for JWT validation (required in all environments for
	// auth context resolution; CLERK_SECRET_KEY must be set locally too).
	if cfg.ClerkSecretKey != "" {
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
	scenarioService := service.NewScenarioService(queries, pool)
	retirementService := service.NewRetirementAccountService(queries)
	expenseCategoryService := service.NewExpenseCategoryService(queries)
	expenseService := service.NewExpenseService(queries, pool)
	incomeService := service.NewIncomeService(queries)
	recurringIncomeService := service.NewRecurringIncomeService(queries)
	recurringExpenseService := service.NewRecurringExpenseService(queries)
	plannerPersonService := service.NewPlannerPersonService(queries)
	taxBracketService := service.NewTaxBracketService(queries)
	taxPlanningService := service.NewTaxPlanningService(queries)
	retirementLadderService := service.NewRetirementLadderService(queries)
	netWorthSnapshotService := service.NewNetWorthSnapshotService(queries)
	// Plaid client/service (dev-mode when local and no credentials)
	var plaidClient service.PlaidClient
	if cfg.IsLocalEnv() && (cfg.PlaidClientID == "" || cfg.PlaidSecret == "") {
		plaidClient = service.NewDevPlaidClient()
	} else {
		plaidHTTP, err := service.NewPlaidHTTPClient(cfg)
		if err != nil {
			slog.Error("failed to init Plaid client", "error", err)
			sentry.CaptureException(err)
			os.Exit(1)
		}
		plaidClient = plaidHTTP
	}
	plaidService := service.NewPlaidService(queries, pool, plaidClient)
	resolver := &graph.Resolver{
		HealthService:           healthService,
		UserService:             userService,
		AssetService:            assetService,
		LiabilityService:        liabilityService,
		BudgetService:           budgetService,
		GoalService:             goalService,
		ScenarioService:         scenarioService,
		RetirementService:       retirementService,
		PlaidService:            plaidService,
		ExpenseCategoryService:  expenseCategoryService,
		ExpenseService:          expenseService,
		IncomeService:           incomeService,
		RecurringIncomeService:  recurringIncomeService,
		RecurringExpenseService: recurringExpenseService,
		PlannerPersonService:    plannerPersonService,
		TaxBracketService:       taxBracketService,
		TaxPlanningService:      taxPlanningService,
		RetirementLadderService: retirementLadderService,
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

	// Apply Clerk auth to the query endpoint when configured.
	// In local mode without Clerk, use dev auth with a default user ID.
	if cfg.ClerkSecretKey != "" {
		slog.Info("auth middleware enabled")
		mux.Handle("/query", middleware.RequireAuth(srv))
	} else if cfg.IsLocalEnv() {
		slog.Info("dev auth middleware enabled (no CLERK_SECRET_KEY)")
		devUserID := "550e8400-e29b-41d4-a716-446655440000"
		mux.Handle("/query", middleware.DevAuth(devUserID)(srv))
	} else {
		slog.Info("auth middleware disabled (no CLERK_SECRET_KEY)")
		mux.Handle("/query", srv)
	}

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	rateLimitCfg := middleware.RateLimiterConfig{
		RequestsPerSecond: 30, // adjust as needed
		Burst:             60,
	}

	handler := middleware.CORS(cfg.AllowedOrigin)(mux)
	if !cfg.IsLocalEnv() {
		handler = middleware.RateLimit(rateLimitCfg, handler)
	}

	slog.Info("server running", "port", port)
	slog.Info("graphql playground", "url", fmt.Sprintf("http://localhost:%s/graphql", port))
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("server error", "error", err)
		sentry.CaptureException(err)
		os.Exit(1)
	}
}
