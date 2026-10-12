package service

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockRetirementAccessQuerier struct {
	createHsaReceiptFunc            func(context.Context, sqlc.CreateHsaReceiptParams) (sqlc.HsaReceipt, error)
	listHsaReceiptsByUserIDFunc     func(context.Context, uuid.UUID) ([]sqlc.HsaReceipt, error)
	softDeleteHsaReceiptFunc        func(context.Context, sqlc.SoftDeleteHsaReceiptParams) (int64, error)
	createHsaReimbursementFunc      func(context.Context, sqlc.CreateHsaReimbursementParams) (sqlc.HsaReimbursement, error)
	listHsaReimbursementsByUserIDF  func(context.Context, uuid.UUID) ([]sqlc.HsaReimbursement, error)
	softDeleteHsaReimbursementFunc  func(context.Context, sqlc.SoftDeleteHsaReimbursementParams) (int64, error)
	createRothConversionFunc        func(context.Context, sqlc.CreateRothConversionParams) (sqlc.RothConversion, error)
	listRothConversionsByUserIDFunc func(context.Context, uuid.UUID) ([]sqlc.RothConversion, error)
	softDeleteRothConversionFunc    func(context.Context, sqlc.SoftDeleteRothConversionParams) (int64, error)
}

func (m *mockRetirementAccessQuerier) CreateHsaReceipt(ctx context.Context, arg sqlc.CreateHsaReceiptParams) (sqlc.HsaReceipt, error) {
	if m.createHsaReceiptFunc != nil {
		return m.createHsaReceiptFunc(ctx, arg)
	}
	return sqlc.HsaReceipt{}, nil
}

func (m *mockRetirementAccessQuerier) ListHsaReceiptsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.HsaReceipt, error) {
	if m.listHsaReceiptsByUserIDFunc != nil {
		return m.listHsaReceiptsByUserIDFunc(ctx, userID)
	}
	return []sqlc.HsaReceipt{}, nil
}

func (m *mockRetirementAccessQuerier) SoftDeleteHsaReceipt(ctx context.Context, arg sqlc.SoftDeleteHsaReceiptParams) (int64, error) {
	if m.softDeleteHsaReceiptFunc != nil {
		return m.softDeleteHsaReceiptFunc(ctx, arg)
	}
	return 1, nil
}

func (m *mockRetirementAccessQuerier) CreateHsaReimbursement(ctx context.Context, arg sqlc.CreateHsaReimbursementParams) (sqlc.HsaReimbursement, error) {
	if m.createHsaReimbursementFunc != nil {
		return m.createHsaReimbursementFunc(ctx, arg)
	}
	return sqlc.HsaReimbursement{}, nil
}

func (m *mockRetirementAccessQuerier) ListHsaReimbursementsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.HsaReimbursement, error) {
	if m.listHsaReimbursementsByUserIDF != nil {
		return m.listHsaReimbursementsByUserIDF(ctx, userID)
	}
	return []sqlc.HsaReimbursement{}, nil
}

func (m *mockRetirementAccessQuerier) SoftDeleteHsaReimbursement(ctx context.Context, arg sqlc.SoftDeleteHsaReimbursementParams) (int64, error) {
	if m.softDeleteHsaReimbursementFunc != nil {
		return m.softDeleteHsaReimbursementFunc(ctx, arg)
	}
	return 1, nil
}

func (m *mockRetirementAccessQuerier) CreateRothConversion(ctx context.Context, arg sqlc.CreateRothConversionParams) (sqlc.RothConversion, error) {
	if m.createRothConversionFunc != nil {
		return m.createRothConversionFunc(ctx, arg)
	}
	return sqlc.RothConversion{}, nil
}

func (m *mockRetirementAccessQuerier) ListRothConversionsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.RothConversion, error) {
	if m.listRothConversionsByUserIDFunc != nil {
		return m.listRothConversionsByUserIDFunc(ctx, userID)
	}
	return []sqlc.RothConversion{}, nil
}

func (m *mockRetirementAccessQuerier) SoftDeleteRothConversion(ctx context.Context, arg sqlc.SoftDeleteRothConversionParams) (int64, error) {
	if m.softDeleteRothConversionFunc != nil {
		return m.softDeleteRothConversionFunc(ctx, arg)
	}
	return 1, nil
}

func hsaReceiptRow(t *testing.T, amount string, incurredOn time.Time) sqlc.HsaReceipt {
	t.Helper()
	return sqlc.HsaReceipt{
		ID:          uuid.New(),
		UserID:      uuid.New(),
		IncurredOn:  pgtype.Date{Time: incurredOn, Valid: true},
		Description: "dental",
		Amount:      mustDecimal(amount),
		CreatedAt:   pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
		UpdatedAt:   pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}
}

func TestRetirementAccessService_CreateReceipt(t *testing.T) {
	userID := uuid.New()
	incurredOn := time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC)

	var captured sqlc.CreateHsaReceiptParams
	queries := &mockRetirementAccessQuerier{
		createHsaReceiptFunc: func(_ context.Context, arg sqlc.CreateHsaReceiptParams) (sqlc.HsaReceipt, error) {
			captured = arg
			row := hsaReceiptRow(t, "500.00", incurredOn)
			row.UserID = arg.UserID
			return row, nil
		},
	}
	service := NewRetirementAccessService(queries)

	receipt, err := service.CreateReceipt(context.Background(), &CreateHsaReceiptInput{
		UserID:      userID,
		IncurredOn:  incurredOn,
		Description: "dental",
		Amount:      mustDecimal("500.00"),
	})
	require.NoError(t, err)

	assert.Equal(t, userID, captured.UserID)
	assert.Equal(t, "dental", captured.Description)
	assert.True(t, captured.IncurredOn.Valid)
	assert.Equal(t, incurredOn, captured.IncurredOn.Time)
	require.Zero(t, receipt.Amount.Cmp(mustDecimal("500")))
	assert.Equal(t, userID, receipt.UserID)
}

func TestRetirementAccessService_CreateReceipt_RejectsNonPositive(t *testing.T) {
	service := NewRetirementAccessService(&mockRetirementAccessQuerier{})

	for _, amount := range []string{"0", "-10.00"} {
		_, err := service.CreateReceipt(context.Background(), &CreateHsaReceiptInput{
			UserID:      uuid.New(),
			IncurredOn:  time.Now().UTC(),
			Description: "x",
			Amount:      mustDecimal(amount),
		})
		require.Error(t, err)
	}
}

func TestRetirementAccessService_CreateReimbursement_RejectsOverBalance(t *testing.T) {
	userID := uuid.New()
	queries := &mockRetirementAccessQuerier{
		listHsaReceiptsByUserIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.HsaReceipt, error) {
			return []sqlc.HsaReceipt{
				hsaReceiptRow(t, "300.00", time.Date(2024, 1, 10, 0, 0, 0, 0, time.UTC)),
			}, nil
		},
	}
	service := NewRetirementAccessService(queries)

	_, err := service.CreateReimbursement(context.Background(), &CreateHsaReimbursementInput{
		UserID:       userID,
		ReimbursedOn: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
		Amount:       mustDecimal("300.01"),
	})
	require.ErrorIs(t, err, ErrInsufficientHsaBalance)
}

func TestRetirementAccessService_CreateReimbursement_ExactBalanceAllowed(t *testing.T) {
	userID := uuid.New()
	var captured sqlc.CreateHsaReimbursementParams
	queries := &mockRetirementAccessQuerier{
		listHsaReceiptsByUserIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.HsaReceipt, error) {
			return []sqlc.HsaReceipt{
				hsaReceiptRow(t, "300.00", time.Date(2024, 1, 10, 0, 0, 0, 0, time.UTC)),
			}, nil
		},
		listHsaReimbursementsByUserIDF: func(_ context.Context, _ uuid.UUID) ([]sqlc.HsaReimbursement, error) {
			return []sqlc.HsaReimbursement{}, nil
		},
		createHsaReimbursementFunc: func(_ context.Context, arg sqlc.CreateHsaReimbursementParams) (sqlc.HsaReimbursement, error) {
			captured = arg
			return sqlc.HsaReimbursement{
				ID:           uuid.New(),
				UserID:       arg.UserID,
				ReimbursedOn: arg.ReimbursedOn,
				Amount:       arg.Amount,
				Note:         arg.Note,
				CreatedAt:    pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
				UpdatedAt:    pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
			}, nil
		},
	}
	service := NewRetirementAccessService(queries)

	reimbursement, err := service.CreateReimbursement(context.Background(), &CreateHsaReimbursementInput{
		UserID:       userID,
		ReimbursedOn: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
		Amount:       mustDecimal("300.00"),
		Note:         "ortho",
	})
	require.NoError(t, err)

	assert.Equal(t, userID, captured.UserID)
	assert.Equal(t, "ortho", captured.Note)
	require.Zero(t, reimbursement.Amount.Cmp(mustDecimal("300")))
}

func TestRetirementAccessService_CreateReimbursement_NetOfExisting(t *testing.T) {
	userID := uuid.New()
	queries := &mockRetirementAccessQuerier{
		listHsaReceiptsByUserIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.HsaReceipt, error) {
			return []sqlc.HsaReceipt{
				hsaReceiptRow(t, "500.00", time.Date(2024, 1, 10, 0, 0, 0, 0, time.UTC)),
			}, nil
		},
		listHsaReimbursementsByUserIDF: func(_ context.Context, _ uuid.UUID) ([]sqlc.HsaReimbursement, error) {
			return []sqlc.HsaReimbursement{
				{
					Amount: mustDecimal("200.00"),
				},
			}, nil
		},
	}
	service := NewRetirementAccessService(queries)

	// 500 receipts - 200 reimbursed = 300 available; 300.50 must fail.
	_, err := service.CreateReimbursement(context.Background(), &CreateHsaReimbursementInput{
		UserID:       userID,
		ReimbursedOn: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
		Amount:       mustDecimal("300.50"),
	})
	require.ErrorIs(t, err, ErrInsufficientHsaBalance)
}

func TestRetirementAccessService_Delete_NotFound(t *testing.T) {
	queries := &mockRetirementAccessQuerier{
		softDeleteHsaReceiptFunc:       func(_ context.Context, _ sqlc.SoftDeleteHsaReceiptParams) (int64, error) { return 0, nil },
		softDeleteHsaReimbursementFunc: func(_ context.Context, _ sqlc.SoftDeleteHsaReimbursementParams) (int64, error) { return 0, nil },
		softDeleteRothConversionFunc:   func(_ context.Context, _ sqlc.SoftDeleteRothConversionParams) (int64, error) { return 0, nil },
	}
	service := NewRetirementAccessService(queries)

	require.ErrorIs(t, service.DeleteReceipt(context.Background(), uuid.New(), uuid.New()), ErrNotFound)
	require.ErrorIs(t, service.DeleteReimbursement(context.Background(), uuid.New(), uuid.New()), ErrNotFound)
	require.ErrorIs(t, service.DeleteConversion(context.Background(), uuid.New(), uuid.New()), ErrNotFound)
}

func TestRetirementAccessService_Access(t *testing.T) {
	userID := uuid.New()
	queries := &mockRetirementAccessQuerier{
		listHsaReceiptsByUserIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.HsaReceipt, error) {
			return []sqlc.HsaReceipt{
				hsaReceiptRow(t, "100.00", time.Date(2023, 5, 1, 0, 0, 0, 0, time.UTC)),
				hsaReceiptRow(t, "250.00", time.Date(2024, 8, 12, 0, 0, 0, 0, time.UTC)),
			}, nil
		},
		listHsaReimbursementsByUserIDF: func(_ context.Context, _ uuid.UUID) ([]sqlc.HsaReimbursement, error) {
			return []sqlc.HsaReimbursement{
				{
					ID:           uuid.New(),
					UserID:       userID,
					ReimbursedOn: pgtype.Date{Time: time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC), Valid: true},
					Amount:       mustDecimal("150.00"),
				},
			}, nil
		},
		listRothConversionsByUserIDFunc: func(_ context.Context, _ uuid.UUID) ([]sqlc.RothConversion, error) {
			return []sqlc.RothConversion{
				{
					ID:          uuid.New(),
					UserID:      userID,
					ConvertedOn: pgtype.Date{Time: time.Date(2019, 6, 1, 0, 0, 0, 0, time.UTC), Valid: true},
					Amount:      mustDecimal("1000.00"),
				},
				{
					ID:          uuid.New(),
					UserID:      userID,
					ConvertedOn: pgtype.Date{Time: time.Date(2019, 11, 20, 0, 0, 0, 0, time.UTC), Valid: true},
					Amount:      mustDecimal("500.00"),
				},
				{
					ID:          uuid.New(),
					UserID:      userID,
					ConvertedOn: pgtype.Date{Time: time.Date(2099, 1, 15, 0, 0, 0, 0, time.UTC), Valid: true},
					Amount:      mustDecimal("700.00"),
				},
			}, nil
		},
	}
	service := NewRetirementAccessService(queries)

	access, err := service.Access(context.Background(), userID)
	require.NoError(t, err)

	assert.Len(t, access.HsaReceipts, 2)
	assert.Len(t, access.HsaReimbursements, 1)
	require.Zero(t, access.HsaSummary.TotalReceipts.Cmp(mustDecimal("350")))
	require.Zero(t, access.HsaSummary.TotalReimbursed.Cmp(mustDecimal("150")))
	require.Zero(t, access.HsaSummary.AvailableToReimburse.Cmp(mustDecimal("200")))

	require.Len(t, access.RothBuckets, 2)

	// 2019 bucket: both conversions grouped, clock ran out Jan 1 2024.
	past := access.RothBuckets[0]
	assert.Equal(t, 2019, past.Year)
	require.Zero(t, past.Amount.Cmp(mustDecimal("1500")))
	assert.Equal(t, time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC), past.AvailableOn)
	assert.True(t, past.Accessible)

	// 2099 bucket: far future, still locked.
	future := access.RothBuckets[1]
	assert.Equal(t, 2099, future.Year)
	require.Zero(t, future.Amount.Cmp(mustDecimal("700")))
	assert.Equal(t, time.Date(2104, time.January, 1, 0, 0, 0, 0, time.UTC), future.AvailableOn)
	assert.False(t, future.Accessible)
}

func TestRetirementAccessService_CreateConversion_AssetLinks(t *testing.T) {
	userID := uuid.New()
	fromID := uuid.New()
	toID := uuid.New()

	var captured sqlc.CreateRothConversionParams
	queries := &mockRetirementAccessQuerier{
		createRothConversionFunc: func(_ context.Context, arg sqlc.CreateRothConversionParams) (sqlc.RothConversion, error) {
			captured = arg
			return sqlc.RothConversion{
				ID:          uuid.New(),
				UserID:      arg.UserID,
				ConvertedOn: arg.ConvertedOn,
				Amount:      arg.Amount,
				FromAssetID: arg.FromAssetID,
				ToAssetID:   arg.ToAssetID,
				Note:        arg.Note,
				CreatedAt:   pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
				UpdatedAt:   pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
			}, nil
		},
	}
	service := NewRetirementAccessService(queries)

	conversion, err := service.CreateConversion(context.Background(), &CreateRothConversionInput{
		UserID:      userID,
		ConvertedOn: time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC),
		Amount:      mustDecimal("12000.00"),
		FromAssetID: &fromID,
		ToAssetID:   &toID,
		Note:        "ladder step",
	})
	require.NoError(t, err)

	require.NotNil(t, captured.FromAssetID)
	require.NotNil(t, captured.ToAssetID)
	assert.Equal(t, fromID, uuid.UUID(captured.FromAssetID.Bytes))
	assert.Equal(t, toID, uuid.UUID(captured.ToAssetID.Bytes))
	assert.Equal(t, "ladder step", captured.Note)
	require.Zero(t, conversion.Amount.Cmp(mustDecimal("12000")))

	_, err = service.CreateConversion(context.Background(), &CreateRothConversionInput{
		UserID:      userID,
		ConvertedOn: time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC),
		Amount:      mustDecimal("-1"),
	})
	require.Error(t, err)
}
