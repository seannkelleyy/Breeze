package service

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

type mockScenarioQuerier struct {
	createScenarioProfileFunc           func(context.Context, sqlc.CreateScenarioProfileParams) (sqlc.ScenarioProfile, error)
	getScenarioProfileByIDFunc          func(context.Context, uuid.UUID) (sqlc.ScenarioProfile, error)
	listScenarioProfilesByUserIDFunc    func(context.Context, uuid.UUID) ([]sqlc.ScenarioProfile, error)
	updateScenarioProfileFunc           func(context.Context, sqlc.UpdateScenarioProfileParams) (sqlc.ScenarioProfile, error)
	softDeleteScenarioProfileFunc       func(context.Context, uuid.UUID) (int64, error)
	upsertScenarioResultCacheFunc       func(context.Context, sqlc.UpsertScenarioResultCacheParams) (sqlc.ScenarioResultsCache, error)
	listScenarioComparisonsByUserIDFunc func(context.Context, uuid.UUID) ([]sqlc.ListScenarioComparisonsByUserIDRow, error)
}

func (m *mockScenarioQuerier) CreateScenarioProfile(ctx context.Context, arg sqlc.CreateScenarioProfileParams) (sqlc.ScenarioProfile, error) {
	if m.createScenarioProfileFunc != nil {
		return m.createScenarioProfileFunc(ctx, arg)
	}
	return sqlc.ScenarioProfile{}, nil
}

func (m *mockScenarioQuerier) GetScenarioProfileByID(ctx context.Context, id uuid.UUID) (sqlc.ScenarioProfile, error) {
	if m.getScenarioProfileByIDFunc != nil {
		return m.getScenarioProfileByIDFunc(ctx, id)
	}
	return sqlc.ScenarioProfile{}, nil
}

func (m *mockScenarioQuerier) ListScenarioProfilesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ScenarioProfile, error) {
	if m.listScenarioProfilesByUserIDFunc != nil {
		return m.listScenarioProfilesByUserIDFunc(ctx, userID)
	}
	return []sqlc.ScenarioProfile{}, nil
}

func (m *mockScenarioQuerier) UpdateScenarioProfile(ctx context.Context, arg sqlc.UpdateScenarioProfileParams) (sqlc.ScenarioProfile, error) {
	if m.updateScenarioProfileFunc != nil {
		return m.updateScenarioProfileFunc(ctx, arg)
	}
	return sqlc.ScenarioProfile{}, nil
}

func (m *mockScenarioQuerier) SoftDeleteScenarioProfile(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteScenarioProfileFunc != nil {
		return m.softDeleteScenarioProfileFunc(ctx, id)
	}
	return 0, nil
}

func (m *mockScenarioQuerier) UpsertScenarioResultCache(ctx context.Context, arg sqlc.UpsertScenarioResultCacheParams) (sqlc.ScenarioResultsCache, error) {
	if m.upsertScenarioResultCacheFunc != nil {
		return m.upsertScenarioResultCacheFunc(ctx, arg)
	}
	return sqlc.ScenarioResultsCache{}, nil
}

func (m *mockScenarioQuerier) ListScenarioComparisonsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListScenarioComparisonsByUserIDRow, error) {
	if m.listScenarioComparisonsByUserIDFunc != nil {
		return m.listScenarioComparisonsByUserIDFunc(ctx, userID)
	}
	return []sqlc.ListScenarioComparisonsByUserIDRow{}, nil
}

func testScenarioProfileRow() sqlc.ScenarioProfile {
	annualSpend, _ := decimal.Parse("48000.00")
	swr, _ := decimal.Parse("0.0400")
	inflation, _ := decimal.Parse("0.0250")
	returnRate, _ := decimal.Parse("0.0600")
	portfolio, _ := decimal.Parse("500000.00")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.ScenarioProfile{
		ID:                 uuid.New(),
		UserID:             uuid.New(),
		Name:               "Base FIRE",
		CurrentAge:         35,
		RetirementAge:      60,
		AnnualSpend:        annualSpend,
		SafeWithdrawalRate: swr,
		InflationRate:      inflation,
		ReturnRate:         returnRate,
		CurrentPortfolio:   portfolio,
		CreatedAt:          timestamp,
		UpdatedAt:          timestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func testScenarioComparisonRow() sqlc.ListScenarioComparisonsByUserIDRow {
	annualSpend, _ := decimal.Parse("48000.00")
	swr, _ := decimal.Parse("0.0400")
	inflation, _ := decimal.Parse("0.0250")
	returnRate, _ := decimal.Parse("0.0600")
	portfolio, _ := decimal.Parse("500000.00")
	portfolioAtRetirement, _ := decimal.Parse("1200000.00")
	requiredPortfolio, _ := decimal.Parse("1200000.00")
	resultCreatedAt := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
	resultUpdatedAt := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
	projectedAge := int32(92)

	return sqlc.ListScenarioComparisonsByUserIDRow{
		ScenarioProfileID:     uuid.New(),
		UserID:                uuid.New(),
		Name:                  "Base FIRE",
		CurrentAge:            35,
		RetirementAge:         60,
		AnnualSpend:           annualSpend,
		SafeWithdrawalRate:    swr,
		InflationRate:         inflation,
		ReturnRate:            returnRate,
		CurrentPortfolio:      portfolio,
		ProfileCreatedAt:      resultCreatedAt,
		ProfileUpdatedAt:      resultUpdatedAt,
		PortfolioAtRetirement: portfolioAtRetirement,
		RequiredPortfolio:     requiredPortfolio,
		ProjectedDepletionAge: &projectedAge,
		IsSustainable:         true,
		ResultCreatedAt:       resultCreatedAt,
		ResultUpdatedAt:       resultUpdatedAt,
	}
}

func TestScenarioService_Create(t *testing.T) {
	ctx := context.Background()
	row := testScenarioProfileRow()
	annualSpend := row.AnnualSpend
	storedResult := false
	mock := &mockScenarioQuerier{
		createScenarioProfileFunc: func(ctx context.Context, arg sqlc.CreateScenarioProfileParams) (sqlc.ScenarioProfile, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.Name, arg.Name)
			return row, nil
		},
		upsertScenarioResultCacheFunc: func(ctx context.Context, arg sqlc.UpsertScenarioResultCacheParams) (sqlc.ScenarioResultsCache, error) {
			storedResult = arg.IsSustainable
			assert.Equal(t, row.ID, arg.ScenarioProfileID)
			assert.NotZero(t, arg.PortfolioAtRetirement)
			assert.NotZero(t, arg.RequiredPortfolio)
			return sqlc.ScenarioResultsCache{}, nil
		},
	}

	svc := &ScenarioService{queries: mock, txRunner: scenarioTxRunnerFunc(func(ctx context.Context, fn func(q scenarioQuerier) error) error {
		return fn(mock)
	})}

	result, err := svc.Create(ctx, CreateScenarioInput{
		UserID:             row.UserID,
		Name:               row.Name,
		CurrentAge:         int(row.CurrentAge),
		RetirementAge:      int(row.RetirementAge),
		AnnualSpend:        annualSpend,
		SafeWithdrawalRate: row.SafeWithdrawalRate,
		InflationRate:      row.InflationRate,
		ReturnRate:         row.ReturnRate,
		CurrentPortfolio:   row.CurrentPortfolio,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
	assert.True(t, storedResult)
}

func TestScenarioService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testScenarioProfileRow()

	mock := &mockScenarioQuerier{
		getScenarioProfileByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.ScenarioProfile, error) {
			assert.Equal(t, row.ID, id)
			return row, nil
		},
	}

	svc := NewScenarioService(nil, nil)
	svc.queries = mock
	svc.txRunner = scenarioTxRunnerFunc(func(ctx context.Context, fn func(q scenarioQuerier) error) error { return nil })

	result, err := svc.GetByID(ctx, row.ID)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

func TestScenarioService_CompareByUserID(t *testing.T) {
	ctx := context.Background()
	row := testScenarioComparisonRow()

	mock := &mockScenarioQuerier{
		listScenarioComparisonsByUserIDFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.ListScenarioComparisonsByUserIDRow, error) {
			assert.Equal(t, row.UserID, userID)
			return []sqlc.ListScenarioComparisonsByUserIDRow{row}, nil
		},
	}

	svc := NewScenarioService(nil, nil)
	svc.queries = mock
	svc.txRunner = scenarioTxRunnerFunc(func(ctx context.Context, fn func(q scenarioQuerier) error) error { return nil })

	result, err := svc.CompareByUserID(ctx, row.UserID)
	assert.NoError(t, err)
	assert.Len(t, result, 1)
}

func TestScenarioService_ValidateInput(t *testing.T) {
	_, err := (&ScenarioService{}).Create(context.Background(), CreateScenarioInput{
		UserID:             uuid.New(),
		Name:               "Invalid",
		CurrentAge:         60,
		RetirementAge:      50,
		AnnualSpend:        decimal.MustParse("0"),
		SafeWithdrawalRate: decimal.MustParse("0.04"),
		InflationRate:      decimal.MustParse("0.02"),
		ReturnRate:         decimal.MustParse("0.06"),
		CurrentPortfolio:   decimal.MustParse("100000"),
	})
	assert.ErrorIs(t, err, ErrInvalidScenarioInput)
}
