package graph

import (
	"context"
	"testing"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

// mockTaxBracketQuerier for resolver testing
type mockBracketQuerier struct {
	listFunc func(context.Context, sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error)
}

func (m *mockBracketQuerier) ListTaxBracketsByYearAndFilingStatus(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
	if m.listFunc != nil {
		return m.listFunc(ctx, arg)
	}
	return []sqlc.TaxBracket{}, nil
}

func (m *mockBracketQuerier) CreateTaxBracket(ctx context.Context, arg sqlc.CreateTaxBracketParams) (sqlc.TaxBracket, error) {
	panic("not implemented")
}
func (m *mockBracketQuerier) GetTaxBracketByID(ctx context.Context, id uuid.UUID) (sqlc.TaxBracket, error) {
	panic("not implemented")
}
func (m *mockBracketQuerier) UpdateTaxBracket(ctx context.Context, arg sqlc.UpdateTaxBracketParams) (sqlc.TaxBracket, error) {
	panic("not implemented")
}
func (m *mockBracketQuerier) SoftDeleteTaxBracket(ctx context.Context, id uuid.UUID) (int64, error) {
	panic("not implemented")
}

func TestQueryResolver_EstimateTaxesForYear(t *testing.T) {
	ctx := context.Background()

	// Create test tax brackets
	createBracket := func(min, max string, rate string) sqlc.TaxBracket {
		minDecimal := decimal.MustParse(min)
		maxNum := pgtype.Numeric{}
		_ = maxNum.Scan(max)

		return sqlc.TaxBracket{
			ID:            uuid.New(),
			Year:          2025,
			FilingStatus:  sqlc.FilingStatusSINGLE,
			MinimumAmount: minDecimal,
			MaximumAmount: maxNum,
			Rate:          decimal.MustParse(rate),
			CreatedAt:     pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
		}
	}

	brackets := []sqlc.TaxBracket{
		createBracket("0.00", "10000.00", "0.10"),
		createBracket("10000.00", "20000.00", "0.20"),
		createBracket("20000.00", "50000.00", "0.30"),
	}

	mock := &mockBracketQuerier{
		listFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return brackets, nil
		},
	}

	taxPlanningService := service.NewTaxPlanningService(mock)
	resolver := &Resolver{
		TaxPlanningService: taxPlanningService,
	}
	queryResolver := &queryResolver{Resolver: resolver}

	t.Run("estimates taxes with deduction", func(t *testing.T) {
		income := "45000.00"
		deduction := "5000.00"

		result, err := queryResolver.EstimateTaxesForYear(ctx, 2025, model.FilingStatusSingle, income, &deduction)

		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Verify the result structure
		assert.NotEmpty(t, result.TaxOwed)
		assert.NotEmpty(t, result.TaxableIncome)
		assert.NotEmpty(t, result.EffectiveRate)
		assert.NotEmpty(t, result.MarginalRate)

		// Verify calculations (decimal.String() includes trailing zeros)
		// Taxable income = 45000 - 5000 = 40000
		// Tax = 10000*0.10 + 10000*0.20 + 20000*0.30 = 1000 + 2000 + 6000 = 9000
		assert.Equal(t, "40000.00", result.TaxableIncome)
		assert.Equal(t, "9000.0000", result.TaxOwed)
	})

	t.Run("estimates taxes without deduction", func(t *testing.T) {
		income := "25000.00"

		result, err := queryResolver.EstimateTaxesForYear(ctx, 2025, model.FilingStatusSingle, income, nil)

		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Taxable income = 25000
		// Tax = 10000*0.10 + 10000*0.20 + 5000*0.30 = 1000 + 2000 + 1500 = 4500
		assert.Equal(t, "25000.00", result.TaxableIncome)
		assert.Equal(t, "4500.0000", result.TaxOwed)
	})

	t.Run("handles zero income", func(t *testing.T) {
		income := "0.00"

		result, err := queryResolver.EstimateTaxesForYear(ctx, 2025, model.FilingStatusSingle, income, nil)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "0.00", result.TaxableIncome)
		assert.Equal(t, "0.00", result.TaxOwed)
	})

	t.Run("parses invalid income", func(t *testing.T) {
		income := "not-a-number"

		result, err := queryResolver.EstimateTaxesForYear(ctx, 2025, model.FilingStatusSingle, income, nil)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "parse income")
	})

	t.Run("parses invalid deduction", func(t *testing.T) {
		income := "50000.00"
		deduction := "invalid"

		result, err := queryResolver.EstimateTaxesForYear(ctx, 2025, model.FilingStatusSingle, income, &deduction)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "parse deduction")
	})
}
