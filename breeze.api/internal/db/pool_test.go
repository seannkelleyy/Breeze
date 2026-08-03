package db

import (
	"context"
	"testing"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestNewPool_Error(t *testing.T) {
	ctx := context.Background()

	pool, err := NewPool(ctx, "invalid-url")
	assert.Error(t, err)
	assert.Nil(t, pool)
}

func TestPgxMockPool(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	assert.NotNil(t, mock)
	mock.ExpectPing()
	assert.NoError(t, mock.Ping(context.Background()))
	assert.NoError(t, mock.ExpectationsWereMet())
}
