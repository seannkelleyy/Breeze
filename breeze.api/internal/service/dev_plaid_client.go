package service

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

// NewDevPlaidClient returns a PlaidClient implementation suitable for local development and UI testing.
func NewDevPlaidClient() PlaidClient {
	return &devPlaidClient{}
}

type devPlaidClient struct{}

func (d *devPlaidClient) CreateLinkToken(ctx context.Context, userID string) (string, error) {
	return fmt.Sprintf("dev-link-token-%s", userID), nil
}

func (d *devPlaidClient) ExchangePublicToken(ctx context.Context, publicToken string) (string, string, string, string, string, error) {
	// Return deterministic values derived from publicToken for testing.
	id := uuid.New().String()
	access := fmt.Sprintf("dev_access_%s", publicToken)
	item := fmt.Sprintf("dev_item_%s", id)
	institutionID := fmt.Sprintf("dev_inst_%s", id)
	institutionName := "Dev Bank"
	environment := "sandbox"
	return access, item, institutionID, institutionName, environment, nil
}

func (d *devPlaidClient) FetchAccounts(ctx context.Context, accessToken string) ([]PlaidAccount, error) {
	// Return two sample accounts with balances.
	bal1 := decimal.MustParse("1234.56")
	bal2 := decimal.MustParse("7890.12")
	a1 := PlaidAccount{
		ExternalID:      "dev-ext-1",
		Name:            "Dev Checking",
		OfficialName:    ptrString("Development Checking Account"),
		Type:            ptrString("depository"),
		Subtype:         ptrString("checking"),
		CurrentBalance:  &bal1,
		ISOCurrencyCode: ptrString("USD"),
	}
	a2 := PlaidAccount{
		ExternalID:      "dev-ext-2",
		Name:            "Dev Savings",
		OfficialName:    ptrString("Development Savings Account"),
		Type:            ptrString("depository"),
		Subtype:         ptrString("savings"),
		CurrentBalance:  &bal2,
		ISOCurrencyCode: ptrString("USD"),
	}
	return []PlaidAccount{a1, a2}, nil
}

func ptrString(s string) *string { return &s }
