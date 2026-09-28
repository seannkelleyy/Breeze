# 07 — Testing Patterns

## Overview

Service tests use **handwritten mock structs** that implement each service's narrow `Querier` interface. No mockgen, no testcontainers. Unit tests are pure; a separate `integration_test.go` exercises full lifecycles against a live Postgres when `DATABASE_URL` is set (skipped otherwise).

---

## Pattern: Per-Test Mock

Each test function defines a `mockAssetQuerier` struct with function fields for only the methods it needs:

```go
type mockAssetQuerier struct {
    getAssetByIDFunc func(context.Context, uuid.UUID) (sqlc.GetAssetByIDRow, error)
    softDeleteAssetFunc func(context.Context, uuid.UUID) (int64, error)
}
```

The mock implements the full `Querier` interface, but unset functions return zero values by default:

```go
func (m *mockAssetQuerier) GetAssetByID(ctx context.Context, id uuid.UUID) (sqlc.GetAssetByIDRow, error) {
    if m.getAssetByIDFunc != nil {
        return m.getAssetByIDFunc(ctx, id)
    }
    return sqlc.GetAssetByIDRow{}, nil
}
```

---

## Pattern: Happy Path

Create a test fixture, define the mock's expected behavior, call the service, assert the result:

```go
func TestAssetService_Create(t *testing.T) {
    ctx := context.Background()

    mock := &mockAssetQuerier{
        createAssetFunc: func(ctx context.Context, params sqlc.CreateAssetParams) (sqlc.CreateAssetRow, error) {
            assert.Equal(t, "Brokerage", params.Name)
            return sqlc.CreateAssetRow{ID: expectedID, Name: "Brokerage", ...}, nil
        },
    }

    svc := NewAssetService(mock)
    result, err := svc.Create(ctx, CreateAssetInput{Name: "Brokerage", ...})

    assert.NoError(t, err)
    assert.Equal(t, "Brokerage", result.Name)
}
```

---

## Pattern: Error Path (Not Found)

Test that `pgx.ErrNoRows` from the DB layer is translated to `ErrNotFound`:

```go
mock := &mockAssetQuerier{
    getAssetByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetAssetByIDRow, error) {
        return sqlc.GetAssetByIDRow{}, pgx.ErrNoRows
    },
}

svc := NewAssetService(mock)
result, err := svc.GetByID(ctx, someID)

assert.ErrorIs(t, err, service.ErrNotFound)
assert.Nil(t, result)
```

---

## Pattern: Error Path (Soft Delete)

Soft delete has three outcomes. Test each with subtests:

```go
func TestAssetService_Delete(t *testing.T) {
    t.Run("deletes asset", func(t *testing.T) {
        // mock returns 1 row affected → success
    })
    t.Run("returns not found", func(t *testing.T) {
        // mock returns 0 rows affected → ErrNotFound
    })
    t.Run("wraps db error", func(t *testing.T) {
        // mock returns an error → wrapped with context
    })
}
```

---

## Pattern: Test Fixtures

Use a `testXxxRow()` helper to produce a valid base row. Override only the fields the test cares about:

```go
func testAssetRow() sqlc.Asset {
    currentValue, _ := decimal.Parse("125000.55")
    return sqlc.Asset{
        ID:           uuid.New(),
        UserID:       uuid.New(),
        Name:         "Brokerage",
        CurrentValue: currentValue,
        // ...
    }
}
```

Decimal values always parse from string — never construct with a float literal.

---

## Pattern: Narrow Interface for Worker Tests

Packages that take a concrete service (e.g. `internal/jobs` workers) declare a private
interface holding only the methods they use, and take that interface in the constructor.
`*service.PlaidService` satisfies it structurally — production callers don't change — and
tests substitute a fake that records calls:

```go
type plaidSyncer interface {
    ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PlaidConnection, error)
    SyncConnection(ctx context.Context, connectionID uuid.UUID) error
}

func NewPlaidSyncWorker(plaidService plaidSyncer) *PlaidSyncWorker { ... }
```

Apply this whenever a worker needs testing against a concrete dependency. Thin wrappers
around an external client (e.g. `EnqueuePlaidSync`, which needs a live river client) stay
untested — exercise them manually.

---

## What Tests Cover

Every service file has a corresponding `_test.go` file that tests:

| Operation | Happy path | Not found | DB error |
|---|---|---|---|
| Create | ✓ | — | — |
| GetByID | ✓ | ✓ | ✓ |
| List | ✓ | — | — |
| Update | ✓ | ✓ | ✓ |
| Delete | ✓ | ✓ | ✓ |

---

## What Tests Don't Cover

- **GraphQL layer** — resolvers are thin enough that unit tests add little value. Test them manually via GraphQL playground or curl.
- **sqlc queries** — no per-query integration tests; the live-DB integration tests in `integration_test.go` cover the important lifecycles end to end.
- **Migration tests** — Atlas handles schema correctness. Trust the tool.
