package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/govalues/decimal"

	"breeze.api/internal/config"
)

// PlaidHTTPClient is a minimal Plaid API client suitable for production wiring.
// It expects the usual Plaid credentials to be present in the config.
type PlaidHTTPClient struct {
	clientID   string
	secret     string
	env        string
	baseURL    string
	httpClient *http.Client
}

func NewPlaidHTTPClient(cfg *config.Config) (*PlaidHTTPClient, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config required")
	}
	if cfg.PlaidClientID == "" || cfg.PlaidSecret == "" {
		return nil, fmt.Errorf("plaid credentials not configured")
	}
	base := "https://sandbox.plaid.com"
	switch cfg.PlaidEnv {
	case "production", "prod":
		base = "https://production.plaid.com"
	case "development", "dev":
		base = "https://development.plaid.com"
	}

	return &PlaidHTTPClient{
		clientID:   cfg.PlaidClientID,
		secret:     cfg.PlaidSecret,
		env:        cfg.PlaidEnv,
		baseURL:    base,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}, nil
}

type exchangeReq struct {
	ClientID    string `json:"client_id"`
	Secret      string `json:"secret"`
	PublicToken string `json:"public_token"`
}

type exchangeResp struct {
	AccessToken string `json:"access_token"`
	ItemID      string `json:"item_id"`
	// metadata may contain institution info depending on Plaid environment
	RequestID string `json:"request_id"`
}

// ExchangePublicToken implements PlaidClient.ExchangePublicToken
func (p *PlaidHTTPClient) ExchangePublicToken(ctx context.Context, publicToken string) (string, string, string, string, string, error) {
	reqBody := exchangeReq{ClientID: p.clientID, Secret: p.secret, PublicToken: publicToken}
	b, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/item/public_token/exchange", bytes.NewReader(b))
	if err != nil {
		return "", "", "", "", "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", "", "", "", "", err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return "", "", "", "", "", fmt.Errorf("plaid exchange returned %d", resp.StatusCode)
	}

	var out exchangeResp
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", "", "", "", "", err
	}

	// Institution info is not always returned by this endpoint; leave empty here.
	return out.AccessToken, out.ItemID, "", "", p.env, nil
}

type accountsReq struct {
	ClientID    string `json:"client_id"`
	Secret      string `json:"secret"`
	AccessToken string `json:"access_token"`
}

type account struct {
	AccountID    string `json:"account_id"`
	Name         string `json:"name"`
	OfficialName string `json:"official_name"`
	Type         string `json:"type"`
	Subtype      string `json:"subtype"`
	Balances     struct {
		Current         json.Number `json:"current"`
		IsoCurrencyCode string      `json:"iso_currency_code"`
	} `json:"balances"`
}

type accountsResp struct {
	Accounts []account `json:"accounts"`
}

// FetchAccounts implements PlaidClient.FetchAccounts
func (p *PlaidHTTPClient) FetchAccounts(ctx context.Context, accessToken string) ([]PlaidAccount, error) {
	reqBody := accountsReq{ClientID: p.clientID, Secret: p.secret, AccessToken: accessToken}
	b, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/accounts/get", bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("plaid accounts returned %d", resp.StatusCode)
	}

	var out accountsResp
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	res := make([]PlaidAccount, 0, len(out.Accounts))
	for _, a := range out.Accounts {
		// Convert balances to decimal via string to preserve precision
		cur, _ := decimal.Parse(a.Balances.Current.String())
		res = append(res, PlaidAccount{
			ExternalID:      a.AccountID,
			Name:            a.Name,
			OfficialName:    &a.OfficialName,
			Type:            &a.Type,
			Subtype:         &a.Subtype,
			CurrentBalance:  &cur,
			ISOCurrencyCode: &a.Balances.IsoCurrencyCode,
		})
	}
	return res, nil
}
