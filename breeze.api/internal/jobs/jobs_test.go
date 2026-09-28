package jobs

import (
	"context"
	"errors"
	"testing"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/riverqueue/river"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// fakePlaidSyncer records sync calls and simulates partial failures.
type fakePlaidSyncer struct {
	byUserConnections []sqlc.PlaidConnection
	allConnections    []sqlc.PlaidConnection
	listByUserErr     error
	listAllErr        error
	failSyncFor       map[uuid.UUID]bool
	syncedConnections []uuid.UUID
}

func (f *fakePlaidSyncer) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PlaidConnection, error) {
	return f.byUserConnections, f.listByUserErr
}

func (f *fakePlaidSyncer) ListAllConnections(ctx context.Context) ([]sqlc.PlaidConnection, error) {
	return f.allConnections, f.listAllErr
}

func (f *fakePlaidSyncer) SyncConnection(ctx context.Context, connectionID uuid.UUID) error {
	f.syncedConnections = append(f.syncedConnections, connectionID)
	if f.failSyncFor[connectionID] {
		return errors.New("sync failed")
	}
	return nil
}

func TestPlaidSyncWorker_InvalidUserID(t *testing.T) {
	worker := NewPlaidSyncWorker(&fakePlaidSyncer{})
	err := worker.Work(context.Background(), &river.Job[PlaidSyncArgs]{
		Args: PlaidSyncArgs{UserID: "not-a-uuid"},
	})
	assert.ErrorContains(t, err, "invalid user id")
}

func TestPlaidSyncWorker_ListError(t *testing.T) {
	userID := uuid.New()
	worker := NewPlaidSyncWorker(&fakePlaidSyncer{listByUserErr: errors.New("db down")})
	err := worker.Work(context.Background(), &river.Job[PlaidSyncArgs]{
		Args: PlaidSyncArgs{UserID: userID.String()},
	})
	assert.ErrorContains(t, err, "list plaid connections")
}

func TestPlaidSyncWorker_SyncsAllConnections_ContinuesPastFailures(t *testing.T) {
	first, second, third := uuid.New(), uuid.New(), uuid.New()
	fake := &fakePlaidSyncer{
		byUserConnections: []sqlc.PlaidConnection{
			{ID: first}, {ID: second}, {ID: third},
		},
		failSyncFor: map[uuid.UUID]bool{second: true},
	}

	worker := NewPlaidSyncWorker(fake)
	err := worker.Work(context.Background(), &river.Job[PlaidSyncArgs]{
		Args: PlaidSyncArgs{UserID: uuid.New().String()},
	})
	require.NoError(t, err, "one connection failing must not fail the whole job")
	assert.Equal(t, []uuid.UUID{first, second, third}, fake.syncedConnections, "all connections should be attempted in order")
}

func TestPlaidSyncAllWorker_SyncsEveryConnection_ContinuesPastFailures(t *testing.T) {
	first, second := uuid.New(), uuid.New()
	fake := &fakePlaidSyncer{
		allConnections: []sqlc.PlaidConnection{{ID: first}, {ID: second}},
		failSyncFor:    map[uuid.UUID]bool{second: true},
	}

	worker := NewPlaidSyncAllWorker(fake)
	err := worker.Work(context.Background(), &river.Job[PlaidSyncAllArgs]{})
	require.NoError(t, err)
	assert.Equal(t, []uuid.UUID{first, second}, fake.syncedConnections)
}

func TestPlaidSyncAllWorker_ListError(t *testing.T) {
	worker := NewPlaidSyncAllWorker(&fakePlaidSyncer{listAllErr: errors.New("db down")})
	err := worker.Work(context.Background(), &river.Job[PlaidSyncAllArgs]{})
	assert.ErrorContains(t, err, "list plaid connections")
}
