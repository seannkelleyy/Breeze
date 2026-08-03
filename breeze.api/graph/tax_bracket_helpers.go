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

func taxBracketIDFromString(id string) (uuid.UUID, error) {
	parsed, err := uuid.Parse(id)
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("invalid tax bracket id: %w", err)
	}
	return parsed, nil
}

func taxBracketYearFromInput(year int) (int32, error) {
	if year < 0 || year > int(^uint32(0)>>1) {
		return 0, fmt.Errorf("invalid tax bracket year: %d", year)
	}
	return int32(year), nil
}

func mapTaxBracketToModel(bracket *service.TaxBracket) *model.TaxBracket {
	var maximumAmount *string
	if bracket.MaximumAmount != nil {
		value := bracket.MaximumAmount.String()
		maximumAmount = &value
	}

	return &model.TaxBracket{
		ID:            bracket.ID.String(),
		Year:          int(bracket.Year),
		FilingStatus:  model.FilingStatus(bracket.FilingStatus),
		MinimumAmount: bracket.MinimumAmount.String(),
		MaximumAmount: maximumAmount,
		Rate:          bracket.Rate.String(),
		CreatedAt:     bracket.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     bracket.UpdatedAt.Format(time.RFC3339),
	}
}

func createTaxBracketInputFromModel(input model.CreateTaxBracketInput) (service.CreateTaxBracketInput, error) {
	year, err := taxBracketYearFromInput(input.Year)
	if err != nil {
		return service.CreateTaxBracketInput{}, err
	}

	minimumAmount, err := decimal.Parse(input.MinimumAmount)
	if err != nil {
		return service.CreateTaxBracketInput{}, fmt.Errorf("invalid minimum amount: %w", err)
	}

	rate, err := decimal.Parse(input.Rate)
	if err != nil {
		return service.CreateTaxBracketInput{}, fmt.Errorf("invalid rate: %w", err)
	}

	var maximumAmount *decimal.Decimal
	if input.MaximumAmount != nil {
		parsed, parseErr := decimal.Parse(*input.MaximumAmount)
		if parseErr != nil {
			return service.CreateTaxBracketInput{}, fmt.Errorf("invalid maximum amount: %w", parseErr)
		}
		maximumAmount = &parsed
	}

	return service.CreateTaxBracketInput{
		Year:          year,
		FilingStatus:  sqlc.FilingStatus(input.FilingStatus),
		MinimumAmount: minimumAmount,
		MaximumAmount: maximumAmount,
		Rate:          rate,
	}, nil
}

func updateTaxBracketInputFromModel(input model.UpdateTaxBracketInput) (service.UpdateTaxBracketInput, error) {
	id, err := taxBracketIDFromString(input.ID)
	if err != nil {
		return service.UpdateTaxBracketInput{}, err
	}

	createInput, err := createTaxBracketInputFromModel(model.CreateTaxBracketInput{
		Year:          input.Year,
		FilingStatus:  input.FilingStatus,
		MinimumAmount: input.MinimumAmount,
		MaximumAmount: input.MaximumAmount,
		Rate:          input.Rate,
	})
	if err != nil {
		return service.UpdateTaxBracketInput{}, err
	}

	return service.UpdateTaxBracketInput{
		ID:            id,
		Year:          createInput.Year,
		FilingStatus:  createInput.FilingStatus,
		MinimumAmount: createInput.MinimumAmount,
		MaximumAmount: createInput.MaximumAmount,
		Rate:          createInput.Rate,
	}, nil
}
