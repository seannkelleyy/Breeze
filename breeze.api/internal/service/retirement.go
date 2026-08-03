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
	"github.com/jackc/pgx/v5/pgtype"
)

type RetirementAccount struct {
	ID                      uuid.UUID
	UserID                  uuid.UUID
	Name                    string
	AccountType             sqlc.RetirementAccountType
	Owner                   sqlc.RetirementAccountOwner
	TaxTreatment            sqlc.RetirementTaxTreatment
	CurrentBalance          decimal.Decimal
	AnnualContributionLimit decimal.Decimal
	CreatedAt               time.Time
	UpdatedAt               time.Time
}

type ContributionEntry struct {
	ID                  uuid.UUID
	RetirementAccountID uuid.UUID
	TaxYear             int
	ContributionDate    time.Time
	Amount              decimal.Decimal
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type ContributionProgress struct {
	RetirementAccountID uuid.UUID
	TaxYear             int
	AnnualLimit         decimal.Decimal
	ContributedYtd      decimal.Decimal
	RemainingAmount     decimal.Decimal
	PercentUsed         decimal.Decimal
	IsMaxed             bool
}

type CreateRetirementAccountInput struct {
	UserID         uuid.UUID
	Name           string
	AccountType    sqlc.RetirementAccountType
	Owner          sqlc.RetirementAccountOwner
	TaxTreatment   sqlc.RetirementTaxTreatment
	CurrentBalance decimal.Decimal
}

type UpdateRetirementAccountInput struct {
	ID             uuid.UUID
	Name           string
	AccountType    sqlc.RetirementAccountType
	Owner          sqlc.RetirementAccountOwner
	TaxTreatment   sqlc.RetirementTaxTreatment
	CurrentBalance decimal.Decimal
}

type AddContributionInput struct {
	RetirementAccountID uuid.UUID
	ContributionDate    time.Time
	Amount              decimal.Decimal
}

type retirementQuerier interface {
	CreateRetirementAccount(ctx context.Context, arg sqlc.CreateRetirementAccountParams) (sqlc.RetirementAccount, error)
	GetRetirementAccountByID(ctx context.Context, id uuid.UUID) (sqlc.RetirementAccount, error)
	ListRetirementAccountsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.RetirementAccount, error)
	UpdateRetirementAccount(ctx context.Context, arg sqlc.UpdateRetirementAccountParams) (sqlc.RetirementAccount, error)
	SoftDeleteRetirementAccount(ctx context.Context, id uuid.UUID) (int64, error)
	CreateContributionEntry(ctx context.Context, arg sqlc.CreateContributionEntryParams) (sqlc.ContributionEntry, error)
	GetContributionLimitByAccountTypeAndTaxYear(ctx context.Context, arg sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error)
	GetContributionProgress(ctx context.Context, arg sqlc.GetContributionProgressParams) (sqlc.GetContributionProgressRow, error)
}

type RetirementAccountService struct {
	queries retirementQuerier
}

func NewRetirementAccountService(queries retirementQuerier) *RetirementAccountService {
	return &RetirementAccountService{queries: queries}
}

func (s *RetirementAccountService) Create(ctx context.Context, input CreateRetirementAccountInput) (*RetirementAccount, error) {
	if input.CurrentBalance.IsNeg() {
		return nil, fmt.Errorf("current balance must be non-negative")
	}

	limit, err := s.queries.GetContributionLimitByAccountTypeAndTaxYear(ctx, sqlc.GetContributionLimitByAccountTypeAndTaxYearParams{
		AccountType: input.AccountType,
		TaxYear:     int32(time.Now().UTC().Year()),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get contribution limit: %w", err)
	}

	row, err := s.queries.CreateRetirementAccount(ctx, sqlc.CreateRetirementAccountParams{
		UserID:                  input.UserID,
		Name:                    input.Name,
		AccountType:             input.AccountType,
		Owner:                   input.Owner,
		TaxTreatment:            input.TaxTreatment,
		CurrentBalance:          input.CurrentBalance,
		AnnualContributionLimit: limit.AnnualLimit,
	})
	if err != nil {
		return nil, fmt.Errorf("create retirement account: %w", err)
	}

	account := mapRetirementAccountRecord(row)
	return &account, nil
}

func (s *RetirementAccountService) GetByID(ctx context.Context, id uuid.UUID) (*RetirementAccount, error) {
	row, err := s.queries.GetRetirementAccountByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get retirement account by id: %w", err)
	}

	account := mapRetirementAccountRecord(row)
	return &account, nil
}

func (s *RetirementAccountService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]RetirementAccount, error) {
	rows, err := s.queries.ListRetirementAccountsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list retirement accounts by user id: %w", err)
	}

	accounts := make([]RetirementAccount, 0, len(rows))
	for _, row := range rows {
		accounts = append(accounts, mapRetirementAccountRecord(row))
	}

	return accounts, nil
}

func (s *RetirementAccountService) Update(ctx context.Context, input UpdateRetirementAccountInput) (*RetirementAccount, error) {
	if input.CurrentBalance.IsNeg() {
		return nil, fmt.Errorf("current balance must be non-negative")
	}

	limit, err := s.queries.GetContributionLimitByAccountTypeAndTaxYear(ctx, sqlc.GetContributionLimitByAccountTypeAndTaxYearParams{
		AccountType: input.AccountType,
		TaxYear:     int32(time.Now().UTC().Year()),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get contribution limit: %w", err)
	}

	row, err := s.queries.UpdateRetirementAccount(ctx, sqlc.UpdateRetirementAccountParams{
		ID:                      input.ID,
		Name:                    input.Name,
		AccountType:             input.AccountType,
		Owner:                   input.Owner,
		TaxTreatment:            input.TaxTreatment,
		CurrentBalance:          input.CurrentBalance,
		AnnualContributionLimit: limit.AnnualLimit,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update retirement account: %w", err)
	}

	account := mapRetirementAccountRecord(row)
	return &account, nil
}

func (s *RetirementAccountService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteRetirementAccount(ctx, id)
	if err != nil {
		return fmt.Errorf("delete retirement account: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *RetirementAccountService) AddContribution(ctx context.Context, input AddContributionInput) (*ContributionEntry, error) {
	if input.Amount.IsNeg() || input.Amount.IsZero() {
		return nil, ErrContributionAmountNonPositive
	}

	taxYear := input.ContributionDate.Year()
	progress, err := s.queries.GetContributionProgress(ctx, sqlc.GetContributionProgressParams{
		ID:      input.RetirementAccountID,
		TaxYear: int32(taxYear),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get contribution progress: %w", err)
	}

	currentTotal := progress.ContributedYtd
	projectedTotal, err := currentTotal.Add(input.Amount)
	if err != nil {
		return nil, fmt.Errorf("calculate projected contribution total: %w", err)
	}
	if projectedTotal.Cmp(progress.AnnualLimit) > 0 {
		return nil, ErrContributionLimitExceeded
	}

	row, err := s.queries.CreateContributionEntry(ctx, sqlc.CreateContributionEntryParams{
		RetirementAccountID: input.RetirementAccountID,
		TaxYear:             int32(taxYear),
		ContributionDate:    pgtype.Date{Time: input.ContributionDate, Valid: true},
		Amount:              input.Amount,
	})
	if err != nil {
		return nil, fmt.Errorf("create contribution entry: %w", err)
	}

	entry := mapContributionEntryRecord(row)
	return &entry, nil
}

func (s *RetirementAccountService) GetContributionProgress(ctx context.Context, retirementAccountID uuid.UUID, taxYear int) (*ContributionProgress, error) {
	row, err := s.queries.GetContributionProgress(ctx, sqlc.GetContributionProgressParams{
		ID:      retirementAccountID,
		TaxYear: int32(taxYear),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get contribution progress: %w", err)
	}

	progress, err := mapContributionProgressRecord(row)
	if err != nil {
		return nil, err
	}
	return &progress, nil
}

func mapRetirementAccountRecord(row sqlc.RetirementAccount) RetirementAccount {
	return RetirementAccount{
		ID:                      row.ID,
		UserID:                  row.UserID,
		Name:                    row.Name,
		AccountType:             row.AccountType,
		Owner:                   row.Owner,
		TaxTreatment:            row.TaxTreatment,
		CurrentBalance:          row.CurrentBalance,
		AnnualContributionLimit: row.AnnualContributionLimit,
		CreatedAt:               timestamptzToTime(row.CreatedAt),
		UpdatedAt:               timestamptzToTime(row.UpdatedAt),
	}
}

func mapContributionEntryRecord(row sqlc.ContributionEntry) ContributionEntry {
	return ContributionEntry{
		ID:                  row.ID,
		RetirementAccountID: row.RetirementAccountID,
		TaxYear:             int(row.TaxYear),
		ContributionDate:    row.ContributionDate.Time,
		Amount:              row.Amount,
		CreatedAt:           timestamptzToTime(row.CreatedAt),
		UpdatedAt:           timestamptzToTime(row.UpdatedAt),
	}
}

func mapContributionProgressRecord(row sqlc.GetContributionProgressRow) (ContributionProgress, error) {
	remaining, err := row.AnnualLimit.Sub(row.ContributedYtd)
	if err != nil {
		return ContributionProgress{}, fmt.Errorf("calculate remaining contribution limit: %w", err)
	}
	percentUsed := decimal.Zero
	if !row.AnnualLimit.IsZero() {
		ratio, err := row.ContributedYtd.Quo(row.AnnualLimit)
		if err != nil {
			return ContributionProgress{}, fmt.Errorf("calculate contribution ratio: %w", err)
		}
		percentUsed, err = ratio.Mul(decimal.MustParse("100"))
		if err != nil {
			return ContributionProgress{}, fmt.Errorf("calculate contribution percent: %w", err)
		}
		percentUsed = percentUsed.Round(2)
	}

	return ContributionProgress{
		RetirementAccountID: row.RetirementAccountID,
		TaxYear:             int(row.TaxYear),
		AnnualLimit:         row.AnnualLimit,
		ContributedYtd:      row.ContributedYtd,
		RemainingAmount:     remaining,
		PercentUsed:         percentUsed,
		IsMaxed:             remaining.IsZero() || remaining.IsNeg(),
	}, nil
}
