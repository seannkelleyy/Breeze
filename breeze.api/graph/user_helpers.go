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

func createUserInputFromModel(input model.CreateUserInput) (service.CreateUserInput, error) {
	safeWithdrawalRate, err := decimal.Parse(input.SafeWithdrawalRate)
	if err != nil {
		return service.CreateUserInput{}, fmt.Errorf("invalid safe withdrawal rate: %w", err)
	}

	inflationRate, err := decimal.Parse(input.InflationRate)
	if err != nil {
		return service.CreateUserInput{}, fmt.Errorf("invalid inflation rate: %w", err)
	}

	var deductionAmount *decimal.Decimal
	if input.DeductionAmount != nil {
		parsed, parseErr := decimal.Parse(*input.DeductionAmount)
		if parseErr != nil {
			return service.CreateUserInput{}, fmt.Errorf("invalid deduction amount: %w", parseErr)
		}
		deductionAmount = &parsed
	}

	var maxTaxBracketID *uuid.UUID
	if input.MaxTaxBracketID != nil {
		parsed, parseErr := uuid.Parse(*input.MaxTaxBracketID)
		if parseErr != nil {
			return service.CreateUserInput{}, fmt.Errorf("invalid max tax bracket id: %w", parseErr)
		}
		maxTaxBracketID = &parsed
	}

	return service.CreateUserInput{
		IdentityProviderID: input.IdentityProviderID,
		Email:              input.Email,
		ReturnType:         sqlc.ReturnType(input.ReturnType),
		SafeWithdrawalRate: safeWithdrawalRate,
		CurrencyType:       input.CurrencyType,
		InflationRate:      inflationRate,
		DeductionType:      sqlc.DeductionType(input.DeductionType),
		DeductionAmount:    deductionAmount,
		MaxTaxBracketID:    maxTaxBracketID,
		FilingStatus:       sqlc.FilingStatus(input.FilingStatus),
		PayoffStrategy:     sqlc.PayoffStrategy(input.PayoffStrategy),
	}, nil
}

func updateUserInputFromModel(input model.UpdateUserInput) (service.UpdateUserInput, error) {
	id, err := uuid.Parse(input.ID)
	if err != nil {
		return service.UpdateUserInput{}, fmt.Errorf("invalid user id: %w", err)
	}

	createInput, err := createUserInputFromModel(model.CreateUserInput{
		IdentityProviderID: input.IdentityProviderID,
		Email:              input.Email,
		ReturnType:         input.ReturnType,
		SafeWithdrawalRate: input.SafeWithdrawalRate,
		CurrencyType:       input.CurrencyType,
		InflationRate:      input.InflationRate,
		DeductionType:      input.DeductionType,
		DeductionAmount:    input.DeductionAmount,
		MaxTaxBracketID:    input.MaxTaxBracketID,
		FilingStatus:       input.FilingStatus,
		PayoffStrategy:     input.PayoffStrategy,
	})
	if err != nil {
		return service.UpdateUserInput{}, err
	}

	return service.UpdateUserInput{
		ID:                 id,
		IdentityProviderID: createInput.IdentityProviderID,
		Email:              createInput.Email,
		ReturnType:         createInput.ReturnType,
		SafeWithdrawalRate: createInput.SafeWithdrawalRate,
		CurrencyType:       createInput.CurrencyType,
		InflationRate:      createInput.InflationRate,
		DeductionType:      createInput.DeductionType,
		DeductionAmount:    createInput.DeductionAmount,
		MaxTaxBracketID:    createInput.MaxTaxBracketID,
		FilingStatus:       createInput.FilingStatus,
		PayoffStrategy:     createInput.PayoffStrategy,
	}, nil
}

func mapUserToModel(user *service.User) *model.User {
	var deductionAmount *string
	if user.DeductionAmount != nil {
		value := user.DeductionAmount.String()
		deductionAmount = &value
	}

	var maxTaxBracketID *string
	if user.MaxTaxBracketID != nil {
		value := user.MaxTaxBracketID.String()
		maxTaxBracketID = &value
	}

	return &model.User{
		ID:                 user.ID.String(),
		IdentityProviderID: user.IdentityProviderID,
		Email:              user.Email,
		ReturnType:         model.ReturnType(user.ReturnType),
		SafeWithdrawalRate: user.SafeWithdrawalRate.String(),
		CurrencyType:       user.CurrencyType,
		InflationRate:      user.InflationRate.String(),
		DeductionType:      model.DeductionType(user.DeductionType),
		DeductionAmount:    deductionAmount,
		MaxTaxBracketID:    maxTaxBracketID,
		FilingStatus:       model.FilingStatus(user.FilingStatus),
		PayoffStrategy:     model.PayoffStrategy(user.PayoffStrategy),
		CreatedAt:          user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          user.UpdatedAt.Format(time.RFC3339),
	}
}
