package graph

import (
	"fmt"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
)

// mapTaxEstimateToModel converts service.TaxEstimate to model.TaxEstimate (GraphQL).
func mapTaxEstimateToModel(est *service.TaxEstimate) *model.TaxEstimate {
	if est == nil {
		return nil
	}
	return &model.TaxEstimate{
		TaxOwed:       est.TaxOwed.String(),
		TaxableIncome: est.TaxableIncome.String(),
		EffectiveRate: est.EffectiveRate.String(),
		MarginalRate:  est.MarginalRate.String(),
	}
}

// decimalFromString parses a string into a decimal.Decimal.
func decimalFromString(s string) (decimal.Decimal, error) {
	return decimal.Parse(s)
}

// pgNumericFromString parses a string into a pgtype.Numeric.
func pgNumericFromString(s string) (*pgtype.Numeric, error) {
	if s == "" {
		return nil, nil
	}
	var n pgtype.Numeric
	if err := n.Scan(s); err != nil {
		return nil, fmt.Errorf("parse numeric value: %w", err)
	}
	return &n, nil
}

// parseFilingStatus converts GraphQL model.FilingStatus to sqlc.FilingStatus.
func parseFilingStatus(s model.FilingStatus) sqlc.FilingStatus {
	return sqlc.FilingStatus(s)
}
