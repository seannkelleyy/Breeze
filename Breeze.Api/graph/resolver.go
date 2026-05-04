package graph

import "breeze.api/internal/service"

// Resolver wires gqlgen resolvers to service-layer dependencies.
type Resolver struct {
	HealthService           *service.HealthService
	UserService             *service.UserService
	AssetService            *service.AssetService
	LiabilityService        *service.LiabilityService
	BudgetService           *service.BudgetService
	GoalService             *service.GoalService
	RetirementService       *service.RetirementAccountService
	ExpenseCategoryService  *service.ExpenseCategoryService
	ExpenseService          *service.ExpenseService
	IncomeService           *service.IncomeService
	RecurringIncomeService  *service.RecurringIncomeService
	TaxBracketService       *service.TaxBracketService
	NetWorthSnapshotService *service.NetWorthSnapshotService
}
