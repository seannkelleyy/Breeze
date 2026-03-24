package dataloader

import (
	"context"
	"time"

	"github.com/vikstrous/dataloadgen"
)

type User struct {
	ID   string
	Name string
}

type UserLoader struct {
	loader *dataloadgen.Loader[string, *User]
}

func NewUserLoader(fetch func(ctx context.Context, keys []string) ([]*User, []error)) *UserLoader {
	return &UserLoader{
		loader: dataloadgen.NewLoader(fetch, dataloadgen.WithWait(2*time.Millisecond)),
	}
}

func (l *UserLoader) Load(ctx context.Context, key string) (*User, error) {
	return l.loader.Load(ctx, key)
}
