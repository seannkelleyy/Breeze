package graph

import (
	"context"
	"testing"

	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/middleware"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// unprovisionedUserQuerier simulates an authenticated Clerk identity that has
// no Breeze account row yet.
type unprovisionedUserQuerier struct {
	graphUserQuerierMock
}

func (m *unprovisionedUserQuerier) GetUserByIdentityProviderID(context.Context, string) (sqlc.User, error) {
	return sqlc.User{}, pgx.ErrNoRows
}

// recordingAssetQuerier captures which user ID the resolver asks the service
// to read.
type recordingAssetQuerier struct {
	listFor *uuid.UUID
}

func (m *recordingAssetQuerier) CreateAsset(context.Context, sqlc.CreateAssetParams) (sqlc.CreateAssetRow, error) {
	return sqlc.CreateAssetRow{}, nil
}

func (m *recordingAssetQuerier) GetAssetByID(context.Context, uuid.UUID) (sqlc.GetAssetByIDRow, error) {
	return sqlc.GetAssetByIDRow{}, nil
}

func (m *recordingAssetQuerier) ListAssetsByUserID(_ context.Context, userID uuid.UUID) ([]sqlc.ListAssetsByUserIDRow, error) {
	*m.listFor = userID
	return nil, nil
}

func (m *recordingAssetQuerier) UpdateAsset(context.Context, sqlc.UpdateAssetParams) (sqlc.UpdateAssetRow, error) {
	return sqlc.UpdateAssetRow{}, nil
}

func (m *recordingAssetQuerier) SoftDeleteAsset(context.Context, sqlc.SoftDeleteAssetParams) (int64, error) {
	return 0, nil
}

func TestResolveUserIDFromCtxFailsClosed(t *testing.T) {
	t.Parallel()

	t.Run("no identity in context", func(t *testing.T) {
		t.Parallel()
		svc := service.NewUserService(&graphUserQuerierMock{})

		_, err := resolveUserIDFromCtx(context.Background(), svc)

		require.ErrorIs(t, err, service.ErrUnauthorized)
	})

	t.Run("identity has no provisioned account", func(t *testing.T) {
		t.Parallel()
		svc := service.NewUserService(&unprovisionedUserQuerier{})
		ctx := middleware.WithDevUserID(context.Background(), "clerk-user-1")

		_, err := resolveUserIDFromCtx(ctx, svc)

		require.ErrorIs(t, err, service.ErrUnauthorized)
	})

	t.Run("provisioned identity", func(t *testing.T) {
		t.Parallel()
		want := uuid.New()
		svc := service.NewUserService(&graphUserQuerierMock{
			user: sqlc.User{ID: want, IdentityProviderID: "clerk-user-1"},
		})
		ctx := middleware.WithDevUserID(context.Background(), "clerk-user-1")

		got, err := resolveUserIDFromCtx(ctx, svc)

		require.NoError(t, err)
		assert.Equal(t, want, got)
	})
}

func TestUserScopedQueriesRejectUnauthenticatedCallers(t *testing.T) {
	t.Parallel()

	// None of the feature services are wired: each resolver must reject the
	// request before it can read anything.
	resolver := &Resolver{UserService: service.NewUserService(&graphUserQuerierMock{})}
	query := resolver.Query()

	_, err := query.Assets(context.Background())
	require.ErrorContains(t, err, errCodeUnauthorized)

	_, err = query.Budgets(context.Background())
	require.ErrorContains(t, err, errCodeUnauthorized)

	_, err = query.Transactions(context.Background(), nil, nil)
	require.ErrorContains(t, err, errCodeUnauthorized)

	_, err = query.PlaidConnections(context.Background())
	require.ErrorContains(t, err, errCodeUnauthorized)
}

func TestAssetsReadsAuthenticatedUser(t *testing.T) {
	t.Parallel()

	authUserID := uuid.New()
	var queriedFor uuid.UUID

	resolver := &Resolver{
		UserService: service.NewUserService(&graphUserQuerierMock{
			user: sqlc.User{ID: authUserID, IdentityProviderID: "clerk-user-1"},
		}),
		AssetService: service.NewAssetService(&recordingAssetQuerier{listFor: &queriedFor}),
	}
	ctx := middleware.WithDevUserID(context.Background(), "clerk-user-1")

	_, err := resolver.Query().Assets(ctx)

	require.NoError(t, err)
	assert.Equal(t, authUserID, queriedFor)
}
