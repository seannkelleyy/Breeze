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
	ScenarioService         *service.ScenarioService
	RetirementService       *service.RetirementAccountService
	PlaidService            *service.PlaidService
	ExpenseCategoryService  *service.ExpenseCategoryService
	ExpenseService          *service.ExpenseService
	IncomeService           *service.IncomeService
	RecurringIncomeService  *service.RecurringIncomeService
	TaxBracketService       *service.TaxBracketService
	TaxPlanningService      *service.TaxPlanningService
	NetWorthSnapshotService *service.NetWorthSnapshotService
}
