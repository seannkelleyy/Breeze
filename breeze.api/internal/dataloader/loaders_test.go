package dataloader

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMiddleware_PopulatesContext(t *testing.T) {
	batchFn := func(ctx context.Context, keys []string) ([]*User, []error) {
		users := make([]*User, len(keys))
		for i, k := range keys {
			users[i] = &User{ID: k, Name: "Test"}
		}
		return users, nil
	}
	h := Middleware(batchFn, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		loader := FromContext(ctx)
		assert.NotNil(t, loader)
	}))
	req, _ := http.NewRequest("GET", "/", nil)
	h.ServeHTTP(nil, req)
}
