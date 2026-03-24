package dataloader

import (
	"context"
	"net/http"
)

type Loaders struct {
	UserLoader *UserLoader
}

type loadersKeyType struct{}

var loadersKey loadersKeyType

// Middleware injects DataLoaders into the request context.
func Middleware(userBatchFn func(ctx context.Context, keys []string) ([]*User, []error), next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		loaders := &Loaders{
			UserLoader: NewUserLoader(userBatchFn),
		}
		ctx := context.WithValue(r.Context(), loadersKey, loaders)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func FromContext(ctx context.Context) *Loaders {
	loaders, _ := ctx.Value(loadersKey).(*Loaders)
	return loaders
}

// Usage in resolvers:
// func (r *queryResolver) User(ctx context.Context, id string) (*model.User, error) {
//     loaders := dataloader.FromContext(ctx)
//     return loaders.UserLoader.Load(ctx, id)
// }
