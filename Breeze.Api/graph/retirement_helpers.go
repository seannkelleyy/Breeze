package graph

import (
	"fmt"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func createRetirementAccountInputFromModel(input model.CreateRetirementAccountInput) (service.CreateRetirementAccountInput, error) {
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return service.CreateRetirementAccountInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	currentBalance, err := decimal.Parse(input.CurrentBalance)
	if err != nil {
		return service.CreateRetirementAccountInput{}, fmt.Errorf("invalid current balance: %w", err)
	}

	return service.CreateRetirementAccountInput{
		UserID:         userID,
		Name:           input.Name,
		AccountType:    serviceAccountTypeFromModel(input.AccountType),
		Owner:          serviceRetirementAccountOwnerFromModel(input.Owner),
		TaxTreatment:   serviceRetirementTaxTreatmentFromModel(input.TaxTreatment),
		CurrentBalance: currentBalance,
	}, nil
}

func updateRetirementAccountInputFromModel(input model.UpdateRetirementAccountInput) (service.UpdateRetirementAccountInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateRetirementAccountInput{}, fmt.Errorf("invalid retirement account id: %w", err)
	}

	currentBalance, err := decimal.Parse(input.CurrentBalance)
	if err != nil {
		return service.UpdateRetirementAccountInput{}, fmt.Errorf("invalid current balance: %w", err)
	}

	return service.UpdateRetirementAccountInput{
		ID:             id,
		Name:           input.Name,
		AccountType:    serviceAccountTypeFromModel(input.AccountType),
		Owner:          serviceRetirementAccountOwnerFromModel(input.Owner),
		TaxTreatment:   serviceRetirementTaxTreatmentFromModel(input.TaxTreatment),
		CurrentBalance: currentBalance,
	}, nil
}

func addContributionInputFromModel(input model.AddContributionInput) (service.AddContributionInput, error) {
	retirementAccountID, err := uuid.Parse(input.RetirementAccountID)
	if err != nil {
		return service.AddContributionInput{}, fmt.Errorf("invalid retirement account id: %w", err)
	}

	contributionDate, err := time.Parse(time.RFC3339, input.ContributionDate)
	if err != nil {
		return service.AddContributionInput{}, fmt.Errorf("invalid contribution date: %w", err)
	}

	amount, err := decimal.Parse(input.Amount)
	if err != nil {
		return service.AddContributionInput{}, fmt.Errorf("invalid contribution amount: %w", err)
	}

	return service.AddContributionInput{
		RetirementAccountID: retirementAccountID,
		ContributionDate:    contributionDate,
		Amount:              amount,
	}, nil
}

func mapRetirementAccountToModel(account *service.RetirementAccount) *model.RetirementAccount {
	return &model.RetirementAccount{
		ID:                      account.ID.String(),
		UserID:                  account.UserID.String(),
		Name:                    account.Name,
		AccountType:             model.RetirementAccountType(account.AccountType),
		Owner:                   model.RetirementAccountOwner(account.Owner),
		TaxTreatment:            model.RetirementTaxTreatment(account.TaxTreatment),
		CurrentBalance:          account.CurrentBalance.String(),
		AnnualContributionLimit: account.AnnualContributionLimit.String(),
		CreatedAt:               account.CreatedAt.Format(time.RFC3339),
		UpdatedAt:               account.UpdatedAt.Format(time.RFC3339),
	}
}

func mapContributionEntryToModel(entry *service.ContributionEntry) *model.ContributionEntry {
	return &model.ContributionEntry{
		ID:                  entry.ID.String(),
		RetirementAccountID: entry.RetirementAccountID.String(),
		TaxYear:             entry.TaxYear,
		ContributionDate:    entry.ContributionDate.Format(time.RFC3339),
		Amount:              entry.Amount.String(),
		CreatedAt:           entry.CreatedAt.Format(time.RFC3339),
		UpdatedAt:           entry.UpdatedAt.Format(time.RFC3339),
	}
}

func mapContributionProgressToModel(progress *service.ContributionProgress) *model.ContributionProgress {
	return &model.ContributionProgress{
		RetirementAccountID: progress.RetirementAccountID.String(),
		TaxYear:             progress.TaxYear,
		AnnualLimit:         progress.AnnualLimit.String(),
		ContributedYtd:      progress.ContributedYtd.String(),
		RemainingAmount:     progress.RemainingAmount.String(),
		PercentUsed:         progress.PercentUsed.String(),
		IsMaxed:             progress.IsMaxed,
	}
}

func serviceAccountTypeFromModel(value model.RetirementAccountType) sqlc.RetirementAccountType {
	return sqlc.RetirementAccountType(value)
}

func serviceRetirementAccountOwnerFromModel(value model.RetirementAccountOwner) sqlc.RetirementAccountOwner {
	return sqlc.RetirementAccountOwner(value)
}

func serviceRetirementTaxTreatmentFromModel(value model.RetirementTaxTreatment) sqlc.RetirementTaxTreatment {
	return sqlc.RetirementTaxTreatment(value)
}
