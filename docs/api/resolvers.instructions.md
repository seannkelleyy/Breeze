---
applyTo: "breeze.api/graph/**"
---

# GraphQL Resolver Instructions

## Resolver Rules — Always Thin

Resolvers must do exactly five things and nothing else:

1. Resolve the authenticated user ID from context (fail closed)
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
    userID, err := resolveUserIDFromCtx(ctx, r.UserService)
    if err != nil {
        return nil, r.mapErr(ctx, err)
    }

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
        return nil, r.mapErr(ctx, err)
    }
    return mapExpense(expense), nil
}
```

No business logic. No validation. No SQL. No direct DB calls. If you are doing any of those things in a resolver, move it to the service layer.

## Caller Identity — Fail Closed

`resolveUserIDFromCtx(ctx, r.UserService)` maps the Clerk identity to Breeze's internal user row. It returns `service.ErrUnauthorized` when the request carries no identity **or** when the identity has no account yet (provisioning is client-driven, so this happens). Its error is terminal:

```go
userID, err := resolveUserIDFromCtx(ctx, r.UserService)
if err != nil {
    return nil, r.mapErr(ctx, err)
}
```

Never fall back to a client-supplied `userId` when resolution fails. A fallback turns an unprovisioned account or a transient lookup failure into cross-tenant reads and writes.

User-scoped queries still take a `userId` argument for the current client, but the resolver ignores it — name the parameter `_` and use the authenticated user:

```go
func (r *queryResolver) Assets(ctx context.Context, _ string) ([]*model.Asset, error) {
    userID, err := resolveUserIDFromCtx(ctx, r.UserService)
    if err != nil {
        return nil, r.mapErr(ctx, err)
    }
    // list by userID
}
```

## Error Mapping

Map domain errors to GraphQL errors in a central helper in the `graph` package:

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

This is an illustrative shape for conventions, not the current API schema; `graph/schema.graphqls` is authoritative.

```graphql
type ExpenseCategory {
	id: ID!
	budgetId: ID!
	description: String!
	allocationAmount: String! # decimal as string — never Float
	rolloverAmount: String!
	parentCategoryId: ID # nullable — no !
	effectiveAllocation: String! # derived
	totalSpent: String! # illustrative derived field
	expenses: [Expense!]!
}
```

Rules:

- All IDs are `ID!` (non-null)
- All monetary amounts are `String!` — never `Float` — to avoid precision loss on the wire
- Nullable fields have no `!`
- Non-nullable fields have `!`
- Lists are `[Type!]!` — non-null list of non-null items

## Avoiding GraphQL N+1 Queries

A resolver that queries once for each parent in a returned list can cause an N+1 query pattern. First see whether one aggregate/batched sqlc query can return the needed values. A request-scoped DataLoader is another option when the GraphQL field resolution pattern benefits from batching and per-request caching.

There is no DataLoader currently wired into GraphQL, and the present schema has no nested database field resolver that needs one. Expense splits are fetched with one batched sqlc query for a list of expenses. Do not add a loader preemptively; implement the batch query, request-scoped loader, and resolver integration together if a real N+1 use case appears.

DataLoader calls should remain inside the resolver layer as a batching mechanism; batch functions should delegate to the service/DB query path rather than introducing SQL into resolvers.

## Mapping Functions

Keep all `map*` functions in helper files under `graph/` (for example, `graph/asset_helpers.go`). Never inline complex mapping logic in resolver functions.

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
// graph helpers
func parseDecimal(s string) (decimal.Decimal, error) {
    d, err := decimal.Parse(s)
    if err != nil {
        return decimal.Zero, fmt.Errorf("invalid decimal %q: %w", s, err)
    }
    return d, nil
}
```

Never use `decimal.RequireFromString` for user input — it panics on invalid input. Use it only for hardcoded constants in tests.

## Derived Fields

Fields derivable from data already on the parent can be mapped/computed without another DB query. For fields needing DB data, use the service layer and avoid one query per parent; choose an aggregate/batched sqlc query or wire a DataLoader if that is the cleanest fit. DataLoader is not mandatory, and no loader is currently wired into GraphQL.

## Generated Files — Never Edit

- `graph/generated/` — gqlgen output, regenerated with `make gen`
- `graph/model/models_gen.go` — gqlgen generated models

After any change to `graph/schema.graphqls` run `make gen`. The compiler will tell you which resolver stubs need implementing.
