---
applyTo: "breeze.api/internal/graph/**"
---

# GraphQL Resolver Instructions

## Resolver Rules — Always Thin

Resolvers must do exactly five things and nothing else:

1. Extract the authenticated user ID from context
2. Map GraphQL input to a service input type
3. Call the service
4. Map the service result to a GraphQL model type
5. Return

```go
// CORRECT — thin resolver
func (r *mutationResolver) AddExpense(
    ctx context.Context,
    input model.AddExpenseInput,
) (*model.Expense, error) {
    userID := middleware.UserIDFromCtx(ctx)
    expense, err := r.ExpenseService.CreateExpense(ctx,
        service.CreateExpenseInput{
            UserID:      userID,
            BudgetID:    uuid.MustParse(input.BudgetID),
            Amount:      decimal.RequireFromString(input.Amount),
            Description: input.Description,
            Date:        input.Date,
            Splits:      mapSplitInputs(input.Splits),
        })
    if err != nil {
        return nil, mapServiceError(err)
    }
    return mapExpense(expense), nil
}
```

No business logic. No validation. No SQL. No direct DB calls. If you are doing any of those things in a resolver, move it to the service layer.

## Error Mapping

Map domain errors to GraphQL errors in a central `mapServiceError` function in `internal/graph/resolver/mapping.go`:

```go
func mapServiceError(err error) error {
    switch {
    case errors.Is(err, service.ErrNotFound):
        return &gqlerror.Error{
            Message:    err.Error(),
            Extensions: map[string]any{"code": "NOT_FOUND"},
        }
    case errors.Is(err, service.ErrUnauthorized):
        return &gqlerror.Error{
            Message:    err.Error(),
            Extensions: map[string]any{"code": "UNAUTHORIZED"},
        }
    case errors.Is(err, service.ErrSplitMismatch):
        return &gqlerror.Error{
            Message:    err.Error(),
            Extensions: map[string]any{"code": "VALIDATION_ERROR"},
        }
    default:
        // Log unexpected errors — never expose internals to client
        logger := middleware.LoggerFromCtx(ctx)
        logger.Error("unexpected error", "err", err)
        return errors.New("internal server error")
    }
}
```

## GraphQL Schema Conventions

```graphql
type ExpenseCategory {
  id:                  ID!
  budgetId:            ID!
  description:         String!
  allocationAmount:    String!    # decimal as string — never Float
  rolloverAmount:      String!
  parentCategoryId:    ID          # nullable — no !
  effectiveAllocation: String!    # derived
  totalSpent:          String!    # derived — DataLoader
  remaining:           String!    # derived — DataLoader
  percentUsed:         Float!     # derived — DataLoader
  expenses:            [Expense!]!
}
```

Rules:
- All IDs are `ID!` (non-null)
- All monetary amounts are `String!` — never `Float` — to avoid precision loss on the wire
- Nullable fields have no `!`
- Non-nullable fields have `!`
- Lists are `[Type!]!` — non-null list of non-null items

## DataLoader Pattern

Every field that queries the DB for child records of a list of parents needs a DataLoader. Without it every item in the list fires a separate DB query (N+1).

```go
// WRONG — N+1, DB called once per category in the list
func (r *expenseCategoryResolver) TotalSpent(
    ctx context.Context,
    cat *model.ExpenseCategory,
) (string, error) {
    result, err := r.DB.SumSplitsForCategory(ctx, cat.ID) // fires N times
    if err != nil { return "0", err }
    return result.Round(2).String(), nil
}

// RIGHT — batched via DataLoader, single DB call for all categories
func (r *expenseCategoryResolver) TotalSpent(
    ctx context.Context,
    cat *model.ExpenseCategory,
) (string, error) {
    thunk := r.Loaders.CategorySpent.Load(ctx, cat.ID)
    result, err := thunk()
    if err != nil { return "0", err }
    return result.(decimal.Decimal).Round(2).String(), nil
}
```

DataLoaders live in `internal/loader/`. One DataLoader per batched query pattern. Inject the loader bundle via context middleware.

## Mapping Functions

Keep all `map*` functions in `internal/graph/resolver/mapping.go`. Never inline complex mapping logic in resolver functions.

```go
func mapExpense(e *db.Expense) *model.Expense {
    return &model.Expense{
        ID:          e.ID.String(),
        BudgetID:    e.BudgetID.String(),
        Amount:      e.Amount.String(),
        Description: e.Description,
        Date:        e.Date.Time.Format("2006-01-02"),
    }
}

func mapSplitInputs(inputs []model.ExpenseSplitInput) []service.SplitInput {
    splits := make([]service.SplitInput, len(inputs))
    for i, s := range inputs {
        splits[i] = service.SplitInput{
            CategoryID:  uuid.MustParse(s.CategoryID),
            Amount:      decimal.RequireFromString(s.Amount),
            Description: s.Description,
        }
    }
    return splits
}
```

## Decimal Parsing in Resolvers

Parse decimal from string input in every mutation. Use the helper:

```go
// internal/graph/resolver/helpers.go
func parseDecimal(s string) (decimal.Decimal, error) {
    d, err := decimal.Parse(s)
    if err != nil {
        return decimal.Zero, fmt.Errorf("invalid decimal %q: %w", s, err)
    }
    return d, nil
}
```

Never use `decimal.RequireFromString` for user input — it panics on invalid input. Use it only for hardcoded constants in tests.

## Derived Fields — Simple vs DataLoader

Simple derived fields that require no DB access can be computed directly in the resolver:

```go
// No DB needed — just math on parent fields
func (r *expenseCategoryResolver) EffectiveAllocation(
    ctx context.Context,
    cat *model.ExpenseCategory,
) (string, error) {
    allocation := decimal.RequireFromString(cat.AllocationAmount)
    rollover   := decimal.RequireFromString(cat.RolloverAmount)
    return allocation.Add(rollover).Round(2).String(), nil
}
```

Derived fields that require DB access (TotalSpent, Remaining, Progress) must use a DataLoader.

## Generated Files — Never Edit

- `internal/graph/generated/` — gqlgen output, regenerated with `make gen`
- `internal/graph/model/models_gen.go` — gqlgen generated models

After any change to `internal/graph/schema.graphqls` run `make gen`. The compiler will tell you which resolver stubs need implementing.
