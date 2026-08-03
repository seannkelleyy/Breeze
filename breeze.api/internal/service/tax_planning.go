package service

import (
	"context"
	"fmt"

	"breeze.api/internal/db/sqlc"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
)

// TaxEstimate is a simple marginal tax estimate for a single year.
type TaxEstimate struct {
	TaxOwed       decimal.Decimal
	TaxableIncome decimal.Decimal
	EffectiveRate decimal.Decimal
	MarginalRate  decimal.Decimal
}

// TaxPlanningService computes tax estimates using tax_brackets.
type TaxPlanningService struct {
	queries taxBracketQuerier
}

func NewTaxPlanningService(queries taxBracketQuerier) *TaxPlanningService {
	return &TaxPlanningService{queries: queries}
}

// EstimateForYear returns a marginal tax estimate for the given inputs.
// - year: tax year to use for brackets
// - filingStatus: filing status for bracket lookup
// - income: gross income (use decimal for monetary precision)
// - deductionAmount: deduction to subtract from income (nil => 0)
func (s *TaxPlanningService) EstimateForYear(ctx context.Context, year int32, filingStatus sqlc.FilingStatus, income decimal.Decimal, deductionAmount *pgtype.Numeric) (*TaxEstimate, error) {
	if income.IsNeg() {
		return nil, fmt.Errorf("income must be non-negative")
	}

	// decode deduction amount
	var deduction decimal.Decimal
	if deductionAmount != nil && deductionAmount.Valid {
		raw, err := deductionAmount.Value()
		if err != nil {
			return nil, fmt.Errorf("decode deduction amount: %w", err)
		}
		if raw != nil {
			text, ok := raw.(string)
			if !ok {
				return nil, fmt.Errorf("unexpected deduction numeric type: %T", raw)
			}
			p, err := decimal.Parse(text)
			if err != nil {
				return nil, fmt.Errorf("parse deduction amount: %w", err)
			}
			deduction = p
		}
	}

	// taxable income = income - deduction, floored at 0
	taxableIncome := income
	if !deduction.IsZero() {
		var err error
		taxableIncome, err = taxableIncome.Sub(deduction)
		if err != nil {
			return nil, fmt.Errorf("subtract deduction: %w", err)
		}
		if taxableIncome.IsNeg() {
			taxableIncome = decimal.Zero
		}
	}

	// load brackets
	rows, err := s.queries.ListTaxBracketsByYearAndFilingStatus(ctx, sqlc.ListTaxBracketsByYearAndFilingStatusParams{
		Year:         year,
		FilingStatus: filingStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("list tax brackets: %w", err)
	}

	zero := decimal.MustParse("0.00")
	totalTax := zero
	marginalRate := zero

	// iterate through ordered brackets (SQL orders by minimum_amount ASC)
	for _, row := range rows {
		min := row.MinimumAmount
		// convert maximum (pgtype.Numeric) to *decimal.Decimal
		maxPtr, err := decimalFromPGNumeric(row.MaximumAmount)
		if err != nil {
			return nil, fmt.Errorf("decode bracket maximum: %w", err)
		}

		// if taxableIncome <= min, nothing in this bracket
		if taxableIncome.Cmp(min) <= 0 {
			continue
		}

		// determine upper bound for this bracket
		upper := taxableIncome
		if maxPtr != nil {
			if taxableIncome.Cmp(*maxPtr) > 0 {
				upper = *maxPtr
			}
		}

		// amount taxed in this bracket = upper - min
		amount, err := upper.Sub(min)
		if err != nil {
			return nil, fmt.Errorf("subtract bracket min: %w", err)
		}
		if amount.IsNeg() || amount.IsZero() {
			continue
		}

		taxForBracket, err := amount.Mul(row.Rate)
		if err != nil {
			return nil, fmt.Errorf("multiply bracket rate: %w", err)
		}
		totalTax, err = totalTax.Add(taxForBracket)
		if err != nil {
			return nil, fmt.Errorf("accumulate tax: %w", err)
		}

		// marginal rate is the rate of the highest bracket that contains taxableIncome
		if taxableIncome.Cmp(upper) <= 0 {
			marginalRate = row.Rate
			break
		}
		// otherwise continue to next bracket; if no bracket caps taxableIncome, last bracket's rate will apply
		marginalRate = row.Rate
	}

	effectiveRate := zero
	if !taxableIncome.IsZero() {
		var err error
		effectiveRate, err = totalTax.Quo(taxableIncome)
		if err != nil {
			return nil, fmt.Errorf("compute effective rate: %w", err)
		}
	}

	return &TaxEstimate{
		TaxOwed:       totalTax,
		TaxableIncome: taxableIncome,
		EffectiveRate: effectiveRate,
		MarginalRate:  marginalRate,
	}, nil
}
