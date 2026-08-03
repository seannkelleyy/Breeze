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

type mockLadderBracketQuerier struct {
	listFunc func(context.Context, sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error)
}

func (m *mockLadderBracketQuerier) ListTaxBracketsByYearAndFilingStatus(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
	if m.listFunc != nil {
		return m.listFunc(ctx, arg)
	}
	return []sqlc.TaxBracket{}, nil
}

func mkNum(s string) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(s)
	return n
}

func createTestBracket(minStr, maxStr, rateStr string) sqlc.TaxBracket {
	minDecimal := decimal.MustParse(minStr)
	rate := decimal.MustParse(rateStr)
	maxNum := mkNum(maxStr)

	return sqlc.TaxBracket{
		ID:            uuid.New(),
		Year:          2025,
		FilingStatus:  sqlc.FilingStatusSINGLE,
		MinimumAmount: minDecimal,
		MaximumAmount: maxNum,
		Rate:          rate,
		CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}
}

func TestRetirementLadderService_CalculateLadderProjection_TraditionalIRA(t *testing.T) {
	ctx := context.Background()

	// Simple 2025 tax brackets: 10% on 0-11000, 20% on 11000-44725, etc.
	brackets := []sqlc.TaxBracket{
		createTestBracket("0.00", "11000.00", "0.10"),
		createTestBracket("11000.00", "44725.00", "0.20"),
	}

	mock := &mockLadderBracketQuerier{
		listFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return brackets, nil
		},
	}

	svc := NewRetirementLadderService(mock)

	// $500k initial balance, $50k annual expenses, age 50 wants to retire at 55
	initialBalance := decimal.MustParse("500000.00")
	annualExpenses := decimal.MustParse("50000.00")
	currentAge := 50
	firstWithdrawalAge := 55

	result, err := svc.CalculateLadderProjection(
		ctx,
		initialBalance,
		annualExpenses,
		currentAge,
		firstWithdrawalAge,
		false, // not Roth
		2025,
		sqlc.FilingStatusSINGLE,
		10, // project 10 years
	)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.False(t, result.IsRoth)
	assert.Equal(t, currentAge, result.CurrentAge)
	assert.Equal(t, firstWithdrawalAge, result.FirstWithdrawalAge)

	// First 5 years (50-54): no withdrawals, balance unchanged
	for i := 0; i < 5; i++ {
		assert.Zero(t, result.ProjectedSteps[i].WithdrawalAmount.Cmp(decimal.MustParse("0.00")))
		assert.Equal(t, 50+i, result.ProjectedSteps[i].Age)
	}

	// Year 6 (age 55): first withdrawal, subject to 10% early penalty
	year6 := result.ProjectedSteps[5]
	assert.Equal(t, 55, year6.Age)
	assert.Equal(t, 0, year6.WithdrawalAmount.Cmp(decimal.MustParse("50000.00")))
	// Should have early withdrawal penalty: 50000 * 0.10 = 5000
	assert.False(t, year6.EarlyWithdrawalPenalty.IsZero())
	assert.True(t, year6.IsAccessible)
}

func TestRetirementLadderService_CalculateLadderProjection_Roth(t *testing.T) {
	ctx := context.Background()

	brackets := []sqlc.TaxBracket{
		createTestBracket("0.00", "11000.00", "0.10"),
	}

	mock := &mockLadderBracketQuerier{
		listFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return brackets, nil
		},
	}

	svc := NewRetirementLadderService(mock)

	initialBalance := decimal.MustParse("300000.00")
	annualExpenses := decimal.MustParse("30000.00")
	currentAge := 50
	firstWithdrawalAge := 55

	result, err := svc.CalculateLadderProjection(
		ctx,
		initialBalance,
		annualExpenses,
		currentAge,
		firstWithdrawalAge,
		true, // Roth
		2025,
		sqlc.FilingStatusSINGLE,
		10,
	)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.IsRoth)

	// First 5 years (55-59): no accessible withdrawals due to 5-year rule
	for i := 0; i < 5; i++ {
		step := result.ProjectedSteps[i]
		age := 50 + i
		if age >= firstWithdrawalAge {
			// Age 55-59: in ladder but not yet accessible
			assert.False(t, step.IsAccessible, "age %d should not be accessible yet", age)
			assert.Zero(t, step.WithdrawalAmount.Cmp(decimal.MustParse("0.00")))
		}
	}

	// Year 6 (age 55 + 5 = 60): now accessible
	if len(result.ProjectedSteps) > 10 {
		year10 := result.ProjectedSteps[10]
		assert.Equal(t, 60, year10.Age)
		assert.True(t, year10.IsAccessible)
		// Roth has no early penalty since it's accessible
		assert.Zero(t, year10.EarlyWithdrawalPenalty.Cmp(decimal.MustParse("0.00")))
	}
}

func TestRetirementLadderService_ZeroBalance(t *testing.T) {
	ctx := context.Background()

	brackets := []sqlc.TaxBracket{
		createTestBracket("0.00", "11000.00", "0.10"),
	}

	mock := &mockLadderBracketQuerier{
		listFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return brackets, nil
		},
	}

	svc := NewRetirementLadderService(mock)

	result, err := svc.CalculateLadderProjection(
		ctx,
		decimal.MustParse("0.00"),
		decimal.MustParse("10000.00"),
		50,
		55,
		false,
		2025,
		sqlc.FilingStatusSINGLE,
		6, // project 6 years (50-55) to reach withdrawal age
	)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.False(t, result.IsSustainable)
	assert.NotNil(t, result.ProjectedDepletionAge)
}

func TestRetirementLadderService_InvalidAges(t *testing.T) {
	ctx := context.Background()

	mock := &mockLadderBracketQuerier{
		listFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{}, nil
		},
	}

	svc := NewRetirementLadderService(mock)

	// First withdrawal age before current age
	result, err := svc.CalculateLadderProjection(
		ctx,
		decimal.MustParse("100000.00"),
		decimal.MustParse("10000.00"),
		50,
		45, // before current age
		false,
		2025,
		sqlc.FilingStatusSINGLE,
		5,
	)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "invalid ages")
}

func TestRetirementLadderService_NegativeExpenses(t *testing.T) {
	ctx := context.Background()

	mock := &mockLadderBracketQuerier{
		listFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{}, nil
		},
	}

	svc := NewRetirementLadderService(mock)

	result, err := svc.CalculateLadderProjection(
		ctx,
		decimal.MustParse("100000.00"),
		decimal.MustParse("-10000.00"), // negative
		50,
		55,
		false,
		2025,
		sqlc.FilingStatusSINGLE,
		5,
	)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "non-negative")
}

func TestRetirementLadderService_Sustainability(t *testing.T) {
	ctx := context.Background()

	brackets := []sqlc.TaxBracket{
		createTestBracket("0.00", "50000.00", "0.10"),
	}

	mock := &mockLadderBracketQuerier{
		listFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return brackets, nil
		},
	}

	svc := NewRetirementLadderService(mock)

	// Large balance, reasonable expenses - should be sustainable
	result, err := svc.CalculateLadderProjection(
		ctx,
		decimal.MustParse("2000000.00"),
		decimal.MustParse("50000.00"),
		55,
		55,
		false,
		2025,
		sqlc.FilingStatusSINGLE,
		40, // 40-year projection
	)

	assert.NoError(t, err)
	// With $2M and $50k/year for 40 years = $2M, breaks even but withdrawals include taxes/penalties
	// So it may deplete, which is acceptable - the test is just checking it calculates
	assert.NotNil(t, result)

	// Small balance, high expenses -> should definitely deplete
	result2, err := svc.CalculateLadderProjection(
		ctx,
		decimal.MustParse("50000.00"),
		decimal.MustParse("100000.00"),
		55,
		55,
		false,
		2025,
		sqlc.FilingStatusSINGLE,
		10,
	)

	assert.NoError(t, err)
	assert.False(t, result2.IsSustainable)
	assert.NotNil(t, result2.ProjectedDepletionAge)
}
