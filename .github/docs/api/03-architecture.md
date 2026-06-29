# 04 — Architecture Patterns

## Request Lifecycle

```
HTTP request
  → Auth middleware          Clerk JWT validation, extract userId
  → RequestID middleware     Generate UUID, inject into context
  → Logger middleware        Inject slog.Logger pre-loaded with requestId + userId
  → Rate limiter             Per-user token bucket (golang.org/x/time/rate)
  → gqlgen handler
  → Resolver                 Thin — map input, call service, map output
  → Service                  Business logic, validation, transactions
  → sqlc DB layer            Generated type-safe query functions
  → PostgreSQL (Neon)
```

---

## The Three-Layer Rule

> **Resolvers call services. Services call the DB layer. Neither direction ever reverses.**
> No SQL in resolvers or services. No business logic in resolvers.

### Layer 1 — Resolver (thin)

The only things a resolver does:
1. Extract authenticated user ID from context
2. Map GraphQL input to a service input type
3. Call the service
4. Map the service result to a GraphQL model type
5. Return

```go
func (r *mutationResolver) AddExpense(
    ctx context.Context,
    input model.AddExpenseInput,
) (*model.Expense, error) {
    userID := middleware.UserIDFromCtx(ctx)
    expense, err := r.ExpenseService.CreateExpense(ctx,
        service.CreateExpenseInput{
            UserID:  userID,
            Amount:  decimal.RequireFromString(input.Amount),
            // ...
        })
    if err != nil {
        return nil, mapServiceError(err)
    }
    return mapExpense(expense), nil
}
```

### Layer 2 — Service (owns everything else)

- All domain validation
- All business rules
- All transaction management
- All derived value computation requiring DB access
- Authorization — confirm resource belongs to requesting user

```go
func (s *ExpenseService) CreateExpense(
    ctx context.Context,
    input CreateExpenseInput,
) (*db.Expense, error) {
    // Validate in service, not resolver
    if len(input.Splits) == 0 {
        return nil, ErrNoSplits
    }
    var splitTotal decimal.Decimal
    for _, split := range input.Splits {
        splitTotal = splitTotal.Add(split.Amount)
    }
    if !splitTotal.Equal(input.Amount) {
        return nil, ErrSplitMismatch
    }
    // ... transaction + inserts
}
```

### Layer 3 — DB (sqlc generated)

- Generated from `db/queries/*.sql` files
- Never written by hand
- Never called directly from resolvers

---

## Transactions — Always Explicit

Any mutation touching more than one table must use a transaction:

```go
tx, err := s.pool.Begin(ctx)
if err != nil {
    return nil, fmt.Errorf("begin transaction: %w", err)
}
defer tx.Rollback(ctx) // no-op if already committed

qtx := s.db.WithTx(tx)

expense, err := qtx.CreateExpense(ctx, ...)
if err != nil { return nil, fmt.Errorf("create expense: %w", err) }

for _, split := range input.Splits {
    _, err = qtx.CreateExpenseSplit(ctx, ...)
    if err != nil { return nil, fmt.Errorf("create split: %w", err) }
}

return &expense, tx.Commit(ctx)
```

Mutations that require transactions:
- CreateExpense — expense + splits
- CreateBudget — budget + recurring income/expense generation
- PlaidSync — multiple transaction upserts
- CreateNetWorthSnapshot — reads many tables, writes one

---

## DataLoaders — Required for List Resolvers

Every field that loads child records for a list of parents must use a DataLoader. Calling the DB inside a loop is an N+1 bug.

```go
// WRONG — N+1, called once per category in the list
func (r *resolver) TotalSpent(ctx context.Context, cat *model.ExpenseCategory) (string, error) {
    result, err := r.DB.SumSplitsForCategory(ctx, cat.ID) // fires N times
    // ...
}

// RIGHT — batched via DataLoader, fires once for all categories
func (r *resolver) TotalSpent(ctx context.Context, cat *model.ExpenseCategory) (string, error) {
    thunk := r.Loaders.CategorySpent.Load(ctx, cat.ID)
    result, err := thunk()
    if err != nil { return "0", err }
    return result.(decimal.Decimal).Round(2).String(), nil
}
```

---

## Money — Always govalues/decimal

```go
// WRONG — never use float64 for money
var amount float64 = 19.99

// RIGHT
amount, err := decimal.Parse(input.Amount)
effective := allocation.Add(rollover)
remaining := effective.Sub(spent)
result := remaining.Round(2) // always round before returning

// On the GraphQL wire — always String, never Float
return result.String(), nil  // "175.00"
```

---

## Logger — Always From Context

Middleware injects a `*slog.Logger` pre-loaded with `requestId` and `userId` into every request context. Never use a global logger.

```go
logger := middleware.LoggerFromCtx(ctx)
logger.Info("expense created", "expenseId", expense.ID, "amount", amount.String())
logger.Error("split validation failed", "expected", total.String(), "got", splitSum.String())
```

---

## Error Handling

Wrap errors with context using `%w`. Define all domain errors as sentinels in `internal/service/errors.go`.

```go
// errors.go
var (
    ErrNotFound               = errors.New("not found")
    ErrUnauthorized           = errors.New("unauthorized")
    ErrSplitMismatch          = errors.New("split amounts must equal total expense amount")
    ErrNoSplits               = errors.New("expense must have at least one split")
    ErrSplitAmountNonPositive = errors.New("split amount must be positive")
    ErrDuplicateBudgetMonth   = errors.New("a budget already exists for this month")
)

// Usage — always wrap with context
if errors.Is(err, pgx.ErrNoRows) {
    return nil, ErrNotFound
}
return nil, fmt.Errorf("get budget: %w", err)
```

Map service errors to GraphQL errors in a central `mapServiceError` function in the resolver layer. Never expose raw DB errors to the client.

---

## Authorization Pattern

Always verify resource ownership in the service layer, not the resolver:

```go
func (s *BudgetService) GetBudget(ctx context.Context, userID, budgetID uuid.UUID) (*db.Budget, error) {
    budget, err := s.db.GetBudget(ctx, budgetID)
    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, fmt.Errorf("get budget: %w", err)
    }
    if budget.UserID != userID {
        return nil, ErrUnauthorized // do not reveal existence to unauthorized user
    }
    return &budget, nil
}
```

---

## Graceful Shutdown

Required for Fly.io (sends SIGTERM before killing) and Kubernetes:

```go
ctx, stop := signal.NotifyContext(context.Background(),
    syscall.SIGTERM, syscall.SIGINT)
defer stop()

// start server in goroutine

<-ctx.Done()
logger.Info("shutdown signal received")

shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(shutdownCtx)
pool.Close()
```

---

## Config — Typed Struct, Fail Fast

```go
type Config struct {
    DatabaseURL    string `env:"DATABASE_URL,required"`
    Port           int    `env:"PORT"              envDefault:"8080"`
    ClerkSecretKey string `env:"CLERK_SECRET_KEY,required"`
    SentryDSN      string `env:"SENTRY_DSN"`
    SelfHosted     bool   `env:"SELF_HOSTED"       envDefault:"false"`
    EncryptionKey  string `env:"ENCRYPTION_KEY"`   // required before Plaid feature
}
```

Never call `os.Getenv` directly in business logic. Parse config once at startup and pass `*Config` down.

---

## Background Jobs — riverqueue/river

Three features require async work:
- **Plaid webhook processing** — store webhook immediately, process asynchronously
- **Recurring budget generation** — create Income/Expense rows from templates each month
- **NetWorthSnapshot generation** — triggered monthly or on-demand

River uses your existing Postgres database — no Redis, no separate infrastructure:

```go
type GenerateBudgetArgs struct {
    UserID uuid.UUID `json:"user_id"`
    Month  time.Time `json:"month"`
}

func (GenerateBudgetArgs) Kind() string { return "generate_budget" }

type GenerateBudgetWorker struct {
    river.WorkerDefaults[GenerateBudgetArgs]
    budgetService *service.BudgetService
}

func (w *GenerateBudgetWorker) Work(ctx context.Context, job *river.Job[GenerateBudgetArgs]) error {
    return w.budgetService.GenerateFromRecurring(ctx, job.Args.UserID, job.Args.Month)
}
```
