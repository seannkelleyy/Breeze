package service

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

func mkNumeric(s string) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(s)
	return n
}

func TestEstimateForYear_Basic(t *testing.T) {
	ctx := context.Background()
	// brackets: 0-10000 @10%, 10000-20000 @20%, 20000+ @30%
	b0 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("0.00"),
		MaximumAmount: mkNumeric("10000.00"),
		Rate:          decimal.MustParse("0.10"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}
	b1 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("10000.00"),
		MaximumAmount: mkNumeric("20000.00"),
		Rate:          decimal.MustParse("0.20"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}
	b2 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("20000.00"),
		MaximumAmount: pgtype.Numeric{},
		Rate:          decimal.MustParse("0.30"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}

	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{b0, b1, b2}, nil
		},
	}

	svc := NewTaxPlanningService(mock)

	income := decimal.MustParse("25000.00")
	deduction := pgtype.Numeric{}
	_ = deduction.Scan("2000.00")

	est, err := svc.EstimateForYear(ctx, 2025, sqlc.FilingStatusSINGLE, income, &deduction)
	assert.NoError(t, err)
	assert.NotNil(t, est)

	// taxable income: 25000 - 2000 = 23000
	expTaxable := decimal.MustParse("23000.00")
	assert.Equal(t, 0, est.TaxableIncome.Cmp(expTaxable))

	// compute expected tax: 10000*0.10 + 10000*0.20 + 3000*0.30 = 1000 + 2000 + 900 = 3900
	expTax := decimal.MustParse("3900.00")
	assert.Equal(t, 0, est.TaxOwed.Cmp(expTax))

	// marginal rate should be 30%
	expMarginal := decimal.MustParse("0.30")
	assert.Equal(t, 0, est.MarginalRate.Cmp(expMarginal))

	// effective rate = 3900 / 23000 = 0.1695652173913043478260869565... assert approximate by dividing
	eff, _ := expTax.Quo(expTaxable)
	assert.Equal(t, 0, est.EffectiveRate.Cmp(eff))
}

func TestEstimateForYear_ZeroIncome(t *testing.T) {
	ctx := context.Background()
	b0 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("0.00"),
		MaximumAmount: mkNumeric("10000.00"),
		Rate:          decimal.MustParse("0.10"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}

	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{b0}, nil
		},
	}

	svc := NewTaxPlanningService(mock)
	income := decimal.MustParse("0.00")
	deduction := pgtype.Numeric{}
	_ = deduction.Scan("0.00")

	est, err := svc.EstimateForYear(ctx, 2025, sqlc.FilingStatusSINGLE, income, &deduction)
	assert.NoError(t, err)
	assert.NotNil(t, est)

	assert.Equal(t, 0, est.TaxableIncome.Cmp(decimal.MustParse("0.00")))
	assert.Equal(t, 0, est.TaxOwed.Cmp(decimal.MustParse("0.00")))
	// effective rate should be 0 when income is 0
	assert.Equal(t, 0, est.EffectiveRate.Cmp(decimal.MustParse("0.00")))
}

func TestEstimateForYear_LargeDeduction(t *testing.T) {
	ctx := context.Background()
	b0 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("0.00"),
		MaximumAmount: mkNumeric("10000.00"),
		Rate:          decimal.MustParse("0.10"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}

	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{b0}, nil
		},
	}

	svc := NewTaxPlanningService(mock)
	income := decimal.MustParse("10000.00")
	deduction := pgtype.Numeric{}
	_ = deduction.Scan("15000.00") // Deduction exceeds income

	est, err := svc.EstimateForYear(ctx, 2025, sqlc.FilingStatusSINGLE, income, &deduction)
	assert.NoError(t, err)
	assert.NotNil(t, est)

	// taxable income should be clamped to 0
	assert.Equal(t, 0, est.TaxableIncome.Cmp(decimal.MustParse("0.00")))
	assert.Equal(t, 0, est.TaxOwed.Cmp(decimal.MustParse("0.00")))
}

func TestEstimateForYear_FirstBracketOnly(t *testing.T) {
	ctx := context.Background()
	b0 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("0.00"),
		MaximumAmount: mkNumeric("10000.00"),
		Rate:          decimal.MustParse("0.10"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}
	b1 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("10000.00"),
		MaximumAmount: mkNumeric("20000.00"),
		Rate:          decimal.MustParse("0.20"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}

	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{b0, b1}, nil
		},
	}

	svc := NewTaxPlanningService(mock)
	income := decimal.MustParse("5000.00")
	est, err := svc.EstimateForYear(ctx, 2025, sqlc.FilingStatusSINGLE, income, nil)
	assert.NoError(t, err)

	// tax = 5000 * 0.10 = 500
	assert.Equal(t, 0, est.TaxableIncome.Cmp(decimal.MustParse("5000.00")))
	assert.Equal(t, 0, est.TaxOwed.Cmp(decimal.MustParse("500.00")))
	assert.Equal(t, 0, est.MarginalRate.Cmp(decimal.MustParse("0.10")))
}

func TestEstimateForYear_NoDeduction(t *testing.T) {
	ctx := context.Background()
	b0 := sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: decimal.MustParse("0.00"),
		MaximumAmount: mkNumeric("10000.00"),
		Rate:          decimal.MustParse("0.15"),
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}

	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{b0}, nil
		},
	}

	svc := NewTaxPlanningService(mock)
	income := decimal.MustParse("8000.00")
	// nil deduction should be treated as 0
	est, err := svc.EstimateForYear(ctx, 2025, sqlc.FilingStatusSINGLE, income, nil)
	assert.NoError(t, err)

	assert.Equal(t, 0, est.TaxableIncome.Cmp(decimal.MustParse("8000.00")))
	assert.Equal(t, 0, est.TaxOwed.Cmp(decimal.MustParse("1200.00"))) // 8000 * 0.15
}
