package graph

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/middleware"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

// graphUserQuerierMock satisfies service.userQuerier for resolver tests that
// resolve the authenticated user from context. Only the identity lookup is
// meaningful; the rest return zero values.
type graphUserQuerierMock struct {
	user sqlc.User
}

func (m *graphUserQuerierMock) CreateUser(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	return m.user, nil
}

func (m *graphUserQuerierMock) GetUserByID(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
	return m.user, nil
}

func (m *graphUserQuerierMock) GetUserByIdentityProviderID(ctx context.Context, identityProviderID string) (sqlc.User, error) {
	return m.user, nil
}

func (m *graphUserQuerierMock) GetOrCreateUserByEmail(ctx context.Context, arg sqlc.GetOrCreateUserByEmailParams) (sqlc.User, error) {
	return m.user, nil
}

func (m *graphUserQuerierMock) ListUsers(ctx context.Context) ([]sqlc.User, error) {
	return []sqlc.User{m.user}, nil
}

func (m *graphUserQuerierMock) UpdateUser(ctx context.Context, arg sqlc.UpdateUserParams) (sqlc.User, error) {
	return m.user, nil
}

func (m *graphUserQuerierMock) UpdateUserSetup(ctx context.Context, arg sqlc.UpdateUserSetupParams) (sqlc.User, error) {
	return m.user, nil
}

type graphPlaidQuerierMock struct {
	createPlaidConnectionFunc          func(context.Context, sqlc.CreatePlaidConnectionParams) (sqlc.PlaidConnection, error)
	getPlaidConnectionByIDFunc         func(context.Context, uuid.UUID) (sqlc.PlaidConnection, error)
	upsertPlaidAccountFunc             func(context.Context, sqlc.UpsertPlaidAccountParams) (sqlc.PlaidAccount, error)
	updatePlaidConnectionFunc          func(context.Context, sqlc.UpdatePlaidConnectionParams) (sqlc.PlaidConnection, error)
	listPlaidConnectionsByUserIDFunc   func(context.Context, uuid.UUID) ([]sqlc.PlaidConnection, error)
	getPlaidAccountsByConnectionIDFunc func(context.Context, uuid.UUID) ([]sqlc.PlaidAccount, error)
}

func (m *graphPlaidQuerierMock) CreatePlaidConnection(ctx context.Context, arg sqlc.CreatePlaidConnectionParams) (sqlc.PlaidConnection, error) { //nolint:gocritic // interface impl
	if m.createPlaidConnectionFunc != nil {
		return m.createPlaidConnectionFunc(ctx, arg)
	}
	return sqlc.PlaidConnection{}, nil
}

func (m *graphPlaidQuerierMock) GetPlaidConnectionByID(ctx context.Context, id uuid.UUID) (sqlc.PlaidConnection, error) {
	if m.getPlaidConnectionByIDFunc != nil {
		return m.getPlaidConnectionByIDFunc(ctx, id)
	}
	return sqlc.PlaidConnection{}, nil
}

func (m *graphPlaidQuerierMock) ListActivePlaidConnections(ctx context.Context) ([]sqlc.PlaidConnection, error) {
	return []sqlc.PlaidConnection{}, nil
}

func (m *graphPlaidQuerierMock) UpdateExpenseAmount(ctx context.Context, arg sqlc.UpdateExpenseAmountParams) error {
	return nil
}

func (m *graphPlaidQuerierMock) UpsertPlaidTransaction(ctx context.Context, arg sqlc.UpsertPlaidTransactionParams) (sqlc.Transaction, error) {
	return sqlc.Transaction{}, nil
}

func (m *graphPlaidQuerierMock) UpsertPlaidAccount(ctx context.Context, arg sqlc.UpsertPlaidAccountParams) (sqlc.PlaidAccount, error) { //nolint:gocritic // interface impl
	if m.upsertPlaidAccountFunc != nil {
		return m.upsertPlaidAccountFunc(ctx, arg)
	}
	return sqlc.PlaidAccount{}, nil
}

func (m *graphPlaidQuerierMock) UpdatePlaidConnection(ctx context.Context, arg sqlc.UpdatePlaidConnectionParams) (sqlc.PlaidConnection, error) {
	if m.updatePlaidConnectionFunc != nil {
		return m.updatePlaidConnectionFunc(ctx, arg)
	}
	return sqlc.PlaidConnection{}, nil
}

func (m *graphPlaidQuerierMock) ListPlaidConnectionsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PlaidConnection, error) {
	if m.listPlaidConnectionsByUserIDFunc != nil {
		return m.listPlaidConnectionsByUserIDFunc(ctx, userID)
	}
	return []sqlc.PlaidConnection{}, nil
}

func (m *graphPlaidQuerierMock) GetPlaidAccountsByConnectionID(ctx context.Context, connectionID uuid.UUID) ([]sqlc.PlaidAccount, error) {
	if m.getPlaidAccountsByConnectionIDFunc != nil {
		return m.getPlaidAccountsByConnectionIDFunc(ctx, connectionID)
	}
	return []sqlc.PlaidAccount{}, nil
}

func (m *graphPlaidQuerierMock) SoftDeletePlaidConnection(ctx context.Context, arg sqlc.SoftDeletePlaidConnectionParams) (int64, error) {
	return 1, nil
}

func (m *graphPlaidQuerierMock) LinkAssetToPlaidAccount(ctx context.Context, arg sqlc.LinkAssetToPlaidAccountParams) (int64, error) {
	return 1, nil
}

func (m *graphPlaidQuerierMock) UnlinkAssetFromPlaidAccount(ctx context.Context, arg sqlc.UnlinkAssetFromPlaidAccountParams) (int64, error) {
	return 1, nil
}

func (m *graphPlaidQuerierMock) LinkLiabilityToPlaidAccount(ctx context.Context, arg sqlc.LinkLiabilityToPlaidAccountParams) (int64, error) {
	return 1, nil
}

func (m *graphPlaidQuerierMock) UnlinkLiabilityFromPlaidAccount(ctx context.Context, arg sqlc.UnlinkLiabilityFromPlaidAccountParams) (int64, error) {
	return 1, nil
}

func (m *graphPlaidQuerierMock) GetAssetsByPlaidAccountID(ctx context.Context, plaidAccountID pgtype.UUID) ([]sqlc.GetAssetsByPlaidAccountIDRow, error) {
	return []sqlc.GetAssetsByPlaidAccountIDRow{}, nil
}

func (m *graphPlaidQuerierMock) GetLiabilitiesByPlaidAccountID(ctx context.Context, plaidAccountID pgtype.UUID) ([]sqlc.GetLiabilitiesByPlaidAccountIDRow, error) {
	return []sqlc.GetLiabilitiesByPlaidAccountIDRow{}, nil
}

func graphTime() time.Time { return time.Date(2026, 5, 5, 12, 0, 0, 0, time.UTC) }

func graphPtrString(value string) *string { return &value }

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func TestPlaidMutationExchangeAndQueryResolvers(t *testing.T) {
	t.Parallel()

	userID := uuid.New()
	connectionID := uuid.New()
	const devIdentityID = "dev-identity-plaid-test"
	storedConnection := sqlc.PlaidConnection{
		ID:              connectionID,
		UserID:          userID,
		Environment:     "sandbox",
		InstitutionID:   graphPtrString("dev_inst_1"),
		InstitutionName: graphPtrString("Dev Bank"),
		AccessToken:     "dev_access_public_tok",
		ItemID:          "dev_item_1",
		CreatedAt:       pgtype.Timestamptz{Time: graphTime(), Valid: true},
		UpdatedAt:       pgtype.Timestamptz{Time: graphTime(), Valid: true},
	}

	// The resolvers under test resolve the caller from the auth context and
	// verify connection ownership, so run with an authenticated dev identity.
	userMock := &graphUserQuerierMock{user: sqlc.User{ID: userID, IdentityProviderID: devIdentityID}}
	ctx := middleware.WithDevUserID(context.Background(), devIdentityID)

	var receivedCreate sqlc.CreatePlaidConnectionParams
	connMock := &graphPlaidQuerierMock{
		createPlaidConnectionFunc: func(ctx context.Context, arg sqlc.CreatePlaidConnectionParams) (sqlc.PlaidConnection, error) {
			receivedCreate = arg
			return storedConnection, nil
		},
		getPlaidConnectionByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.PlaidConnection, error) {
			assert.Equal(t, connectionID, id)
			return storedConnection, nil
		},
		listPlaidConnectionsByUserIDFunc: func(ctx context.Context, id uuid.UUID) ([]sqlc.PlaidConnection, error) {
			assert.Equal(t, userID, id)
			return []sqlc.PlaidConnection{storedConnection}, nil
		},
		getPlaidAccountsByConnectionIDFunc: func(ctx context.Context, id uuid.UUID) ([]sqlc.PlaidAccount, error) {
			assert.Equal(t, connectionID, id)
			return []sqlc.PlaidAccount{{
				ID:                uuid.New(),
				PlaidConnectionID: connectionID,
				ExternalID:        "dev-ext-1",
				Name:              "Dev Checking",
				OfficialName:      graphPtrString("Development Checking Account"),
				Type:              graphPtrString("depository"),
				Subtype:           graphPtrString("checking"),
				CurrentBalance:    pgtype.Numeric{},
				IsoCurrencyCode:   graphPtrString("USD"),
				CreatedAt:         pgtype.Timestamptz{Time: graphTime(), Valid: true},
				UpdatedAt:         pgtype.Timestamptz{Time: graphTime(), Valid: true},
			}}, nil
		},
		upsertPlaidAccountFunc: func(ctx context.Context, arg sqlc.UpsertPlaidAccountParams) (sqlc.PlaidAccount, error) {
			return sqlc.PlaidAccount{
				ID:                uuid.New(),
				PlaidConnectionID: arg.PlaidConnectionID,
				ExternalID:        arg.ExternalID,
				Name:              arg.Name,
				OfficialName:      arg.OfficialName,
				Type:              arg.Type,
				Subtype:           arg.Subtype,
				CurrentBalance:    arg.CurrentBalance,
				IsoCurrencyCode:   arg.IsoCurrencyCode,
				CreatedAt:         pgtype.Timestamptz{Time: graphTime(), Valid: true},
				UpdatedAt:         pgtype.Timestamptz{Time: graphTime(), Valid: true},
			}, nil
		},
		updatePlaidConnectionFunc: func(ctx context.Context, arg sqlc.UpdatePlaidConnectionParams) (sqlc.PlaidConnection, error) {
			return storedConnection, nil
		},
	}

	svc := service.NewPlaidService(connMock, nil, service.NewDevPlaidClient())
	resolver := &Resolver{PlaidService: svc, UserService: service.NewUserService(userMock)}

	created, err := resolver.Mutation().ExchangePlaidPublicToken(ctx, userID.String(), "public_tok")
	assert.NoError(t, err)
	if assert.NotNil(t, created) {
		assert.Equal(t, userID.String(), created.UserID)
		assert.Equal(t, "sandbox", created.Environment)
		assert.Equal(t, "dev_inst_1", derefString(created.InstitutionID))
		assert.Equal(t, "Dev Bank", derefString(created.InstitutionName))
		assert.Contains(t, created.ItemID, "dev_item_")
	}
	assert.Equal(t, userID, receivedCreate.UserID)
	assert.Equal(t, "sandbox", receivedCreate.Environment)
	assert.Equal(t, "dev_access_public_tok", receivedCreate.AccessToken)
	assert.Contains(t, receivedCreate.ItemID, "dev_item_")

	ok, err := resolver.Mutation().SyncPlaidConnection(ctx, connectionID.String())
	assert.NoError(t, err)
	assert.True(t, ok)

	deleted, err := resolver.Mutation().DeletePlaidConnection(ctx, connectionID.String())
	assert.NoError(t, err)
	assert.True(t, deleted)

	gotConnection, err := resolver.Query().PlaidConnection(ctx, connectionID.String())
	assert.NoError(t, err)
	if assert.NotNil(t, gotConnection) {
		assert.Equal(t, connectionID.String(), gotConnection.ID)
	}

	connections, err := resolver.Query().PlaidConnections(ctx, userID.String())
	assert.NoError(t, err)
	if assert.Len(t, connections, 1) {
		assert.Equal(t, connectionID.String(), connections[0].ID)
	}

	accounts, err := resolver.Query().PlaidAccounts(ctx, connectionID.String())
	assert.NoError(t, err)
	if assert.Len(t, accounts, 1) {
		assert.Equal(t, "dev-ext-1", accounts[0].ExternalID)
		assert.Equal(t, "Dev Checking", accounts[0].Name)
		assert.Equal(t, "USD", derefString(accounts[0].IsoCurrencyCode))
	}
}
