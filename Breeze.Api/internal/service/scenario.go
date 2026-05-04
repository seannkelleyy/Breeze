package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ScenarioProfile struct {
	ID                 uuid.UUID
	UserID             uuid.UUID
	Name               string
	CurrentAge         int
	RetirementAge      int
	AnnualSpend        decimal.Decimal
	SafeWithdrawalRate decimal.Decimal
	InflationRate      decimal.Decimal
	ReturnRate         decimal.Decimal
	CurrentPortfolio   decimal.Decimal
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type ScenarioResult struct {
	ScenarioProfileID     uuid.UUID
	Name                  string
	CurrentAge            int
	RetirementAge         int
	AnnualSpend           decimal.Decimal
	SafeWithdrawalRate    decimal.Decimal
	InflationRate         decimal.Decimal
	ReturnRate            decimal.Decimal
	CurrentPortfolio      decimal.Decimal
	PortfolioAtRetirement decimal.Decimal
	RequiredPortfolio     decimal.Decimal
	ProjectedDepletionAge *int
	IsSustainable         bool
	CreatedAt             time.Time
	UpdatedAt             time.Time
}

type CreateScenarioInput struct {
	UserID             uuid.UUID
	Name               string
	CurrentAge         int
	RetirementAge      int
	AnnualSpend        decimal.Decimal
	SafeWithdrawalRate decimal.Decimal
	InflationRate      decimal.Decimal
	ReturnRate         decimal.Decimal
	CurrentPortfolio   decimal.Decimal
}

type UpdateScenarioInput struct {
	ID                 uuid.UUID
	Name               string
	CurrentAge         int
	RetirementAge      int
	AnnualSpend        decimal.Decimal
	SafeWithdrawalRate decimal.Decimal
	InflationRate      decimal.Decimal
	ReturnRate         decimal.Decimal
	CurrentPortfolio   decimal.Decimal
}

type scenarioQuerier interface {
	CreateScenarioProfile(ctx context.Context, arg sqlc.CreateScenarioProfileParams) (sqlc.ScenarioProfile, error)
	GetScenarioProfileByID(ctx context.Context, id uuid.UUID) (sqlc.ScenarioProfile, error)
	ListScenarioProfilesByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ScenarioProfile, error)
	UpdateScenarioProfile(ctx context.Context, arg sqlc.UpdateScenarioProfileParams) (sqlc.ScenarioProfile, error)
	SoftDeleteScenarioProfile(ctx context.Context, id uuid.UUID) (int64, error)
	UpsertScenarioResultCache(ctx context.Context, arg sqlc.UpsertScenarioResultCacheParams) (sqlc.ScenarioResultsCache, error)
	ListScenarioComparisonsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListScenarioComparisonsByUserIDRow, error)
}

type scenarioTxRunner interface {
	Run(ctx context.Context, fn func(q scenarioQuerier) error) error
}

type scenarioTxRunnerFunc func(ctx context.Context, fn func(q scenarioQuerier) error) error

func (f scenarioTxRunnerFunc) Run(ctx context.Context, fn func(q scenarioQuerier) error) error {
	return f(ctx, fn)
}

type scenarioTxRunnerImpl struct {
	pool    *pgxpool.Pool
	queries *sqlc.Queries
}

func (r *scenarioTxRunnerImpl) Run(ctx context.Context, fn func(q scenarioQuerier) error) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	qtx := r.queries.WithTx(tx)
	if err := fn(qtx); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	return nil
}

type ScenarioService struct {
	queries  scenarioQuerier
	txRunner scenarioTxRunner
}

func NewScenarioService(queries *sqlc.Queries, pool *pgxpool.Pool) *ScenarioService {
	return &ScenarioService{
		queries: queries,
		txRunner: &scenarioTxRunnerImpl{
			pool:    pool,
			queries: queries,
		},
	}
}

func (s *ScenarioService) Create(ctx context.Context, input CreateScenarioInput) (*ScenarioProfile, error) {
	if err := validateScenarioInput(input.CurrentAge, input.RetirementAge, input.AnnualSpend, input.SafeWithdrawalRate, input.InflationRate, input.ReturnRate, input.CurrentPortfolio); err != nil {
		return nil, err
	}

	var created ScenarioProfile
	err := s.txRunner.Run(ctx, func(q scenarioQuerier) error {
		row, err := q.CreateScenarioProfile(ctx, sqlc.CreateScenarioProfileParams{
			UserID:             input.UserID,
			Name:               input.Name,
			CurrentAge:         int32(input.CurrentAge),
			RetirementAge:      int32(input.RetirementAge),
			AnnualSpend:        input.AnnualSpend,
			SafeWithdrawalRate: input.SafeWithdrawalRate,
			InflationRate:      input.InflationRate,
			ReturnRate:         input.ReturnRate,
			CurrentPortfolio:   input.CurrentPortfolio,
		})
		if err != nil {
			return fmt.Errorf("create scenario profile: %w", err)
		}

		result, err := evaluateScenarioProfile(row)
		if err != nil {
			return err
		}

		_, err = q.UpsertScenarioResultCache(ctx, sqlc.UpsertScenarioResultCacheParams{
			ScenarioProfileID:     row.ID,
			PortfolioAtRetirement: result.PortfolioAtRetirement,
			RequiredPortfolio:     result.RequiredPortfolio,
			ProjectedDepletionAge: int32PtrToPG(result.ProjectedDepletionAge),
			IsSustainable:         result.IsSustainable,
		})
		if err != nil {
			return fmt.Errorf("upsert scenario result cache: %w", err)
		}

		created = mapScenarioProfileRecord(row)
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &created, nil
}

func (s *ScenarioService) GetByID(ctx context.Context, id uuid.UUID) (*ScenarioProfile, error) {
	row, err := s.queries.GetScenarioProfileByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get scenario profile by id: %w", err)
	}

	profile := mapScenarioProfileRecord(row)
	return &profile, nil
}

func (s *ScenarioService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]ScenarioProfile, error) {
	rows, err := s.queries.ListScenarioProfilesByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list scenario profiles by user id: %w", err)
	}

	profiles := make([]ScenarioProfile, 0, len(rows))
	for _, row := range rows {
		profiles = append(profiles, mapScenarioProfileRecord(row))
	}

	return profiles, nil
}

func (s *ScenarioService) Update(ctx context.Context, input UpdateScenarioInput) (*ScenarioProfile, error) {
	if err := validateScenarioInput(input.CurrentAge, input.RetirementAge, input.AnnualSpend, input.SafeWithdrawalRate, input.InflationRate, input.ReturnRate, input.CurrentPortfolio); err != nil {
		return nil, err
	}

	var updated ScenarioProfile
	err := s.txRunner.Run(ctx, func(q scenarioQuerier) error {
		row, err := q.UpdateScenarioProfile(ctx, sqlc.UpdateScenarioProfileParams{
			ID:                 input.ID,
			Name:               input.Name,
			CurrentAge:         int32(input.CurrentAge),
			RetirementAge:      int32(input.RetirementAge),
			AnnualSpend:        input.AnnualSpend,
			SafeWithdrawalRate: input.SafeWithdrawalRate,
			InflationRate:      input.InflationRate,
			ReturnRate:         input.ReturnRate,
			CurrentPortfolio:   input.CurrentPortfolio,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrNotFound
			}
			return fmt.Errorf("update scenario profile: %w", err)
		}

		result, err := evaluateScenarioProfile(row)
		if err != nil {
			return err
		}

		_, err = q.UpsertScenarioResultCache(ctx, sqlc.UpsertScenarioResultCacheParams{
			ScenarioProfileID:     row.ID,
			PortfolioAtRetirement: result.PortfolioAtRetirement,
			RequiredPortfolio:     result.RequiredPortfolio,
			ProjectedDepletionAge: int32PtrToPG(result.ProjectedDepletionAge),
			IsSustainable:         result.IsSustainable,
		})
		if err != nil {
			return fmt.Errorf("upsert scenario result cache: %w", err)
		}

		updated = mapScenarioProfileRecord(row)
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &updated, nil
}

func (s *ScenarioService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteScenarioProfile(ctx, id)
	if err != nil {
		return fmt.Errorf("delete scenario profile: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *ScenarioService) CompareByUserID(ctx context.Context, userID uuid.UUID) ([]ScenarioResult, error) {
	rows, err := s.queries.ListScenarioComparisonsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list scenario comparisons by user id: %w", err)
	}

	results := make([]ScenarioResult, 0, len(rows))
	for _, row := range rows {
		results = append(results, mapScenarioComparisonRecord(row))
	}

	return results, nil
}

func validateScenarioInput(currentAge, retirementAge int, annualSpend, safeWithdrawalRate, inflationRate, returnRate, currentPortfolio decimal.Decimal) error {
	if currentAge < 0 || retirementAge < currentAge {
		return ErrInvalidScenarioInput
	}
	if annualSpend.IsNeg() || annualSpend.IsZero() || currentPortfolio.IsNeg() {
		return ErrInvalidScenarioInput
	}
	if safeWithdrawalRate.IsNeg() || safeWithdrawalRate.IsZero() {
		return ErrInvalidScenarioInput
	}
	if inflationRate.IsNeg() || returnRate.IsNeg() {
		return ErrInvalidScenarioInput
	}
	return nil
}

func evaluateScenarioProfile(row sqlc.ScenarioProfile) (ScenarioResult, error) {
	profile := mapScenarioProfileRecord(row)
	return evaluateScenarioResult(profile)
}

func evaluateScenarioResult(profile ScenarioProfile) (ScenarioResult, error) {
	yearsToRetirement := profile.RetirementAge - profile.CurrentAge
	if yearsToRetirement < 0 {
		yearsToRetirement = 0
	}

	one := decimal.MustParse("1")
	returnBase, err := one.Add(profile.ReturnRate)
	if err != nil {
		return ScenarioResult{}, fmt.Errorf("calculate return growth base: %w", err)
	}
	growthFactor, err := powDecimal(returnBase, yearsToRetirement)
	if err != nil {
		return ScenarioResult{}, fmt.Errorf("calculate portfolio growth: %w", err)
	}
	portfolioAtRetirement, err := profile.CurrentPortfolio.Mul(growthFactor)
	if err != nil {
		return ScenarioResult{}, fmt.Errorf("calculate portfolio at retirement: %w", err)
	}

	requiredPortfolio, err := profile.AnnualSpend.Quo(profile.SafeWithdrawalRate)
	if err != nil {
		return ScenarioResult{}, fmt.Errorf("calculate required portfolio: %w", err)
	}

	isSustainable := portfolioAtRetirement.Cmp(requiredPortfolio) >= 0
	var projectedDepletionAge *int
	if !isSustainable {
		projectedDepletionAge = simulateDepletionAge(profile, portfolioAtRetirement)
	}

	return ScenarioResult{
		ScenarioProfileID:     profile.ID,
		Name:                  profile.Name,
		CurrentAge:            profile.CurrentAge,
		RetirementAge:         profile.RetirementAge,
		AnnualSpend:           profile.AnnualSpend,
		SafeWithdrawalRate:    profile.SafeWithdrawalRate,
		InflationRate:         profile.InflationRate,
		ReturnRate:            profile.ReturnRate,
		CurrentPortfolio:      profile.CurrentPortfolio,
		PortfolioAtRetirement: portfolioAtRetirement,
		RequiredPortfolio:     requiredPortfolio,
		ProjectedDepletionAge: projectedDepletionAge,
		IsSustainable:         isSustainable,
		CreatedAt:             profile.CreatedAt,
		UpdatedAt:             profile.UpdatedAt,
	}, nil
}

func simulateDepletionAge(profile ScenarioProfile, startingBalance decimal.Decimal) *int {
	one := decimal.MustParse("1")
	returnBase, err := one.Add(profile.ReturnRate)
	if err != nil {
		return nil
	}
	inflationBase, err := one.Add(profile.InflationRate)
	if err != nil {
		return nil
	}

	balance := startingBalance
	annualSpend := profile.AnnualSpend
	for age := profile.RetirementAge; age <= 100; age++ {
		balance, err = balance.Mul(returnBase)
		if err != nil {
			return nil
		}
		balance, err = balance.Sub(annualSpend)
		if err != nil {
			return nil
		}
		if balance.IsNeg() || balance.IsZero() {
			depletionAge := age
			return &depletionAge
		}

		annualSpend, err = annualSpend.Mul(inflationBase)
		if err != nil {
			return nil
		}
	}

	return nil
}

func powDecimal(base decimal.Decimal, exponent int) (decimal.Decimal, error) {
	result := decimal.MustParse("1")
	if exponent <= 0 {
		return result, nil
	}

	for i := 0; i < exponent; i++ {
		var err error
		result, err = result.Mul(base)
		if err != nil {
			return decimal.Decimal{}, err
		}
	}

	return result, nil
}

func mapScenarioProfileRecord(row sqlc.ScenarioProfile) ScenarioProfile {
	return ScenarioProfile{
		ID:                 row.ID,
		UserID:             row.UserID,
		Name:               row.Name,
		CurrentAge:         int(row.CurrentAge),
		RetirementAge:      int(row.RetirementAge),
		AnnualSpend:        row.AnnualSpend,
		SafeWithdrawalRate: row.SafeWithdrawalRate,
		InflationRate:      row.InflationRate,
		ReturnRate:         row.ReturnRate,
		CurrentPortfolio:   row.CurrentPortfolio,
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}

func mapScenarioComparisonRecord(row sqlc.ListScenarioComparisonsByUserIDRow) ScenarioResult {
	var projectedDepletionAge *int
	if row.ProjectedDepletionAge != nil {
		value := int(*row.ProjectedDepletionAge)
		projectedDepletionAge = &value
	}

	return ScenarioResult{
		ScenarioProfileID:     row.ScenarioProfileID,
		Name:                  row.Name,
		CurrentAge:            int(row.CurrentAge),
		RetirementAge:         int(row.RetirementAge),
		AnnualSpend:           row.AnnualSpend,
		SafeWithdrawalRate:    row.SafeWithdrawalRate,
		InflationRate:         row.InflationRate,
		ReturnRate:            row.ReturnRate,
		CurrentPortfolio:      row.CurrentPortfolio,
		PortfolioAtRetirement: row.PortfolioAtRetirement,
		RequiredPortfolio:     row.RequiredPortfolio,
		ProjectedDepletionAge: projectedDepletionAge,
		IsSustainable:         row.IsSustainable,
		CreatedAt:             timestamptzToTime(row.ProfileCreatedAt),
		UpdatedAt:             timestamptzToTime(row.ProfileUpdatedAt),
	}
}

func int32PtrToPG(value *int) *int32 {
	if value == nil {
		return nil
	}
	converted := int32(*value)
	return &converted
}
