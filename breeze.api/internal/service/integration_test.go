package service

import (
	"context"
	"os"
	"testing"
	"time"

	"breeze.api/internal/db"
	dbsqlc "breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// getTestPool returns a database connection pool for integration tests.
// Skips the test if DATABASE_URL is not set or connection fails.
func getTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}
	pool, err := db.NewPool(context.Background(), databaseURL)
	require.NoError(t, err, "failed to connect to test database")
	t.Cleanup(func() { pool.Close() })
	return pool
}

// createTestUser creates a user directly via sqlc and returns the row.
func createTestUser(t *testing.T, q *dbsqlc.Queries) dbsqlc.CreateUserRow {
	t.Helper()
	ctx := context.Background()
	row, err := q.CreateUser(ctx, dbsqlc.CreateUserParams{
		IdentityProviderID: "test-ipid-" + uuid.New().String(),
		Email:              "test-" + uuid.New().String() + "@example.com",
		ReturnType:         dbsqlc.ReturnTypeREAL,
		SafeWithdrawalRate: mustDecimal("0.0400"),
		CurrencyType:       "USD",
		InflationRate:      mustDecimal("0.0300"),
		DeductionType:      dbsqlc.DeductionTypeSTANDARD,
		FilingStatus:       dbsqlc.FilingStatusSINGLE,
		PayoffStrategy:     dbsqlc.PayoffStrategyAVALANCHE,
	})
	require.NoError(t, err, "failed to create test user")
	return row
}

// cleanupUser deletes a test user by ID.
func cleanupUser(t *testing.T, q *dbsqlc.Queries, userID uuid.UUID) {
	t.Helper()
	_, _ = q.SoftDeleteUser(context.Background(), userID)
}

func TestIntegration_UserSetupFields(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	svc := NewUserService(q)

	t.Run("initial values are defaults", func(t *testing.T) {
		user, err := svc.GetByIdentityProviderID(ctx, userRow.IdentityProviderID)
		require.NoError(t, err)
		assert.False(t, user.BudgetEnabled, "budget_enabled should default to false")
		assert.Nil(t, user.MonthlyExpenses, "monthly_expenses should default to nil")
		assert.False(t, user.SetupCompleted, "setup_completed should default to false")
		assert.False(t, user.DisclaimerAccepted, "disclaimer_accepted should default to false")
		assert.Nil(t, user.DisclaimerAcceptedAt, "disclaimer_accepted_at should default to nil")
	})

	t.Run("update setup fields persists correctly", func(t *testing.T) {
		monthlyExpenses := mustDecimal("3500.00")
		_, err := svc.UpdateSetup(ctx, UpdateSetupInput{
			ID:                 userRow.ID,
			BudgetEnabled:      ptrBool(true),
			MonthlyExpenses:    &monthlyExpenses,
			SetupCompleted:     ptrBool(true),
			DisclaimerAccepted: ptrBool(true),
		})
		require.NoError(t, err)

		// Verify the update persisted
		user, err := svc.GetByIdentityProviderID(ctx, userRow.IdentityProviderID)
		require.NoError(t, err)
		assert.True(t, user.BudgetEnabled)
		assert.NotNil(t, user.MonthlyExpenses)
		assert.Equal(t, "3500.00", user.MonthlyExpenses.String())
		assert.True(t, user.SetupCompleted)
		assert.True(t, user.DisclaimerAccepted)
		assert.NotNil(t, user.DisclaimerAcceptedAt)
	})

	t.Run("partial update preserves other fields", func(t *testing.T) {
		// Only update budget_enabled, leave others unchanged
		_, err := svc.UpdateSetup(ctx, UpdateSetupInput{
			ID:            userRow.ID,
			BudgetEnabled: ptrBool(false),
		})
		require.NoError(t, err)

		user, err := svc.GetByIdentityProviderID(ctx, userRow.IdentityProviderID)
		require.NoError(t, err)
		assert.False(t, user.BudgetEnabled, "budget_enabled should be updated")
		assert.True(t, user.SetupCompleted, "setup_completed should be preserved")
		assert.True(t, user.DisclaimerAccepted, "disclaimer_accepted should be preserved")
	})
}

func TestIntegration_GoalsWithFOO(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	svc := NewGoalService(q)

	t.Run("create goal persists all fields", func(t *testing.T) {
		targetAmount := mustDecimal("10000.00")
		goal, err := svc.Create(ctx, CreateGoalInput{
			UserID:       userRow.ID,
			Description:  "Emergency fund",
			IsCompleted:  false,
			TargetAmount: &targetAmount,
			Priority:     1,
			Category:     ptrString("emergency_fund"),
		})
		require.NoError(t, err)
		assert.Equal(t, "Emergency fund", goal.Description)
		assert.NotNil(t, goal.TargetAmount)
		assert.Equal(t, "10000.00", goal.TargetAmount.String())
		assert.Equal(t, "emergency_fund", *goal.Category)
		assert.Equal(t, int32(1), goal.Priority)
		assert.False(t, goal.IsFinancialOrderStep)
		assert.Nil(t, goal.FinancialOrderStep)
	})

	t.Run("create financial order steps", func(t *testing.T) {
		goals, err := svc.CreateFinancialOrderSteps(ctx, userRow.ID)
		require.NoError(t, err)
		assert.Len(t, goals, 10, "should create 10 FOO steps")

		for i, g := range goals {
			assert.True(t, g.IsFinancialOrderStep, "step %d should be marked as FOO", i)
			assert.NotNil(t, g.FinancialOrderStep, "step %d should have step number", i)
			assert.Equal(t, int32(i+1), *g.FinancialOrderStep, "step %d should have correct number", i)
			assert.False(t, g.IsCompleted, "step %d should start as not completed", i)
		}
	})

	t.Run("list goals returns FOO and regular goals", func(t *testing.T) {
		// Create a regular goal
		_, err := svc.Create(ctx, CreateGoalInput{
			UserID:      userRow.ID,
			Description: "Save for vacation",
			IsCompleted: false,
			Priority:    2,
		})
		require.NoError(t, err)

		goals, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)

		fooCount := 0
		regularCount := 0
		for _, g := range goals {
			if g.IsFinancialOrderStep {
				fooCount++
			} else {
				regularCount++
			}
		}
		assert.Equal(t, 10, fooCount, "should have 10 FOO steps")
		assert.GreaterOrEqual(t, regularCount, 2, "should have at least 2 regular goals")
	})

	t.Run("update goal completion", func(t *testing.T) {
		goals, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)

		// Find first FOO step
		var firstFOO *Goal
		for i := range goals {
			if goals[i].IsFinancialOrderStep && goals[i].FinancialOrderStep != nil && *goals[i].FinancialOrderStep == 1 {
				firstFOO = &goals[i]
				break
			}
		}
		require.NotNil(t, firstFOO, "should find first FOO step")

		updated, err := svc.Update(ctx, UpdateGoalInput{
			ID:          firstFOO.ID,
			Description: firstFOO.Description,
			IsCompleted: true,
			Priority:    firstFOO.Priority,
		})
		require.NoError(t, err)
		assert.True(t, updated.IsCompleted)

		// Verify persistence
		fetched, err := svc.GetByID(ctx, firstFOO.ID)
		require.NoError(t, err)
		assert.True(t, fetched.IsCompleted)
	})
}

func TestIntegration_AssetLiabilityLinking(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	assetSvc := NewAssetService(q)
	liabilitySvc := NewLiabilityService(q)

	t.Run("create asset with linked liability", func(t *testing.T) {
		// Create liability first
		liability, err := liabilitySvc.Create(ctx, CreateLiabilityInput{
			UserID:             userRow.ID,
			Name:               "Home Mortgage",
			LiabilityType:      dbsqlc.LiabilityTypeMORTGAGE,
			CurrentBalance:     mustDecimal("250000.00"),
			InterestRate:       mustDecimal("0.0650"),
			MinimumPayment:     mustDecimal("1500.00"),
			TargetExtraPayment: mustDecimal("0.00"),
			ContributionMode:   "monthly",
			ContributionValue:  mustDecimal("1500.00"),
			PersonIDs:          []uuid.UUID{},
		})
		require.NoError(t, err)

		// Create asset with linked liability
		asset, err := assetSvc.Create(ctx, CreateAssetInput{
			UserID:                          userRow.ID,
			Name:                            "My Home",
			AssetType:                       dbsqlc.AssetTypeHOME,
			CurrentValue:                    mustDecimal("350000.00"),
			ContributionMode:                "monthly",
			ContributionValue:               mustDecimal("0.00"),
			EmployerMatchRate:               mustDecimal("0.00"),
			EmployerMatchMaxPercentOfSalary: mustDecimal("0.00"),
			AnnualRate:                      mustDecimal("0.0400"),
			PersonIDs:                       []uuid.UUID{},
			LinkedLiabilityID:               &liability.ID,
		})
		require.NoError(t, err)
		assert.NotNil(t, asset.LinkedLiabilityID)
		assert.Equal(t, liability.ID, *asset.LinkedLiabilityID)
	})

	t.Run("list assets returns linked liability ID", func(t *testing.T) {
		assets, err := assetSvc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)

		var homeAsset *Asset
		for i := range assets {
			if assets[i].Name == "My Home" {
				homeAsset = &assets[i]
				break
			}
		}
		require.NotNil(t, homeAsset, "should find home asset")
		assert.NotNil(t, homeAsset.LinkedLiabilityID, "home should have linked liability")

		// Verify the linked liability exists
		liability, err := liabilitySvc.GetByID(ctx, *homeAsset.LinkedLiabilityID)
		require.NoError(t, err)
		assert.Equal(t, "Home Mortgage", liability.Name)
	})

	t.Run("unlink liability from asset", func(t *testing.T) {
		assets, err := assetSvc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)

		var homeAsset *Asset
		for i := range assets {
			if assets[i].Name == "My Home" {
				homeAsset = &assets[i]
				break
			}
		}
		require.NotNil(t, homeAsset)

		updated, err := assetSvc.Update(ctx, UpdateAssetInput{
			ID:                              homeAsset.ID,
			Name:                            homeAsset.Name,
			AssetType:                       homeAsset.AssetType,
			CurrentValue:                    homeAsset.CurrentValue,
			ContributionMode:                homeAsset.ContributionMode,
			ContributionValue:               homeAsset.ContributionValue,
			EmployerMatchRate:               mustDecimal("0.00"),
			EmployerMatchMaxPercentOfSalary: mustDecimal("0.00"),
			AnnualRate:                      homeAsset.AnnualRate,
			PersonIDs:                       homeAsset.PersonIDs,
			LinkedLiabilityID:               nil, // Unlink
		})
		require.NoError(t, err)
		assert.Nil(t, updated.LinkedLiabilityID)

		// Verify persistence
		fetched, err := assetSvc.GetByID(ctx, homeAsset.ID)
		require.NoError(t, err)
		assert.Nil(t, fetched.LinkedLiabilityID)
	})
}

func TestIntegration_WeightedMonthlyExpenses(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	expenseSvc := NewExpenseService(dbsqlc.New(pool), pool)

	t.Run("returns zero when no expenses exist", func(t *testing.T) {
		result, err := expenseSvc.GetWeightedMonthlyExpenses(ctx, userRow.ID)
		require.NoError(t, err)
		assert.True(t, result.IsZero(), "should return zero when no expenses exist")
	})
}

func TestIntegration_UserCRUD(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	svc := NewUserService(q)

	t.Run("create and retrieve user with all fields", func(t *testing.T) {
		swr := mustDecimal("0.0350")
		ir := mustDecimal("0.0250")
		deductionAmt := mustDecimal("12000.00")

		created, err := svc.Create(ctx, CreateUserInput{
			IdentityProviderID: "test-crud-" + uuid.New().String(),
			Email:              "crud-" + uuid.New().String() + "@example.com",
			ReturnType:         dbsqlc.ReturnTypeNOMINAL,
			SafeWithdrawalRate: swr,
			CurrencyType:       "EUR",
			InflationRate:      ir,
			DeductionType:      dbsqlc.DeductionTypeITEMIZED,
			DeductionAmount:    &deductionAmt,
			FilingStatus:       dbsqlc.FilingStatusMFJ,
			PayoffStrategy:     dbsqlc.PayoffStrategySNOWBALL,
		})
		require.NoError(t, err)
		defer cleanupUser(t, q, created.ID)

		// Verify all fields persisted
		fetched, err := svc.GetByID(ctx, created.ID)
		require.NoError(t, err)
		assert.Equal(t, "EUR", fetched.CurrencyType)
		assert.Equal(t, dbsqlc.ReturnTypeNOMINAL, fetched.ReturnType)
		assert.Equal(t, dbsqlc.DeductionTypeITEMIZED, fetched.DeductionType)
		assert.Equal(t, dbsqlc.FilingStatusMFJ, fetched.FilingStatus)
		assert.Equal(t, dbsqlc.PayoffStrategySNOWBALL, fetched.PayoffStrategy)
		assert.NotNil(t, fetched.DeductionAmount)
		assert.Equal(t, "12000.00", fetched.DeductionAmount.String())
	})

	t.Run("update user preferences", func(t *testing.T) {
		ipid := "test-update-" + uuid.New().String()
		created, err := svc.Create(ctx, CreateUserInput{
			IdentityProviderID: ipid,
			Email:              "update-" + uuid.New().String() + "@example.com",
			ReturnType:         dbsqlc.ReturnTypeREAL,
			SafeWithdrawalRate: mustDecimal("0.0400"),
			CurrencyType:       "USD",
			InflationRate:      mustDecimal("0.0300"),
			DeductionType:      dbsqlc.DeductionTypeSTANDARD,
			FilingStatus:       dbsqlc.FilingStatusSINGLE,
			PayoffStrategy:     dbsqlc.PayoffStrategyAVALANCHE,
		})
		require.NoError(t, err)
		defer cleanupUser(t, q, created.ID)

		newSWR := mustDecimal("0.0350")
		newIR := mustDecimal("0.0200")
		updated, err := svc.Update(ctx, UpdateUserInput{
			ID:                 created.ID,
			IdentityProviderID: ipid,
			Email:              created.Email,
			ReturnType:         dbsqlc.ReturnTypeNOMINAL,
			SafeWithdrawalRate: newSWR,
			CurrencyType:       "GBP",
			InflationRate:      newIR,
			DeductionType:      dbsqlc.DeductionTypeSTANDARD,
			FilingStatus:       dbsqlc.FilingStatusSINGLE,
			PayoffStrategy:     dbsqlc.PayoffStrategyAVALANCHE,
		})
		require.NoError(t, err)
		assert.Equal(t, "GBP", updated.CurrencyType)
		assert.Equal(t, dbsqlc.ReturnTypeNOMINAL, updated.ReturnType)
	})

	t.Run("get by identity provider ID", func(t *testing.T) {
		ipid := "test-ipid-" + uuid.New().String()
		created, err := svc.Create(ctx, CreateUserInput{
			IdentityProviderID: ipid,
			Email:              "ipid-" + uuid.New().String() + "@example.com",
			ReturnType:         dbsqlc.ReturnTypeREAL,
			SafeWithdrawalRate: mustDecimal("0.0400"),
			CurrencyType:       "USD",
			InflationRate:      mustDecimal("0.0300"),
			DeductionType:      dbsqlc.DeductionTypeSTANDARD,
			FilingStatus:       dbsqlc.FilingStatusSINGLE,
			PayoffStrategy:     dbsqlc.PayoffStrategyAVALANCHE,
		})
		require.NoError(t, err)
		defer cleanupUser(t, q, created.ID)

		fetched, err := svc.GetByIdentityProviderID(ctx, ipid)
		require.NoError(t, err)
		assert.Equal(t, created.ID, fetched.ID)
		assert.Equal(t, created.Email, fetched.Email)
	})

	t.Run("soft delete prevents retrieval", func(t *testing.T) {
		created, err := svc.Create(ctx, CreateUserInput{
			IdentityProviderID: "test-delete-" + uuid.New().String(),
			Email:              "delete-" + uuid.New().String() + "@example.com",
			ReturnType:         dbsqlc.ReturnTypeREAL,
			SafeWithdrawalRate: mustDecimal("0.0400"),
			CurrencyType:       "USD",
			InflationRate:      mustDecimal("0.0300"),
			DeductionType:      dbsqlc.DeductionTypeSTANDARD,
			FilingStatus:       dbsqlc.FilingStatusSINGLE,
			PayoffStrategy:     dbsqlc.PayoffStrategyAVALANCHE,
		})
		require.NoError(t, err)

		err = svc.Delete(ctx, created.ID)
		require.NoError(t, err)

		_, err = svc.GetByID(ctx, created.ID)
		assert.ErrorIs(t, err, ErrNotFound)
	})
}

func TestIntegration_PlannerPersonLifecycle(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	svc := NewPlannerPersonService(q)

	t.Run("upsert and list persons", func(t *testing.T) {
		person1 := UpsertPlannerPersonInput{
			ID:               uuid.New(),
			UserID:           userRow.ID,
			Name:             "Alice",
			Birthday:         "1990-05-15",
			RetirementAge:    65,
			AnnualSalary:     mustDecimal("120000.00"),
			BonusMode:        "dollars",
			AnnualBonus:      mustDecimal("10000.00"),
			IncomeGrowthRate: mustDecimal("3.00"),
		}
		person2 := UpsertPlannerPersonInput{
			ID:               uuid.New(),
			UserID:           userRow.ID,
			Name:             "Bob",
			Birthday:         "1988-03-20",
			RetirementAge:    60,
			AnnualSalary:     mustDecimal("95000.00"),
			BonusMode:        "salary-percent",
			AnnualBonus:      mustDecimal("15.00"),
			IncomeGrowthRate: mustDecimal("2.50"),
		}

		_, err := svc.Upsert(ctx, person1)
		require.NoError(t, err)
		_, err = svc.Upsert(ctx, person2)
		require.NoError(t, err)

		persons, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)
		assert.Len(t, persons, 2)

		names := make(map[string]bool)
		for _, p := range persons {
			names[p.Name] = true
		}
		assert.True(t, names["Alice"])
		assert.True(t, names["Bob"])
	})

	t.Run("upsert updates existing person by ID", func(t *testing.T) {
		persons, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)

		var alice *PlannerPerson
		for i := range persons {
			if persons[i].Name == "Alice" {
				alice = &persons[i]
				break
			}
		}
		require.NotNil(t, alice)

		// Upsert Alice again with updated salary
		updatedAlice := UpsertPlannerPersonInput{
			ID:               alice.ID,
			UserID:           userRow.ID,
			Name:             "Alice",
			Birthday:         "1990-05-15",
			RetirementAge:    65,
			AnnualSalary:     mustDecimal("130000.00"),
			BonusMode:        "dollars",
			AnnualBonus:      mustDecimal("12000.00"),
			IncomeGrowthRate: mustDecimal("3.50"),
		}
		_, err = svc.Upsert(ctx, updatedAlice)
		require.NoError(t, err)

		persons, err = svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)

		alice = nil
		for i := range persons {
			if persons[i].Name == "Alice" {
				alice = &persons[i]
				break
			}
		}
		require.NotNil(t, alice)
		assert.Equal(t, "130000.00", alice.AnnualSalary.String())
	})

	t.Run("delete person", func(t *testing.T) {
		persons, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)
		require.Len(t, persons, 2)

		err = svc.Delete(ctx, persons[0].ID)
		require.NoError(t, err)

		remaining, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)
		assert.Len(t, remaining, 1)
	})
}

func TestIntegration_BudgetExpenseLifecycle(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	budgetSvc := NewBudgetService(q)
	expenseSvc := NewExpenseService(dbsqlc.New(pool), pool)
	categorySvc := NewExpenseCategoryService(q)

	t.Run("create budget with expenses and categories", func(t *testing.T) {
		// Create budget
		budgetDate := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
		budget, err := budgetSvc.Create(ctx, CreateBudgetInput{
			UserID:          userRow.ID,
			Date:            budgetDate,
			MonthlyIncome:   mustDecimal("10000.00"),
			MonthlyExpenses: mustDecimal("7000.00"),
		})
		require.NoError(t, err)

		// Create category
		category, err := categorySvc.Create(ctx, CreateExpenseCategoryInput{
			UserID:       userRow.ID,
			BudgetID:     budget.ID,
			Name:         "Groceries",
			Allocation:   mustDecimal("800.00"),
			CurrentSpend: mustDecimal("0.00"),
			SourceType:   dbsqlc.ExpenseSourceTypeMANUAL,
		})
		require.NoError(t, err)

		// Create expense
		expenseDate := time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC)
		expense, err := expenseSvc.Create(ctx, CreateExpenseInput{
			UserID:      userRow.ID,
			BudgetID:    budget.ID,
			Amount:      mustDecimal("150.00"),
			Date:        expenseDate,
			Description: "Weekly groceries",
			SourceType:  dbsqlc.ExpenseSourceTypeMANUAL,
			Splits: []ExpenseSplitInput{
				{CategoryID: category.ID, Amount: mustDecimal("150.00")},
			},
		})
		require.NoError(t, err)
		assert.Equal(t, "150.00", expense.Amount.String())

		// Verify expense list
		expenses, err := expenseSvc.ListByBudgetID(ctx, budget.ID)
		require.NoError(t, err)
		assert.Len(t, expenses, 1)
		assert.Equal(t, "Weekly groceries", expenses[0].Description)
	})

	t.Run("budget totals are correct", func(t *testing.T) {
		budgets, err := budgetSvc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)
		require.Len(t, budgets, 1)

		budget := budgets[0]
		assert.Equal(t, "10000.00", budget.MonthlyIncome.String())
		assert.Equal(t, "7000.00", budget.MonthlyExpenses.String())
	})
}

func TestIntegration_GoalWithConnectedAccounts(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	goalSvc := NewGoalService(q)
	assetSvc := NewAssetService(q)

	t.Run("goal with connected account IDs persists", func(t *testing.T) {
		// Create an asset
		asset, err := assetSvc.Create(ctx, CreateAssetInput{
			UserID:                          userRow.ID,
			Name:                            "Emergency Fund",
			AssetType:                       dbsqlc.AssetTypeEMERGENCYFUND,
			CurrentValue:                    mustDecimal("5000.00"),
			ContributionMode:                "monthly",
			ContributionValue:               mustDecimal("500.00"),
			EmployerMatchRate:               mustDecimal("0.00"),
			EmployerMatchMaxPercentOfSalary: mustDecimal("0.00"),
			AnnualRate:                      mustDecimal("0.0400"),
			PersonIDs:                       []uuid.UUID{},
		})
		require.NoError(t, err)

		// Create goal connected to the asset
		goal, err := goalSvc.Create(ctx, CreateGoalInput{
			UserID:              userRow.ID,
			Description:         "Build 6-month emergency fund",
			IsCompleted:         false,
			Priority:            1,
			Category:            ptrString("emergency_fund"),
			ConnectedAccountIDs: []uuid.UUID{asset.ID},
		})
		require.NoError(t, err)

		// Verify connected accounts persist
		fetched, err := goalSvc.GetByID(ctx, goal.ID)
		require.NoError(t, err)
		assert.Len(t, fetched.ConnectedAccountIDs, 1)
		assert.Equal(t, asset.ID, fetched.ConnectedAccountIDs[0])
	})

	t.Run("goal with multiple connected accounts", func(t *testing.T) {
		// Create another asset
		asset2, err := assetSvc.Create(ctx, CreateAssetInput{
			UserID:                          userRow.ID,
			Name:                            "House Down Payment",
			AssetType:                       dbsqlc.AssetTypeBROKERAGE,
			CurrentValue:                    mustDecimal("15000.00"),
			ContributionMode:                "monthly",
			ContributionValue:               mustDecimal("1000.00"),
			EmployerMatchRate:               mustDecimal("0.00"),
			EmployerMatchMaxPercentOfSalary: mustDecimal("0.00"),
			AnnualRate:                      mustDecimal("0.0700"),
			PersonIDs:                       []uuid.UUID{},
		})
		require.NoError(t, err)

		goal, err := goalSvc.Create(ctx, CreateGoalInput{
			UserID:              userRow.ID,
			Description:         "Save for house down payment",
			IsCompleted:         false,
			Priority:            2,
			TargetAmount:        ptrDecimal(mustDecimal("50000.00")),
			ConnectedAccountIDs: []uuid.UUID{asset2.ID},
		})
		require.NoError(t, err)

		fetched, err := goalSvc.GetByID(ctx, goal.ID)
		require.NoError(t, err)
		assert.NotNil(t, fetched.TargetAmount)
		assert.Equal(t, "50000.00", fetched.TargetAmount.String())
		assert.Len(t, fetched.ConnectedAccountIDs, 1)
	})
}

func TestIntegration_AssetReturnProfile(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	svc := NewAssetService(q)

	t.Run("return profile persists through create and update", func(t *testing.T) {
		asset, err := svc.Create(ctx, CreateAssetInput{
			UserID:                          userRow.ID,
			Name:                            "401k",
			AssetType:                       dbsqlc.AssetType401K,
			CurrentValue:                    mustDecimal("50000.00"),
			ContributionMode:                "monthly",
			ContributionValue:               mustDecimal("1625.00"),
			EmployerMatchRate:               mustDecimal("0.06"),
			EmployerMatchMaxPercentOfSalary: mustDecimal("0.50"),
			AnnualRate:                      mustDecimal("0.1000"),
			PersonIDs:                       []uuid.UUID{},
			ReturnProfile:                   ptrString("stocks"),
		})
		require.NoError(t, err)

		// Verify return profile persisted
		fetched, err := svc.GetByID(ctx, asset.ID)
		require.NoError(t, err)
		assert.NotNil(t, fetched.ReturnProfile)
		assert.Equal(t, "stocks", *fetched.ReturnProfile)

		// Update return profile
		updated, err := svc.Update(ctx, UpdateAssetInput{
			ID:                              fetched.ID,
			Name:                            fetched.Name,
			AssetType:                       fetched.AssetType,
			CurrentValue:                    fetched.CurrentValue,
			ContributionMode:                fetched.ContributionMode,
			ContributionValue:               fetched.ContributionValue,
			EmployerMatchRate:               mustDecimal("0.06"),
			EmployerMatchMaxPercentOfSalary: mustDecimal("0.50"),
			AnnualRate:                      mustDecimal("0.0700"),
			PersonIDs:                       fetched.PersonIDs,
			ReturnProfile:                   ptrString("bonds"),
		})
		require.NoError(t, err)
		assert.Equal(t, "bonds", *updated.ReturnProfile)
	})

	t.Run("null return profile persists", func(t *testing.T) {
		asset, err := svc.Create(ctx, CreateAssetInput{
			UserID:                          userRow.ID,
			Name:                            "Checking",
			AssetType:                       dbsqlc.AssetTypeCHECKING,
			CurrentValue:                    mustDecimal("10000.00"),
			ContributionMode:                "monthly",
			ContributionValue:               mustDecimal("0.00"),
			EmployerMatchRate:               mustDecimal("0.00"),
			EmployerMatchMaxPercentOfSalary: mustDecimal("0.00"),
			AnnualRate:                      mustDecimal("0.0100"),
			PersonIDs:                       []uuid.UUID{},
		})
		require.NoError(t, err)

		fetched, err := svc.GetByID(ctx, asset.ID)
		require.NoError(t, err)
		assert.Nil(t, fetched.ReturnProfile)
	})
}

func TestIntegration_LiabilityCRUD(t *testing.T) {
	pool := getTestPool(t)
	q := dbsqlc.New(pool)
	ctx := context.Background()

	userRow := createTestUser(t, q)
	defer cleanupUser(t, q, userRow.ID)

	svc := NewLiabilityService(q)

	t.Run("create and retrieve liability with all fields", func(t *testing.T) {
		origLoan := mustDecimal("250000.00")
		liability, err := svc.Create(ctx, CreateLiabilityInput{
			UserID:             userRow.ID,
			Name:               "Home Mortgage",
			LiabilityType:      dbsqlc.LiabilityTypeMORTGAGE,
			CurrentBalance:     mustDecimal("200000.00"),
			OriginalLoanAmount: &origLoan,
			InterestRate:       mustDecimal("0.0650"),
			MinimumPayment:     mustDecimal("1500.00"),
			TargetExtraPayment: mustDecimal("200.00"),
			PayoffPriority:     1,
			ContributionMode:   "monthly",
			ContributionValue:  mustDecimal("1700.00"),
			PersonIDs:          []uuid.UUID{},
		})
		require.NoError(t, err)

		fetched, err := svc.GetByID(ctx, liability.ID)
		require.NoError(t, err)
		assert.Equal(t, "Home Mortgage", fetched.Name)
		assert.Equal(t, dbsqlc.LiabilityTypeMORTGAGE, fetched.LiabilityType)
		assert.Equal(t, "200000.00", fetched.CurrentBalance.String())
		assert.NotNil(t, fetched.OriginalLoanAmount)
		assert.Equal(t, "250000.00", fetched.OriginalLoanAmount.String())
		assert.Equal(t, "0.0650", fetched.InterestRate.String())
		assert.Equal(t, "1500.00", fetched.MinimumPayment.String())
	})

	t.Run("update liability balance", func(t *testing.T) {
		liabilities, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)
		require.Len(t, liabilities, 1)

		liability := liabilities[0]
		updated, err := svc.Update(ctx, UpdateLiabilityInput{
			ID:                 liability.ID,
			Name:               liability.Name,
			LiabilityType:      liability.LiabilityType,
			CurrentBalance:     mustDecimal("195000.00"),
			OriginalLoanAmount: liability.OriginalLoanAmount,
			InterestRate:       liability.InterestRate,
			MinimumPayment:     liability.MinimumPayment,
			TargetExtraPayment: mustDecimal("0.00"),
			PayoffPriority:     1,
			ContributionMode:   liability.ContributionMode,
			ContributionValue:  liability.ContributionValue,
			PersonIDs:          liability.PersonIDs,
		})
		require.NoError(t, err)
		assert.Equal(t, "195000.00", updated.CurrentBalance.String())
	})

	t.Run("list returns all liability types", func(t *testing.T) {
		// Add a credit card
		_, err := svc.Create(ctx, CreateLiabilityInput{
			UserID:             userRow.ID,
			Name:               "Visa",
			LiabilityType:      dbsqlc.LiabilityTypeCREDITCARD,
			CurrentBalance:     mustDecimal("5000.00"),
			InterestRate:       mustDecimal("0.1999"),
			MinimumPayment:     mustDecimal("150.00"),
			TargetExtraPayment: mustDecimal("0.00"),
			ContributionMode:   "monthly",
			ContributionValue:  mustDecimal("150.00"),
			PersonIDs:          []uuid.UUID{},
		})
		require.NoError(t, err)

		liabilities, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)
		assert.Len(t, liabilities, 2)

		types := make(map[dbsqlc.LiabilityType]bool)
		for _, l := range liabilities {
			types[l.LiabilityType] = true
		}
		assert.True(t, types[dbsqlc.LiabilityTypeMORTGAGE])
		assert.True(t, types[dbsqlc.LiabilityTypeCREDITCARD])
	})

	t.Run("soft delete removes from list", func(t *testing.T) {
		liabilities, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)

		err = svc.Delete(ctx, liabilities[0].ID)
		require.NoError(t, err)

		remaining, err := svc.ListByUserID(ctx, userRow.ID)
		require.NoError(t, err)
		assert.Len(t, remaining, 1)
	})
}

// Helper functions

func ptrBool(b bool) *bool { return &b }

func mustDecimal(s string) decimal.Decimal {
	d, err := decimal.Parse(s)
	if err != nil {
		panic("mustDecimal: " + err.Error())
	}
	return d
}
