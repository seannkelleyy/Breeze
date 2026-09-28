package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockPaycheckDeductionQuerier struct {
	upsertPaycheckDeductionFunc     func(context.Context, sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error)
	listByPersonIDFunc              func(context.Context, sqlc.ListPaycheckDeductionsByPersonIDParams) ([]sqlc.PaycheckDeduction, error)
	listByUserIDFunc                func(context.Context, uuid.UUID) ([]sqlc.PaycheckDeduction, error)
	softDeletePaycheckDeductionFunc func(context.Context, sqlc.SoftDeletePaycheckDeductionParams) (int64, error)
}

func (m *mockPaycheckDeductionQuerier) UpsertPaycheckDeduction(ctx context.Context, arg sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error) {
	if m.upsertPaycheckDeductionFunc != nil {
		return m.upsertPaycheckDeductionFunc(ctx, arg)
	}
	return sqlc.PaycheckDeduction{}, nil
}

func (m *mockPaycheckDeductionQuerier) ListPaycheckDeductionsByPersonID(ctx context.Context, arg sqlc.ListPaycheckDeductionsByPersonIDParams) ([]sqlc.PaycheckDeduction, error) {
	if m.listByPersonIDFunc != nil {
		return m.listByPersonIDFunc(ctx, arg)
	}
	return []sqlc.PaycheckDeduction{}, nil
}

func (m *mockPaycheckDeductionQuerier) ListPaycheckDeductionsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PaycheckDeduction, error) {
	if m.listByUserIDFunc != nil {
		return m.listByUserIDFunc(ctx, userID)
	}
	return []sqlc.PaycheckDeduction{}, nil
}

func (m *mockPaycheckDeductionQuerier) SoftDeletePaycheckDeduction(ctx context.Context, arg sqlc.SoftDeletePaycheckDeductionParams) (int64, error) {
	if m.softDeletePaycheckDeductionFunc != nil {
		return m.softDeletePaycheckDeductionFunc(ctx, arg)
	}
	return 0, nil
}

func testPaycheckDeductionRow() sqlc.PaycheckDeduction {
	ts := pgtype.Timestamptz{Time: time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC), Valid: true}
	linkedAccountID := uuid.New()

	return sqlc.PaycheckDeduction{
		ID:              uuid.New(),
		UserID:          uuid.New(),
		PersonID:        uuid.New(),
		Name:            "Health Insurance",
		Amount:          mustDecimal("250.00"),
		Pretax:          true,
		Kind:            "HEALTH",
		LinkedAccountID: pgtype.UUID{Bytes: linkedAccountID, Valid: true},
		CreatedAt:       ts,
		UpdatedAt:       ts,
	}
}

func TestPaycheckDeductionService_Upsert(t *testing.T) {
	ctx := context.Background()

	t.Run("defaults empty kind to OTHER", func(t *testing.T) {
		row := testPaycheckDeductionRow()
		var captured sqlc.UpsertPaycheckDeductionParams
		mock := &mockPaycheckDeductionQuerier{
			upsertPaycheckDeductionFunc: func(_ context.Context, arg sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error) {
				captured = arg
				return row, nil
			},
		}

		svc := NewPaycheckDeductionService(mock)
		_, err := svc.Upsert(ctx, &UpsertPaycheckDeductionInput{
			ID:       row.ID,
			UserID:   row.UserID,
			PersonID: row.PersonID,
			Name:     row.Name,
			Amount:   row.Amount,
			Pretax:   row.Pretax,
			Kind:     "",
		})
		require.NoError(t, err)
		assert.Equal(t, "OTHER", captured.Kind, "empty kind should default to OTHER")
		assert.Equal(t, row.UserID, captured.UserID)
		assert.Equal(t, row.PersonID, captured.PersonID)
	})

	t.Run("preserves explicit kind and maps output", func(t *testing.T) {
		row := testPaycheckDeductionRow()
		linkedAccountID := uuid.UUID(row.LinkedAccountID.Bytes)
		mock := &mockPaycheckDeductionQuerier{
			upsertPaycheckDeductionFunc: func(_ context.Context, arg sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error) {
				assert.Equal(t, "FSA", arg.Kind)
				assert.True(t, arg.LinkedAccountID.Valid)
				assert.Equal(t, linkedAccountID, uuid.UUID(arg.LinkedAccountID.Bytes))
				return row, nil
			},
		}

		svc := NewPaycheckDeductionService(mock)
		result, err := svc.Upsert(ctx, &UpsertPaycheckDeductionInput{
			ID:              row.ID,
			UserID:          row.UserID,
			PersonID:        row.PersonID,
			Name:            row.Name,
			Amount:          row.Amount,
			Pretax:          row.Pretax,
			Kind:            "FSA",
			LinkedAccountID: &linkedAccountID,
		})
		require.NoError(t, err)
		assert.Equal(t, row.ID, result.ID)
		assert.Equal(t, "Health Insurance", result.Name)
		assert.True(t, result.Amount.Equal(row.Amount))
		assert.True(t, result.Pretax)
		assert.Equal(t, "HEALTH", result.Kind)
		require.NotNil(t, result.LinkedAccountID)
		assert.Equal(t, linkedAccountID, *result.LinkedAccountID)
		assert.False(t, result.CreatedAt.IsZero())
		assert.False(t, result.UpdatedAt.IsZero())
	})

	t.Run("nil linked account maps to nil", func(t *testing.T) {
		row := testPaycheckDeductionRow()
		mock := &mockPaycheckDeductionQuerier{
			upsertPaycheckDeductionFunc: func(_ context.Context, arg sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error) {
				assert.False(t, arg.LinkedAccountID.Valid, "nil input should map to invalid pg uuid")
				row.LinkedAccountID = pgtype.UUID{}
				return row, nil
			},
		}

		svc := NewPaycheckDeductionService(mock)
		result, err := svc.Upsert(ctx, &UpsertPaycheckDeductionInput{
			ID:       row.ID,
			UserID:   row.UserID,
			PersonID: row.PersonID,
			Name:     row.Name,
			Amount:   row.Amount,
			Kind:     "OTHER",
		})
		require.NoError(t, err)
		assert.Nil(t, result.LinkedAccountID)
	})

	t.Run("person not found maps to ErrNotFound", func(t *testing.T) {
		mock := &mockPaycheckDeductionQuerier{
			upsertPaycheckDeductionFunc: func(_ context.Context, _ sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error) {
				return sqlc.PaycheckDeduction{}, pgx.ErrNoRows
			},
		}
		svc := NewPaycheckDeductionService(mock)
		_, err := svc.Upsert(ctx, &UpsertPaycheckDeductionInput{
			ID:       uuid.New(),
			UserID:   uuid.New(),
			PersonID: uuid.New(),
			Name:     "x",
			Amount:   mustDecimal("1.00"),
			Kind:     "OTHER",
		})
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("wraps other errors", func(t *testing.T) {
		mock := &mockPaycheckDeductionQuerier{
			upsertPaycheckDeductionFunc: func(_ context.Context, _ sqlc.UpsertPaycheckDeductionParams) (sqlc.PaycheckDeduction, error) {
				return sqlc.PaycheckDeduction{}, errors.New("boom")
			},
		}
		svc := NewPaycheckDeductionService(mock)
		_, err := svc.Upsert(ctx, &UpsertPaycheckDeductionInput{
			ID:       uuid.New(),
			UserID:   uuid.New(),
			PersonID: uuid.New(),
			Name:     "x",
			Amount:   mustDecimal("1.00"),
			Kind:     "OTHER",
		})
		assert.ErrorContains(t, err, "upsert paycheck deduction")
	})
}

func TestPaycheckDeductionService_ListByPersonID(t *testing.T) {
	ctx := context.Background()

	t.Run("scopes by user and person, maps rows", func(t *testing.T) {
		row := testPaycheckDeductionRow()
		var captured sqlc.ListPaycheckDeductionsByPersonIDParams
		mock := &mockPaycheckDeductionQuerier{
			listByPersonIDFunc: func(_ context.Context, arg sqlc.ListPaycheckDeductionsByPersonIDParams) ([]sqlc.PaycheckDeduction, error) {
				captured = arg
				return []sqlc.PaycheckDeduction{row}, nil
			},
		}

		svc := NewPaycheckDeductionService(mock)
		results, err := svc.ListByPersonID(ctx, row.UserID, row.PersonID)
		require.NoError(t, err)

		assert.Equal(t, row.UserID, captured.UserID)
		assert.Equal(t, row.PersonID, captured.PersonID)
		require.Len(t, results, 1)
		assert.Equal(t, row.ID, results[0].ID)
		assert.Equal(t, row.PersonID, results[0].PersonID)
		assert.Equal(t, "250.00", results[0].Amount.String())
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockPaycheckDeductionQuerier{
			listByPersonIDFunc: func(_ context.Context, _ sqlc.ListPaycheckDeductionsByPersonIDParams) ([]sqlc.PaycheckDeduction, error) {
				return nil, errors.New("boom")
			},
		}
		svc := NewPaycheckDeductionService(mock)
		_, err := svc.ListByPersonID(ctx, uuid.New(), uuid.New())
		assert.ErrorContains(t, err, "list paycheck deductions by person id")
	})
}

func TestPaycheckDeductionService_ListByUserID(t *testing.T) {
	ctx := context.Background()

	t.Run("returns all deductions for user", func(t *testing.T) {
		rows := []sqlc.PaycheckDeduction{testPaycheckDeductionRow(), testPaycheckDeductionRow()}
		var capturedUserID uuid.UUID
		mock := &mockPaycheckDeductionQuerier{
			listByUserIDFunc: func(_ context.Context, userID uuid.UUID) ([]sqlc.PaycheckDeduction, error) {
				capturedUserID = userID
				return rows, nil
			},
		}

		svc := NewPaycheckDeductionService(mock)
		results, err := svc.ListByUserID(ctx, rows[0].UserID)
		require.NoError(t, err)
		assert.Equal(t, rows[0].UserID, capturedUserID)
		require.Len(t, results, 2)
		for _, r := range results {
			assert.False(t, r.CreatedAt.IsZero())
		}
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockPaycheckDeductionQuerier{
			listByUserIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.PaycheckDeduction, error) {
				return nil, errors.New("boom")
			},
		}
		svc := NewPaycheckDeductionService(mock)
		_, err := svc.ListByUserID(ctx, uuid.New())
		assert.ErrorContains(t, err, "list paycheck deductions by user id")
	})
}

func TestPaycheckDeductionService_Delete(t *testing.T) {
	ctx := context.Background()

	t.Run("zero rows maps to ErrNotFound", func(t *testing.T) {
		mock := &mockPaycheckDeductionQuerier{
			softDeletePaycheckDeductionFunc: func(_ context.Context, _ sqlc.SoftDeletePaycheckDeductionParams) (int64, error) {
				return 0, nil
			},
		}
		svc := NewPaycheckDeductionService(mock)
		err := svc.Delete(ctx, uuid.New(), uuid.New())
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("success is scoped by user", func(t *testing.T) {
		userID, id := uuid.New(), uuid.New()
		var captured sqlc.SoftDeletePaycheckDeductionParams
		mock := &mockPaycheckDeductionQuerier{
			softDeletePaycheckDeductionFunc: func(_ context.Context, arg sqlc.SoftDeletePaycheckDeductionParams) (int64, error) {
				captured = arg
				return 1, nil
			},
		}
		svc := NewPaycheckDeductionService(mock)
		err := svc.Delete(ctx, userID, id)
		require.NoError(t, err)
		assert.Equal(t, id, captured.ID)
		assert.Equal(t, userID, captured.UserID)
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockPaycheckDeductionQuerier{
			softDeletePaycheckDeductionFunc: func(_ context.Context, _ sqlc.SoftDeletePaycheckDeductionParams) (int64, error) {
				return 0, errors.New("boom")
			},
		}
		svc := NewPaycheckDeductionService(mock)
		err := svc.Delete(ctx, uuid.New(), uuid.New())
		assert.ErrorContains(t, err, "delete paycheck deduction")
	})
}
