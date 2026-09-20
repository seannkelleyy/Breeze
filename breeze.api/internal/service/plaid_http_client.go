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

type linkTokenReq struct {
	ClientID string `json:"client_id"`
	Secret   string `json:"secret"`
	User     struct {
		ClientUserID string `json:"client_user_id"`
	} `json:"user"`
	ClientName   string   `json:"client_name"`
	Products     []string `json:"products"`
	CountryCodes []string `json:"country_codes"`
	Language     string   `json:"language"`
}

type linkTokenResp struct {
	LinkToken string `json:"link_token"`
	RequestID string `json:"request_id"`
}

// CreateLinkToken implements PlaidClient.CreateLinkToken
func (p *PlaidHTTPClient) CreateLinkToken(ctx context.Context, userID string) (string, error) {
	reqBody := linkTokenReq{
		ClientID:     p.clientID,
		Secret:       p.secret,
		ClientName:   "Breeze",
		Products:     []string{"auth", "transactions"},
		CountryCodes: []string{"US"},
		Language:     "en",
	}
	reqBody.User.ClientUserID = userID

	b, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/link/token/create", bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("plaid link token create returned %d", resp.StatusCode)
	}

	var out linkTokenResp
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}

	return out.LinkToken, nil
}

// ExchangePublicToken implements PlaidClient.ExchangePublicToken
//
//nolint:gocritic // tooManyResultsChecker: interface requires 5 return values
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

type transactionsReq struct {
	ClientID    string `json:"client_id"`
	Secret      string `json:"secret"`
	AccessToken string `json:"access_token"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Count       int    `json:"count,omitempty"`
	Offset      int    `json:"offset,omitempty"`
}

type plaidTransaction struct {
	TransactionID string      `json:"transaction_id"`
	AccountID     string      `json:"account_id"`
	Date          string      `json:"date"`
	Amount        json.Number `json:"amount"`
	Name          string      `json:"name"`
	Pending       bool        `json:"pending"`
}

type transactionsResp struct {
	TotalTransactions int                `json:"total_transactions"`
	Transactions      []plaidTransaction `json:"transactions"`
}

// FetchTransactions implements PlaidClient.FetchTransactions, paging through
// /transactions/get until every transaction in the range is returned.
func (p *PlaidHTTPClient) FetchTransactions(ctx context.Context, accessToken string, startDate, endDate time.Time) ([]PlaidTransaction, error) {
	const pageSize = 100

	var out []PlaidTransaction
	for offset := 0; ; offset += pageSize {
		reqBody := transactionsReq{
			ClientID:    p.clientID,
			Secret:      p.secret,
			AccessToken: accessToken,
			StartDate:   startDate.Format("2006-01-02"),
			EndDate:     endDate.Format("2006-01-02"),
			Count:       pageSize,
			Offset:      offset,
		}
		b, _ := json.Marshal(reqBody)
		req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/transactions/get", bytes.NewReader(b))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := p.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode != http.StatusOK {
			_ = resp.Body.Close()
			return nil, fmt.Errorf("plaid transactions returned %d", resp.StatusCode)
		}

		var page transactionsResp
		decodeErr := json.NewDecoder(resp.Body).Decode(&page)
		_ = resp.Body.Close()
		if decodeErr != nil {
			return nil, decodeErr
		}

		for _, t := range page.Transactions {
			date, err := time.Parse("2006-01-02", t.Date)
			if err != nil {
				return nil, fmt.Errorf("parse transaction date %q: %w", t.Date, err)
			}
			amount, err := decimal.Parse(t.Amount.String())
			if err != nil {
				return nil, fmt.Errorf("parse transaction amount: %w", err)
			}
			out = append(out, PlaidTransaction{
				ExternalID:     t.TransactionID,
				PlaidAccountID: t.AccountID,
				Date:           date,
				Amount:         amount,
				Name:           t.Name,
				Pending:        t.Pending,
			})
		}

		if len(out) >= page.TotalTransactions || len(page.Transactions) == 0 {
			return out, nil
		}
	}
}
