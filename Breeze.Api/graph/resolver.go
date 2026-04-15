package graph

import "breeze.api/internal/service"

// Resolver wires gqlgen resolvers to service-layer dependencies.
type Resolver struct {
	HealthService *service.HealthService
	UserService   *service.UserService
	AssetService  *service.AssetService
}
