package service

import (
	"context"
	"fmt"

	"breeze.api/internal/db/sqlc"
	"github.com/govalues/decimal"
)

// TaxYearData bundles everything a client needs to compute taxes for one
// tax year and filing status: brackets, standard deduction, and FICA wage base.
type TaxYearData struct {
	Year              int32
	Brackets          []TaxBracket
	StandardDeduction decimal.Decimal
	SSWageBase        decimal.Decimal
}

type taxYearQuerier interface {
	GetLatestTaxYear(ctx context.Context) (int32, error)
	ListTaxBracketsByYearAndFilingStatus(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error)
	ListStandardDeductionsByYear(ctx context.Context, year int32) ([]sqlc.StandardDeduction, error)
	GetFicaParametersByYear(ctx context.Context, year int32) (sqlc.FicaParameter, error)
}

// TaxYearService resolves the effective tax tables for a given year and
// filing status. A nil year means "latest year with bracket data".
type TaxYearService struct {
	queries taxYearQuerier
}

func NewTaxYearService(queries taxYearQuerier) *TaxYearService {
	return &TaxYearService{queries: queries}
}

func (s *TaxYearService) GetTaxYearData(ctx context.Context, year *int32, filingStatus sqlc.FilingStatus) (*TaxYearData, error) {
	resolvedYear, err := s.resolveYear(ctx, year)
	if err != nil {
		return nil, err
	}

	brackets, err := s.listBrackets(ctx, resolvedYear, filingStatus)
	if err != nil {
		return nil, err
	}

	deduction, err := s.standardDeduction(ctx, resolvedYear, filingStatus)
	if err != nil {
		return nil, err
	}

	wageBase, err := s.ssWageBase(ctx, resolvedYear)
	if err != nil {
		return nil, err
	}

	return &TaxYearData{
		Year:              resolvedYear,
		Brackets:          brackets,
		StandardDeduction: deduction,
		SSWageBase:        wageBase,
	}, nil
}

func (s *TaxYearService) resolveYear(ctx context.Context, year *int32) (int32, error) {
	if year != nil {
		return *year, nil
	}
	latest, err := s.queries.GetLatestTaxYear(ctx)
	if err != nil {
		return 0, fmt.Errorf("resolve latest tax year: %w", err)
	}
	return latest, nil
}

func (s *TaxYearService) listBrackets(ctx context.Context, year int32, filingStatus sqlc.FilingStatus) ([]TaxBracket, error) {
	rows, err := s.queries.ListTaxBracketsByYearAndFilingStatus(ctx, sqlc.ListTaxBracketsByYearAndFilingStatusParams{
		Year:         year,
		FilingStatus: filingStatus,
	})
	if err != nil {
		return nil, fmt.Errorf("list tax brackets: %w", err)
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("no tax brackets for year %d and filing status %s", year, filingStatus)
	}

	brackets := make([]TaxBracket, 0, len(rows))
	for i := range rows {
		bracket, err := mapTaxBracketRecord(rows[i])
		if err != nil {
			return nil, fmt.Errorf("map tax bracket: %w", err)
		}
		brackets = append(brackets, *bracket)
	}
	return brackets, nil
}

func (s *TaxYearService) standardDeduction(ctx context.Context, year int32, filingStatus sqlc.FilingStatus) (decimal.Decimal, error) {
	rows, err := s.queries.ListStandardDeductionsByYear(ctx, year)
	if err != nil {
		return decimal.Decimal{}, fmt.Errorf("list standard deductions: %w", err)
	}
	for _, row := range rows {
		if row.FilingStatus == filingStatus {
			return row.Amount, nil
		}
	}
	return decimal.Decimal{}, fmt.Errorf("no standard deduction for year %d and filing status %s", year, filingStatus)
}

func (s *TaxYearService) ssWageBase(ctx context.Context, year int32) (decimal.Decimal, error) {
	params, err := s.queries.GetFicaParametersByYear(ctx, year)
	if err != nil {
		return decimal.Decimal{}, fmt.Errorf("get fica parameters: %w", err)
	}
	return params.SsWageBase, nil
}
