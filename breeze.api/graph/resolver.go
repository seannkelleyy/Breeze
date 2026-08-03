package graph

import (
	"context"
	"errors"
	"fmt"

	"breeze.api/internal/middleware"
	"breeze.api/internal/service"
	"github.com/google/uuid"
)

// Resolver wires gqlgen resolvers to service-layer dependencies.
type Resolver struct {
	HealthService           *service.HealthService
	UserService             *service.UserService
	AssetService            *service.AssetService
	LiabilityService        *service.LiabilityService
	BudgetService           *service.BudgetService
	GoalService             *service.GoalService
	ScenarioService         *service.ScenarioService
	RetirementService       *service.RetirementAccountService
	PlaidService            *service.PlaidService
	ExpenseCategoryService  *service.ExpenseCategoryService
	ExpenseService          *service.ExpenseService
	IncomeService           *service.IncomeService
	RecurringIncomeService  *service.RecurringIncomeService
	RecurringExpenseService *service.RecurringExpenseService
	PlannerPersonService    *service.PlannerPersonService
	TaxBracketService       *service.TaxBracketService
	TaxPlanningService      *service.TaxPlanningService
	RetirementLadderService *service.RetirementLadderService
	NetWorthSnapshotService *service.NetWorthSnapshotService
}

// resolveUserIDFromCtx extracts the authenticated user's internal UUID from
// the request context by looking up the Clerk identity provider ID.
func resolveUserIDFromCtx(ctx context.Context, userService *service.UserService) (uuid.UUID, error) {
	identityProviderID := middleware.UserIDFromCtx(ctx)
	if identityProviderID == "" {
		return uuid.Nil, fmt.Errorf("no authenticated user in context")
	}

	user, err := userService.GetByIdentityProviderID(ctx, identityProviderID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("resolve authenticated user: %w", err)
	}

	return user.ID, nil
}

// mapErr converts service-layer sentinel errors into user-facing GraphQL
// errors. Unexpected errors are logged and masked with a generic message.
func (r *Resolver) mapErr(ctx context.Context, err error) error {
	if err == nil {
		return nil
	}

	code := errCodeInternal
	switch {
	case errors.Is(err, service.ErrNotFound):
		code = errCodeNotFound
	case errors.Is(err, service.ErrUnauthorized):
		code = errCodeUnauthorized
	case errors.Is(err, service.ErrSplitMismatch),
		errors.Is(err, service.ErrNoSplits),
		errors.Is(err, service.ErrSplitAmountNonPositive),
		errors.Is(err, service.ErrContributionLimitExceeded),
		errors.Is(err, service.ErrContributionAmountNonPositive),
		errors.Is(err, service.ErrInvalidScenarioInput):
		code = errCodeValidation
	}

	if code == errCodeInternal {
		logger := middleware.LoggerFromCtx(ctx)
		logger.Error("unexpected service error", "error", err)
		return fmt.Errorf("[%s] internal server error", code)
	}

	return fmt.Errorf("[%s] %s", code, err.Error())
}

const (
	errCodeNotFound     = "NOT_FOUND"
	errCodeUnauthorized = "UNAUTHORIZED"
	errCodeValidation   = "VALIDATION_ERROR"
	errCodeInternal     = "INTERNAL_ERROR"
)
