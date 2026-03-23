---
applyTo: "breeze.api/internal/service/**"
---

# Service Layer Instructions

## Service Structure

One service per domain. Each service takes a DB queries instance and a connection pool:

```go
type ExpenseService struct {
    db   *db.Queries
    pool *pgxpool.Pool
}

func NewExpenseService(db *db.Queries, pool *pgxpool.Pool) *ExpenseService {
    return &ExpenseService{db: db, pool: pool}
}
```

Wire all services together in `cmd/api/main.go`. Never construct a service inside another service.

## Validation Belongs Here — Not in Resolvers

All domain validation lives in the service layer:

```go
func (s *ExpenseService) CreateExpense(ctx context.Context, input CreateExpenseInput) (*db.Expense, error) {
    if len(input.Splits) == 0 {
        return nil, ErrNoSplits
    }
    var splitTotal decimal.Decimal
    for _, split := range input.Splits {
        if split.Amount.IsZero() || split.Amount.IsNegative() {
            return nil, ErrSplitAmountNonPositive
        }
        splitTotal = splitTotal.Add(split.Amount)
    }
    if !splitTotal.Equal(input.Amount) {
        return nil, ErrSplitMismatch
    }
    // proceed to insert
}
```

## Transaction Pattern — Always Explicit

Any mutation touching more than one table must use a transaction. Always defer rollback:

```go
func (s *ExpenseService) CreateExpense(ctx context.Context, input CreateExpenseInput) (*db.Expense, error) {
    tx, err := s.pool.Begin(ctx)
    if err != nil {
        return nil, fmt.Errorf("begin transaction: %w", err)
    }
    defer tx.Rollback(ctx) // no-op if already committed

    qtx := s.db.WithTx(tx)

    expense, err := qtx.CreateExpense(ctx, db.CreateExpenseParams{
        UserID:      input.UserID,
        BudgetID:    input.BudgetID,
        Amount:      input.Amount,
        Description: input.Description,
        Date:        pgtype.Date{Time: input.Date, Valid: true},
    })
    if err != nil {
        return nil, fmt.Errorf("create expense: %w", err)
    }

    for _, split := range input.Splits {
        _, err = qtx.CreateExpenseSplit(ctx, db.CreateExpenseSplitParams{
            ExpenseID:   expense.ID,
            CategoryID:  split.CategoryID,
            Amount:      split.Amount,
            Description: split.Description,
        })
        if err != nil {
            return nil, fmt.Errorf("create split: %w", err)
        }
    }

    if err = tx.Commit(ctx); err != nil {
        return nil, fmt.Errorf("commit: %w", err)
    }
    return &expense, nil
}
```

Mutations that always require transactions:
- `CreateExpense` — expense + splits
- `CreateBudget` — budget + generate recurring income/expense rows
- `PlaidSync` — multiple transaction upserts
- `CreateNetWorthSnapshot` — reads many tables, writes one

## Authorization — Always Check Ownership

Verify the requested resource belongs to the requesting user. Return `ErrUnauthorized` without revealing existence:

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
        return nil, ErrUnauthorized // do not reveal existence to unauthorized caller
    }
    return &budget, nil
}
```

## Sentinel Errors — Define in errors.go

All domain errors defined in `internal/service/errors.go`:

```go
var (
    ErrNotFound               = errors.New("not found")
    ErrUnauthorized           = errors.New("unauthorized")
    ErrSplitMismatch          = errors.New("split amounts must equal total expense amount")
    ErrNoSplits               = errors.New("expense must have at least one split")
    ErrSplitAmountNonPositive = errors.New("split amount must be positive")
    ErrDuplicateBudgetMonth   = errors.New("a budget already exists for this month")
)
```

Always wrap with context using `%w` when propagating:

```go
// Map DB errors to domain errors
if errors.Is(err, pgx.ErrNoRows) {
    return nil, ErrNotFound
}
return nil, fmt.Errorf("get budget: %w", err)
```

Use `errors.Is` for checking — never string comparison on error messages.

## Money — Always govalues/decimal

```go
// Never use float64 for money
var splitTotal decimal.Decimal
for _, split := range input.Splits {
    splitTotal = splitTotal.Add(split.Amount)
}
if !splitTotal.Equal(input.Amount) {
    return nil, ErrSplitMismatch
}

// Rollover is floored at zero — never negative
rollover := previousRemaining
if rollover.IsNegative() {
    rollover = decimal.Zero
}
```

## Derived Value Computation

Computed values that require DB access live in the service layer. Simple math on known fields lives in the resolver.

```go
// Service — requires DB
func (s *ExpenseCategoryService) GetTotalSpent(ctx context.Context, categoryID uuid.UUID) (decimal.Decimal, error) {
    result, err := s.db.SumSplitsForCategory(ctx, categoryID)
    if err != nil {
        return decimal.Zero, fmt.Errorf("sum splits: %w", err)
    }
    return result, nil
}

// FI Number — no DB needed, just math
func FINumber(annualSpend, safeWithdrawalRate decimal.Decimal) decimal.Decimal {
    return annualSpend.Quo(safeWithdrawalRate).Round(2)
}
```

## Return Profile Projection

Asset value projection lives in `internal/service/projection/asset.go`:

```go
func ProjectAssetValue(
    currentValue decimal.Decimal,
    lastUpdated  time.Time,
    profile      db.ReturnProfile,
    schedule     []db.ReturnProfileSchedule,
) decimal.Decimal {
    yearsElapsed := yearsBetween(lastUpdated, time.Now())
    switch profile.ProfileType {
    case db.ProfileTypeFlat:
        return currentValue
    case db.ProfileTypeLinear:
        rate := profile.AnnualRate
        return currentValue.Add(currentValue.Mul(rate).Mul(decimal.NewFromFloat(yearsElapsed)))
    case db.ProfileTypeExponential:
        // compound growth with decay factor
    case db.ProfileTypeScheduled:
        // walk schedule year by year, use FallbackRate after last year
    }
    return currentValue
}
```

## Logger — Always From Context

```go
logger := middleware.LoggerFromCtx(ctx)
logger.Info("budget created", "budgetId", budget.ID, "userId", userID)
logger.Error("transaction failed", "err", err, "budgetId", budget.ID)
```

Never use `slog.Default()` or `fmt.Println` in service code.

## Recurring Budget Generation

When creating a new budget month, query active recurring templates and generate concrete rows in the same transaction:

```go
func (s *BudgetService) CreateBudget(ctx context.Context, userID uuid.UUID, month time.Time) (*db.Budget, error) {
    tx, err := s.pool.Begin(ctx)
    // ...
    qtx := s.db.WithTx(tx)

    budget, err := qtx.CreateBudget(ctx, ...)

    // Find active recurring income templates
    recurringIncome, err := qtx.ListActiveRecurringIncome(ctx, db.ListActiveRecurringIncomeParams{
        UserID: userID,
        Month:  pgtype.Date{Time: month, Valid: true},
    })
    for _, r := range recurringIncome {
        _, err = qtx.CreateIncome(ctx, db.CreateIncomeParams{
            UserID:            userID,
            PersonID:          r.PersonID,
            BudgetID:          budget.ID,
            Amount:            r.Amount,
            Description:       r.Description,
            Date:              pgtype.Date{Time: month, Valid: true},
            RecurringSourceID: uuid.NullUUID{UUID: r.ID, Valid: true},
        })
    }
    // repeat for recurring expenses
    return &budget, tx.Commit(ctx)
}
```

## Plaid Access Token Encryption

Before storing a Plaid access token, encrypt it. The encryption key comes from config:

```go
// internal/crypto/encrypt.go
func Encrypt(key []byte, plaintext string) (string, error) {
    block, err := aes.NewCipher(key)
    // ... AES-256-GCM encrypt
    // return base64-encoded ciphertext
}

func Decrypt(key []byte, ciphertext string) (string, error) {
    // ... AES-256-GCM decrypt
}
```

Never store or log the plaintext access token. Never return it via any API response. The key is `ENCRYPTION_KEY` in config (32 bytes, base64-encoded).
