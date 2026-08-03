package service

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

type mockPlaidQuerier struct {
	createPlaidConnectionFunc          func(context.Context, sqlc.CreatePlaidConnectionParams) (sqlc.PlaidConnection, error)
	getPlaidConnectionByIDFunc         func(context.Context, uuid.UUID) (sqlc.PlaidConnection, error)
	upsertPlaidAccountFunc             func(context.Context, sqlc.UpsertPlaidAccountParams) (sqlc.PlaidAccount, error)
	updatePlaidConnectionFunc          func(context.Context, sqlc.UpdatePlaidConnectionParams) (sqlc.PlaidConnection, error)
	listPlaidConnectionsByUserIDFunc   func(context.Context, uuid.UUID) ([]sqlc.PlaidConnection, error)
	getPlaidAccountsByConnectionIDFunc func(context.Context, uuid.UUID) ([]sqlc.PlaidAccount, error)
}

func (m *mockPlaidQuerier) CreatePlaidConnection(ctx context.Context, arg sqlc.CreatePlaidConnectionParams) (sqlc.PlaidConnection, error) {
	if m.createPlaidConnectionFunc != nil {
		return m.createPlaidConnectionFunc(ctx, arg)
	}
	return sqlc.PlaidConnection{}, nil
}
func (m *mockPlaidQuerier) GetPlaidConnectionByID(ctx context.Context, id uuid.UUID) (sqlc.PlaidConnection, error) {
	if m.getPlaidConnectionByIDFunc != nil {
		return m.getPlaidConnectionByIDFunc(ctx, id)
	}
	return sqlc.PlaidConnection{}, nil
}
func (m *mockPlaidQuerier) UpsertPlaidAccount(ctx context.Context, arg sqlc.UpsertPlaidAccountParams) (sqlc.PlaidAccount, error) {
	if m.upsertPlaidAccountFunc != nil {
		return m.upsertPlaidAccountFunc(ctx, arg)
	}
	return sqlc.PlaidAccount{}, nil
}
func (m *mockPlaidQuerier) UpdatePlaidConnection(ctx context.Context, arg sqlc.UpdatePlaidConnectionParams) (sqlc.PlaidConnection, error) {
	if m.updatePlaidConnectionFunc != nil {
		return m.updatePlaidConnectionFunc(ctx, arg)
	}
	return sqlc.PlaidConnection{}, nil
}
func (m *mockPlaidQuerier) ListPlaidConnectionsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PlaidConnection, error) {
	if m.listPlaidConnectionsByUserIDFunc != nil {
		return m.listPlaidConnectionsByUserIDFunc(ctx, userID)
	}
	return []sqlc.PlaidConnection{}, nil
}
func (m *mockPlaidQuerier) GetPlaidAccountsByConnectionID(ctx context.Context, connectionID uuid.UUID) ([]sqlc.PlaidAccount, error) {
	if m.getPlaidAccountsByConnectionIDFunc != nil {
		return m.getPlaidAccountsByConnectionIDFunc(ctx, connectionID)
	}
	return []sqlc.PlaidAccount{}, nil
}

func (m *mockPlaidQuerier) SoftDeletePlaidConnection(ctx context.Context, id uuid.UUID) (int64, error) {
	return 1, nil
}

func (m *mockPlaidQuerier) LinkAssetToPlaidAccount(ctx context.Context, arg sqlc.LinkAssetToPlaidAccountParams) error {
	return nil
}

func (m *mockPlaidQuerier) UnlinkAssetFromPlaidAccount(ctx context.Context, id uuid.UUID) error {
	return nil
}

func (m *mockPlaidQuerier) LinkLiabilityToPlaidAccount(ctx context.Context, arg sqlc.LinkLiabilityToPlaidAccountParams) error {
	return nil
}

func (m *mockPlaidQuerier) UnlinkLiabilityFromPlaidAccount(ctx context.Context, id uuid.UUID) error {
	return nil
}

func (m *mockPlaidQuerier) GetAssetsByPlaidAccountID(ctx context.Context, plaidAccountID pgtype.UUID) ([]sqlc.GetAssetsByPlaidAccountIDRow, error) {
	return []sqlc.GetAssetsByPlaidAccountIDRow{}, nil
}

func (m *mockPlaidQuerier) GetLiabilitiesByPlaidAccountID(ctx context.Context, plaidAccountID pgtype.UUID) ([]sqlc.GetLiabilitiesByPlaidAccountIDRow, error) {
	return []sqlc.GetLiabilitiesByPlaidAccountIDRow{}, nil
}

// timeNow helper to avoid importing time repeatedly in the test top-level
func timeNow() (t time.Time) { return time.Now().UTC() }

func TestExchangePublicTokenCreatesConnection(t *testing.T) {
	ctx := context.Background()
	// prepare mock querier to assert CreatePlaidConnection is called
	var received sqlc.CreatePlaidConnectionParams
	mock := &mockPlaidQuerier{
		createPlaidConnectionFunc: func(ctx context.Context, arg sqlc.CreatePlaidConnectionParams) (sqlc.PlaidConnection, error) {
			received = arg
			// return a constructed row
			return sqlc.PlaidConnection{ID: uuid.New(), UserID: arg.UserID, Environment: arg.Environment, AccessToken: arg.AccessToken, ItemID: arg.ItemID, InstitutionID: arg.InstitutionID, InstitutionName: arg.InstitutionName, CreatedAt: pgtype.Timestamptz{Time: timeNow(), Valid: true}, UpdatedAt: pgtype.Timestamptz{Time: timeNow(), Valid: true}}, nil
		},
	}

	// create service with dev client
	svc := NewPlaidService(mock, nil, NewDevPlaidClient())

	// call ExchangePublicToken
	pub := "public-test"
	userID := uuid.New()
	conn, err := svc.ExchangePublicToken(ctx, userID, pub)
	assert.NoError(t, err)
	assert.NotNil(t, conn)
	assert.Equal(t, userID, conn.UserID)
	assert.Equal(t, "sandbox", conn.Environment)
	assert.Equal(t, "dev_access_public-test", conn.AccessToken)
	assert.Contains(t, conn.ItemID, "dev_item_")
	if assert.NotNil(t, conn.InstitutionID) {
		assert.Contains(t, *conn.InstitutionID, "dev_inst_")
	}
	if assert.NotNil(t, conn.InstitutionName) {
		assert.Equal(t, "Dev Bank", *conn.InstitutionName)
	}
	// ensure CreatePlaidConnection received expected values
	assert.Equal(t, userID, received.UserID)
	assert.Equal(t, "sandbox", received.Environment)
}

func TestSyncAccountsUpserts(t *testing.T) {
	ctx := context.Background()
	// conn row for GetPlaidConnectionByID
	connectionID := uuid.New()
	connRow := sqlc.PlaidConnection{ID: connectionID, UserID: uuid.New(), Environment: "sandbox", AccessToken: "dev_access", ItemID: "dev_item", CreatedAt: pgtype.Timestamptz{Time: timeNow(), Valid: true}, UpdatedAt: pgtype.Timestamptz{Time: timeNow(), Valid: true}}

	var upserted []sqlc.UpsertPlaidAccountParams
	mock := &mockPlaidQuerier{
		getPlaidConnectionByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.PlaidConnection, error) {
			assert.Equal(t, connectionID, id)
			return connRow, nil
		},
		upsertPlaidAccountFunc: func(ctx context.Context, arg sqlc.UpsertPlaidAccountParams) (sqlc.PlaidAccount, error) {
			upserted = append(upserted, arg)
			// return a dummy account
			return sqlc.PlaidAccount{ID: uuid.New(), PlaidConnectionID: arg.PlaidConnectionID, ExternalID: arg.ExternalID, Name: arg.Name, CreatedAt: pgtype.Timestamptz{Time: timeNow(), Valid: true}, UpdatedAt: pgtype.Timestamptz{Time: timeNow(), Valid: true}}, nil
		},
		updatePlaidConnectionFunc: func(ctx context.Context, arg sqlc.UpdatePlaidConnectionParams) (sqlc.PlaidConnection, error) {
			return connRow, nil
		},
	}

	svc := NewPlaidService(mock, nil, NewDevPlaidClient())
	err := svc.SyncAccounts(ctx, connectionID)
	assert.NoError(t, err)
	// dev client returns 2 accounts
	assert.Equal(t, 2, len(upserted))
}

func TestSyncAccountsReturnsNotFoundForMissingConnection(t *testing.T) {
	ctx := context.Background()
	mock := &mockPlaidQuerier{
		getPlaidConnectionByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.PlaidConnection, error) {
			return sqlc.PlaidConnection{}, pgx.ErrNoRows
		},
	}

	svc := NewPlaidService(mock, nil, NewDevPlaidClient())
	err := svc.SyncAccounts(ctx, uuid.New())
	assert.ErrorIs(t, err, ErrNotFound)
}
