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
)

// ContributionLimit is the IRS annual contribution limit for one account type
// in one tax year, including the age-based catch-up amount. Reference data —
// seeded per year, read by the planner's IRS-limit features.
type ContributionLimit struct {
	ID                 uuid.UUID
	AccountType        sqlc.RetirementAccountType
	TaxYear            int
	AnnualLimit        decimal.Decimal
	CatchUpAge         int
	CatchUpAmount      decimal.Decimal
	SuperCatchUpAmount decimal.Decimal
	FamilyAnnualLimit  *decimal.Decimal
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type contributionLimitQuerier interface {
	GetContributionLimitByAccountTypeAndTaxYear(ctx context.Context, arg sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error)
	ListContributionLimitsByTaxYear(ctx context.Context, taxYear int32) ([]sqlc.ContributionLimit, error)
}

type ContributionLimitService struct {
	queries contributionLimitQuerier
}

func NewContributionLimitService(queries contributionLimitQuerier) *ContributionLimitService {
	return &ContributionLimitService{queries: queries}
}

func (s *ContributionLimitService) GetByAccountTypeAndYear(ctx context.Context, accountType sqlc.RetirementAccountType, taxYear int) (*ContributionLimit, error) {
	row, err := s.queries.GetContributionLimitByAccountTypeAndTaxYear(ctx, sqlc.GetContributionLimitByAccountTypeAndTaxYearParams{
		AccountType: accountType,
		TaxYear:     int32(taxYear),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get contribution limit: %w", err)
	}

	limit := mapContributionLimitRecord(&row)
	return &limit, nil
}

func (s *ContributionLimitService) ListByTaxYear(ctx context.Context, taxYear int) ([]ContributionLimit, error) {
	rows, err := s.queries.ListContributionLimitsByTaxYear(ctx, int32(taxYear))
	if err != nil {
		return nil, fmt.Errorf("list contribution limits by tax year: %w", err)
	}

	limits := make([]ContributionLimit, 0, len(rows))
	for i := range rows {
		limits = append(limits, mapContributionLimitRecord(&rows[i]))
	}

	return limits, nil
}

func mapContributionLimitRecord(row *sqlc.ContributionLimit) ContributionLimit {
	return ContributionLimit{
		ID:                 row.ID,
		AccountType:        row.AccountType,
		TaxYear:            int(row.TaxYear),
		AnnualLimit:        row.AnnualLimit,
		CatchUpAge:         int(row.CatchUpAge),
		CatchUpAmount:      row.CatchUpAmount,
		SuperCatchUpAmount: row.SuperCatchUpAmount,
		FamilyAnnualLimit:  pgtypeNumericToDecimal(row.FamilyAnnualLimit),
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}
