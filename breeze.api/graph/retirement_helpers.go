package graph

import (
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/govalues/decimal"
)

func decimalPtrToString(value *decimal.Decimal) *string {
	if value == nil {
		return nil
	}
	s := value.String()
	return &s
}

func mapContributionLimitToModel(limit *service.ContributionLimit) *model.ContributionLimit {
	return &model.ContributionLimit{
		ID:                limit.ID.String(),
		AccountType:       model.RetirementAccountType(limit.AccountType),
		TaxYear:           limit.TaxYear,
		AnnualLimit:       limit.AnnualLimit.String(),
		CatchUpAge:        limit.CatchUpAge,
		CatchUpAmount:     limit.CatchUpAmount.String(),
		FamilyAnnualLimit: decimalPtrToString(limit.FamilyAnnualLimit),
		CreatedAt:         limit.CreatedAt.Format(time.RFC3339),
		UpdatedAt:         limit.UpdatedAt.Format(time.RFC3339),
	}
}
