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

type mockContributionLimitQuerier struct {
	getByAccountTypeAndTaxYearFunc func(context.Context, sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error)
	listByTaxYearFunc              func(context.Context, int32) ([]sqlc.ContributionLimit, error)
}

func (m *mockContributionLimitQuerier) GetContributionLimitByAccountTypeAndTaxYear(ctx context.Context, arg sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
	if m.getByAccountTypeAndTaxYearFunc != nil {
		return m.getByAccountTypeAndTaxYearFunc(ctx, arg)
	}
	return sqlc.ContributionLimit{}, nil
}

func (m *mockContributionLimitQuerier) ListContributionLimitsByTaxYear(ctx context.Context, taxYear int32) ([]sqlc.ContributionLimit, error) {
	if m.listByTaxYearFunc != nil {
		return m.listByTaxYearFunc(ctx, taxYear)
	}
	return []sqlc.ContributionLimit{}, nil
}

func testContributionLimitRow(withFamilyLimit bool) sqlc.ContributionLimit {
	ts := pgtype.Timestamptz{Time: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), Valid: true}
	family := pgtype.Numeric{}
	if withFamilyLimit {
		familyAmount := mustDecimal("15000.00")
		family = pgtypeNumericFromDecimal(&familyAmount)
	}

	return sqlc.ContributionLimit{
		ID:                 uuid.New(),
		AccountType:        sqlc.RetirementAccountTypeACCOUNT401K,
		TaxYear:            2026,
		AnnualLimit:        mustDecimal("24000.00"),
		CatchUpAge:         50,
		CatchUpAmount:      mustDecimal("8000.00"),
		SuperCatchUpAmount: mustDecimal("11400.00"),
		FamilyAnnualLimit:  family,
		CreatedAt:          ts,
		UpdatedAt:          ts,
	}
}

func TestContributionLimitService_GetByAccountTypeAndYear(t *testing.T) {
	ctx := context.Background()

	t.Run("passes account type and year, maps row", func(t *testing.T) {
		row := testContributionLimitRow(true)
		var captured sqlc.GetContributionLimitByAccountTypeAndTaxYearParams
		mock := &mockContributionLimitQuerier{
			getByAccountTypeAndTaxYearFunc: func(_ context.Context, arg sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
				captured = arg
				return row, nil
			},
		}

		svc := NewContributionLimitService(mock)
		limit, err := svc.GetByAccountTypeAndYear(ctx, sqlc.RetirementAccountTypeACCOUNT401K, 2026)
		require.NoError(t, err)

		assert.Equal(t, sqlc.RetirementAccountTypeACCOUNT401K, captured.AccountType)
		assert.Equal(t, int32(2026), captured.TaxYear, "tax year should be passed as int32")
		assert.Equal(t, row.ID, limit.ID)
		assert.Equal(t, sqlc.RetirementAccountTypeACCOUNT401K, limit.AccountType)
		assert.Equal(t, 2026, limit.TaxYear)
		assert.True(t, limit.AnnualLimit.Equal(row.AnnualLimit))
		assert.Equal(t, 50, limit.CatchUpAge)
		assert.True(t, limit.CatchUpAmount.Equal(row.CatchUpAmount))
		assert.True(t, limit.SuperCatchUpAmount.Equal(row.SuperCatchUpAmount))
		require.NotNil(t, limit.FamilyAnnualLimit)
		assert.True(t, limit.FamilyAnnualLimit.Equal(mustDecimal("15000.00")))
		assert.False(t, limit.CreatedAt.IsZero())
	})

	t.Run("null family limit maps to nil", func(t *testing.T) {
		row := testContributionLimitRow(false)
		mock := &mockContributionLimitQuerier{
			getByAccountTypeAndTaxYearFunc: func(_ context.Context, _ sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
				return row, nil
			},
		}

		svc := NewContributionLimitService(mock)
		limit, err := svc.GetByAccountTypeAndYear(ctx, sqlc.RetirementAccountTypeROTHIRA, 2026)
		require.NoError(t, err)
		assert.Nil(t, limit.FamilyAnnualLimit, "non-family account types have no family limit")
	})

	t.Run("not found maps to ErrNotFound", func(t *testing.T) {
		mock := &mockContributionLimitQuerier{
			getByAccountTypeAndTaxYearFunc: func(_ context.Context, _ sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
				return sqlc.ContributionLimit{}, pgx.ErrNoRows
			},
		}
		svc := NewContributionLimitService(mock)
		_, err := svc.GetByAccountTypeAndYear(ctx, sqlc.RetirementAccountTypeACCOUNT401K, 1999)
		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("wraps other errors", func(t *testing.T) {
		mock := &mockContributionLimitQuerier{
			getByAccountTypeAndTaxYearFunc: func(_ context.Context, _ sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
				return sqlc.ContributionLimit{}, errors.New("boom")
			},
		}
		svc := NewContributionLimitService(mock)
		_, err := svc.GetByAccountTypeAndYear(ctx, sqlc.RetirementAccountTypeACCOUNT401K, 2026)
		assert.ErrorContains(t, err, "get contribution limit")
	})
}

func TestContributionLimitService_ListByTaxYear(t *testing.T) {
	ctx := context.Background()

	t.Run("returns all limits for a tax year", func(t *testing.T) {
		ira := testContributionLimitRow(false)
		ira.AccountType = sqlc.RetirementAccountTypeROTHIRA
		rows := []sqlc.ContributionLimit{testContributionLimitRow(true), ira}

		var capturedYear int32
		mock := &mockContributionLimitQuerier{
			listByTaxYearFunc: func(_ context.Context, taxYear int32) ([]sqlc.ContributionLimit, error) {
				capturedYear = taxYear
				return rows, nil
			},
		}

		svc := NewContributionLimitService(mock)
		limits, err := svc.ListByTaxYear(ctx, 2026)
		require.NoError(t, err)
		assert.Equal(t, int32(2026), capturedYear)
		require.Len(t, limits, 2)

		byType := make(map[sqlc.RetirementAccountType]ContributionLimit, len(limits))
		for _, l := range limits {
			byType[l.AccountType] = l
		}
		assert.Contains(t, byType, sqlc.RetirementAccountTypeACCOUNT401K)
		assert.Contains(t, byType, sqlc.RetirementAccountTypeROTHIRA)
		assert.Nil(t, byType[sqlc.RetirementAccountTypeROTHIRA].FamilyAnnualLimit)
	})

	t.Run("wraps query error", func(t *testing.T) {
		mock := &mockContributionLimitQuerier{
			listByTaxYearFunc: func(_ context.Context, _ int32) ([]sqlc.ContributionLimit, error) {
				return nil, errors.New("boom")
			},
		}
		svc := NewContributionLimitService(mock)
		_, err := svc.ListByTaxYear(ctx, 2026)
		assert.ErrorContains(t, err, "list contribution limits by tax year")
	})
}
