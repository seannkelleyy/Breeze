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
	"breeze.api/internal/health"
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

	// Clerk auth is required in every environment, including local development.
	clerk.SetKey(cfg.ClerkSecretKey)

	// Init DB
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		sentry.CaptureException(err)
		os.Exit(1) //nolint:gocritic // exitAfterDefer: acceptable in main
	}
	defer pool.Close()

	healthService := service.NewHealthService()
	queries := dbsqlc.New(pool)
	userService := service.NewUserService(queries)
	assetService := service.NewAssetService(queries)
	liabilityService := service.NewLiabilityService(queries)
	budgetService := service.NewBudgetService(queries)
	budgetMonthService := service.NewBudgetMonthService(queries, pool)
	goalService := service.NewGoalService(queries)
	contributionLimitService := service.NewContributionLimitService(queries)
	expenseCategoryService := service.NewExpenseCategoryService(queries)
	expenseService := service.NewExpenseService(queries, pool)
	incomeService := service.NewIncomeService(queries)
	recurringIncomeService := service.NewRecurringIncomeService(queries)
	recurringExpenseService := service.NewRecurringExpenseService(queries)
	plannerPersonService := service.NewPlannerPersonService(queries)
	paycheckDeductionService := service.NewPaycheckDeductionService(queries)
	taxBracketService := service.NewTaxBracketService(queries)
	taxYearService := service.NewTaxYearService(queries)
	taxPlanningService := service.NewTaxPlanningService(queries)
	retirementLadderService := service.NewRetirementLadderService(queries)
	netWorthSnapshotService := service.NewNetWorthSnapshotService(queries, pool)
	transactionService := service.NewTransactionService(queries)
	retirementAccessService := service.NewRetirementAccessService(queries)
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
		HealthService:            healthService,
		UserService:              userService,
		AssetService:             assetService,
		LiabilityService:         liabilityService,
		BudgetService:            budgetService,
		BudgetMonthService:       budgetMonthService,
		GoalService:              goalService,
		ContributionLimitService: contributionLimitService,
		PlaidService:             plaidService,
		ExpenseCategoryService:   expenseCategoryService,
		ExpenseService:           expenseService,
		IncomeService:            incomeService,
		RecurringIncomeService:   recurringIncomeService,
		RecurringExpenseService:  recurringExpenseService,
		PlannerPersonService:     plannerPersonService,
		PaycheckDeductionService: paycheckDeductionService,
		TaxBracketService:        taxBracketService,
		TaxYearService:           taxYearService,
		TaxPlanningService:       taxPlanningService,
		RetirementLadderService:  retirementLadderService,
		NetWorthSnapshotService:  netWorthSnapshotService,
		TransactionService:       transactionService,
		RetirementAccessService:  retirementAccessService,
	}
	srv := gqlhandler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: resolver}))

	mux := http.NewServeMux()

	// Health check (public) verifies the database is reachable before reporting ready.
	mux.HandleFunc("/health", health.NewHandler(pool))

	mux.Handle("/graphql", playground.Handler("GraphQL", "/query"))

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	rateLimitCfg := middleware.RateLimiterConfig{
		RequestsPerSecond: cfg.RateLimitRPS,
		Burst:             cfg.RateLimitBurst,
		MaxClients:        10_000,
		IdleTimeout:       10 * time.Minute,
		TrustedProxies:    cfg.TrustedProxyCIDRs,
	}

	queryHandler := middleware.RequireAuth(srv)
	if !cfg.IsLocalEnv() {
		queryHandler = middleware.RateLimit(rateLimitCfg, queryHandler)
	}
	mux.Handle("/query", queryHandler)

	// Outermost first: panic recovery guards every handler, access log counts
	// every request including those rejected by CORS/rate limiting.
	handler := middleware.RecoverMiddleware(mux)
	handler = middleware.AccessLogMiddleware(handler)
	handler = middleware.CORS(cfg.AllowedOrigin)(handler)

	slog.Info("server running", "port", port)
	slog.Info("graphql playground", "url", fmt.Sprintf("http://localhost:%s/graphql", port))
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("server error", "error", err)
		sentry.CaptureException(err)
		os.Exit(1)
	}
}
