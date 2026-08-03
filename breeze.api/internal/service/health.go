package service

import (
	"context"
	"time"
)

type Health struct {
	Status    string
	Timestamp time.Time
}

type HealthService struct{}

func NewHealthService() *HealthService {
	return &HealthService{}
}

func (s *HealthService) Get(ctx context.Context) (*Health, error) {
	_ = ctx
	return &Health{
		Status:    "ok",
		Timestamp: time.Now().UTC(),
	}, nil
}
