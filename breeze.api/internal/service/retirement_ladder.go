package service

import (
	"context"
	"fmt"

	"breeze.api/internal/db/sqlc"
	"github.com/govalues/decimal"
)

// LadderStep represents a single year in a retirement ladder withdrawal schedule.
type LadderStep struct {
	Year                   int
	Age                    int
	WithdrawalAmount       decimal.Decimal
	TaxableWithdrawal      decimal.Decimal
	EstimatedIncomeTax     decimal.Decimal
	EarlyWithdrawalPenalty decimal.Decimal // 10% if applicable
	NetWithdrawal          decimal.Decimal
	RemainingBalance       decimal.Decimal
	IsAccessible           bool // True if 5-year rule has passed
}

// RetirementLadderProjection represents a multi-year early retirement withdrawal strategy.
type RetirementLadderProjection struct {
	InitialBalance        decimal.Decimal
	AnnualExpenses        decimal.Decimal
	CurrentAge            int
	FirstWithdrawalAge    int
	IsRoth                bool
	ProjectedSteps        []LadderStep
	IsSustainable         bool
	ProjectedDepletionAge *int
}

type ladderTaxBracketQuerier interface {
	ListTaxBracketsByYearAndFilingStatus(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error)
}

// RetirementLadderService calculates early retirement ladder projections.
type RetirementLadderService struct {
	queries ladderTaxBracketQuerier
}

func NewRetirementLadderService(queries ladderTaxBracketQuerier) *RetirementLadderService {
	return &RetirementLadderService{queries: queries}
}

// CalculateLadderProjection computes a multi-year withdrawal schedule for early retirement access.
// - initialBalance: starting retirement account balance
// - annualExpenses: annual withdrawal target
// - currentAge: user's current age
// - firstWithdrawalAge: age when first ladder withdrawal occurs
// - isRoth: true if Roth IRA/401k (different rules for early access)
// - year: tax year for bracket calculation
// - filingStatus: filing status for tax calculations
// - yearsToProject: number of years to project (default 20)
func (s *RetirementLadderService) CalculateLadderProjection(
	ctx context.Context,
	initialBalance decimal.Decimal,
	annualExpenses decimal.Decimal,
	currentAge int,
	firstWithdrawalAge int,
	isRoth bool,
	year int32,
	filingStatus sqlc.FilingStatus,
	yearsToProject int,
) (*RetirementLadderProjection, error) {
	if yearsToProject < 1 {
		yearsToProject = 20
	}

	if annualExpenses.IsNeg() {
		return nil, fmt.Errorf("annual expenses must be non-negative")
	}

	if currentAge < 0 || firstWithdrawalAge < currentAge {
		return nil, fmt.Errorf("invalid ages: current=%d, first_withdrawal=%d", currentAge, firstWithdrawalAge)
	}

	// Fetch tax brackets for the first withdrawal year
	brackets, err := s.queries.ListTaxBracketsByYearAndFilingStatus(
		ctx,
		sqlc.ListTaxBracketsByYearAndFilingStatusParams{
			Year:         year,
			FilingStatus: filingStatus,
		},
	)
	if err != nil {
		return nil, fmt.Errorf("fetch tax brackets: %w", err)
	}

	zero := decimal.MustParse("0.00")
	currentBalance := initialBalance
	steps := []LadderStep{}
	var depletionAge *int

	for yearOffset := 0; yearOffset < yearsToProject; yearOffset++ {
		age := currentAge + yearOffset
		stepYear := int(year) + yearOffset
		yearsIntoLadder := age - firstWithdrawalAge

		// Check if withdrawal is accessible (for Roth, 5-year rule applies)
		isAccessible := !isRoth || yearsIntoLadder >= 5
		shouldWithdraw := age >= firstWithdrawalAge && isAccessible

		var withdrawalAmount, taxableWithdrawal, incomeTax, earlyPenalty, netWithdrawal decimal.Decimal

		if shouldWithdraw {
			withdrawalAmount = annualExpenses
			// Roth contributions are tax-free; conversions may have taxable gains
			if isRoth {
				taxableWithdrawal = zero
			} else {
				taxableWithdrawal = withdrawalAmount
			}

			// Calculate income tax on taxable withdrawal
			if !taxableWithdrawal.IsZero() {
				incomeTax, err = estimateTaxOnIncome(taxableWithdrawal, brackets)
				if err != nil {
					incomeTax = zero
				}
			}

			// Early withdrawal penalty (10% if under 59.5 and not Roth)
			if age < 59 && !isRoth {
				penaltyAmount, _ := withdrawalAmount.Mul(decimal.MustParse("0.10"))
				earlyPenalty = penaltyAmount
			}

			// Net withdrawal = amount - tax - penalty
			netWithdrawal = withdrawalAmount
			if !incomeTax.IsZero() {
				var temp decimal.Decimal
				temp, _ = netWithdrawal.Sub(incomeTax)
				netWithdrawal = temp
			}
			if !earlyPenalty.IsZero() {
				var temp decimal.Decimal
				temp, _ = netWithdrawal.Sub(earlyPenalty)
				netWithdrawal = temp
			}

			// Reduce balance by withdrawal
			var temp decimal.Decimal
			temp, _ = currentBalance.Sub(withdrawalAmount)
			currentBalance = temp
		}

		// Track depletion age
		if currentBalance.IsNeg() && depletionAge == nil {
			depletionAge = &age
		}
		// Also track depletion if balance is zero and we were trying to withdraw
		if currentBalance.IsZero() && shouldWithdraw && depletionAge == nil {
			depletionAge = &age
		}

		// Clamp balance to zero
		if currentBalance.IsNeg() {
			currentBalance = zero
		}

		step := LadderStep{
			Year:                   stepYear,
			Age:                    age,
			WithdrawalAmount:       withdrawalAmount,
			TaxableWithdrawal:      taxableWithdrawal,
			EstimatedIncomeTax:     incomeTax,
			EarlyWithdrawalPenalty: earlyPenalty,
			NetWithdrawal:          netWithdrawal,
			RemainingBalance:       currentBalance,
			IsAccessible:           isAccessible,
		}
		steps = append(steps, step)
	}

	isSustainable := depletionAge == nil && !currentBalance.IsZero()

	return &RetirementLadderProjection{
		InitialBalance:        initialBalance,
		AnnualExpenses:        annualExpenses,
		CurrentAge:            currentAge,
		FirstWithdrawalAge:    firstWithdrawalAge,
		IsRoth:                isRoth,
		ProjectedSteps:        steps,
		IsSustainable:         isSustainable,
		ProjectedDepletionAge: depletionAge,
	}, nil
}

// estimateTaxOnIncome calculates approximate income tax based on brackets.
func estimateTaxOnIncome(income decimal.Decimal, brackets []sqlc.TaxBracket) (decimal.Decimal, error) {
	if income.IsZero() || len(brackets) == 0 {
		return decimal.MustParse("0.00"), nil
	}

	totalTax := decimal.MustParse("0.00")
	currentIncome := decimal.MustParse("0.00")

	for _, bracket := range brackets {
		if currentIncome.Cmp(income) >= 0 {
			break
		}

		// Calculate taxable amount in this bracket
		upper := bracket.MaximumAmount
		var bracketMax decimal.Decimal
		if upper.Valid {
			raw, _ := upper.Value()
			if raw != nil {
				if text, ok := raw.(string); ok {
					bracketMax, _ = decimal.Parse(text)
				}
			}
		} else {
			// No upper limit; use income as the upper bound
			bracketMax = income
		}

		// Determine the taxable range in this bracket
		var taxableInBracket decimal.Decimal
		if currentIncome.Cmp(bracket.MinimumAmount) < 0 {
			currentIncome = bracket.MinimumAmount
		}
		if income.Cmp(bracketMax) <= 0 {
			taxableInBracket, _ = income.Sub(currentIncome)
		} else {
			taxableInBracket, _ = bracketMax.Sub(currentIncome)
		}

		if taxableInBracket.IsPos() {
			bracketTax, _ := taxableInBracket.Mul(bracket.Rate)
			var temp decimal.Decimal
			temp, _ = totalTax.Add(bracketTax)
			totalTax = temp
		}

		currentIncome = bracketMax
	}

	return totalTax, nil
}
