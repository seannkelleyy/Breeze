package service

import (
	"context"
	"os"
	"testing"

	"breeze.api/internal/db"
	dbsqlc "breeze.api/internal/db/sqlc"
	"github.com/govalues/decimal"
	"github.com/google/uuid"
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

// Helper functions

func ptrBool(b bool) *bool { return &b }

func mustDecimal(s string) decimal.Decimal {
	d, err := decimal.Parse(s)
	if err != nil {
		panic("mustDecimal: " + err.Error())
	}
	return d
}
