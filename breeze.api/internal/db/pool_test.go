package db

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewPool_Error(t *testing.T) {
	ctx := context.Background()

	pool, err := NewPool(ctx, "invalid-url")
	assert.Error(t, err)
	assert.Nil(t, pool)
}
