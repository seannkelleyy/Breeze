package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/govalues/decimal"
	"github.com/stretchr/testify/assert"
)

func TestPlaidHTTPClient_ExchangePublicToken(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/item/public_token/exchange" {
			_ = json.NewEncoder(w).Encode(map[string]string{"access_token": "access_test", "item_id": "item_test"})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	client := &PlaidHTTPClient{clientID: "cid", secret: "sec", env: "sandbox", baseURL: srv.URL, httpClient: srv.Client()}

	access, item, instID, instName, env, err := client.ExchangePublicToken(context.Background(), "public_tok")
	assert.NoError(t, err)
	assert.Equal(t, "access_test", access)
	assert.Equal(t, "item_test", item)
	assert.Equal(t, "", instID)
	assert.Equal(t, "", instName)
	assert.Equal(t, "sandbox", env)
}

func TestPlaidHTTPClient_FetchAccounts(t *testing.T) {
	accounts := map[string]interface{}{
		"accounts": []map[string]interface{}{
			{"account_id": "acc_1", "name": "Checking", "official_name": "My Checking", "type": "depository", "subtype": "checking", "balances": map[string]interface{}{"current": 123.45, "iso_currency_code": "USD"}},
			{"account_id": "acc_2", "name": "Savings", "official_name": "My Savings", "type": "depository", "subtype": "savings", "balances": map[string]interface{}{"current": 67.89, "iso_currency_code": "USD"}},
		},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/accounts/get" {
			_ = json.NewEncoder(w).Encode(accounts)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	client := &PlaidHTTPClient{clientID: "cid", secret: "sec", env: "sandbox", baseURL: srv.URL, httpClient: srv.Client()}
	res, err := client.FetchAccounts(context.Background(), "access_token")
	assert.NoError(t, err)
	if !assert.Len(t, res, 2) {
		t.FailNow()
	}

	// verify first account fields
	a := res[0]
	assert.Equal(t, "acc_1", a.ExternalID)
	assert.Equal(t, "Checking", a.Name)
	if assert.NotNil(t, a.CurrentBalance) {
		// current balance should parse to a decimal with cents
		expected, _ := decimal.Parse("123.45")
		assert.Equal(t, expected.String(), a.CurrentBalance.String())
	}
}

func TestPlaidHTTPClient_ExchangePublicToken_NonOK(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer srv.Close()

	client := &PlaidHTTPClient{clientID: "cid", secret: "sec", env: "sandbox", baseURL: srv.URL, httpClient: srv.Client()}

	_, _, _, _, _, err := client.ExchangePublicToken(context.Background(), "public_tok")
	assert.Error(t, err)
}

func TestPlaidHTTPClient_FetchAccounts_NonOK(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	client := &PlaidHTTPClient{clientID: "cid", secret: "sec", env: "sandbox", baseURL: srv.URL, httpClient: srv.Client()}

	_, err := client.FetchAccounts(context.Background(), "access_token")
	assert.Error(t, err)
}
