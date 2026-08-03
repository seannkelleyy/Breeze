package service

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

type mockRetirementQuerier struct {
	createRetirementAccountFunc                  func(context.Context, sqlc.CreateRetirementAccountParams) (sqlc.RetirementAccount, error)
	getRetirementAccountByIDFunc                 func(context.Context, uuid.UUID) (sqlc.RetirementAccount, error)
	listRetirementAccountsByUserIDFunc           func(context.Context, uuid.UUID) ([]sqlc.RetirementAccount, error)
	updateRetirementAccountFunc                  func(context.Context, sqlc.UpdateRetirementAccountParams) (sqlc.RetirementAccount, error)
	softDeleteRetirementAccountFunc              func(context.Context, uuid.UUID) (int64, error)
	createContributionEntryFunc                  func(context.Context, sqlc.CreateContributionEntryParams) (sqlc.ContributionEntry, error)
	getContributionLimitByAccountTypeAndYearFunc func(context.Context, sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error)
	getContributionProgressFunc                  func(context.Context, sqlc.GetContributionProgressParams) (sqlc.GetContributionProgressRow, error)
}

func (m *mockRetirementQuerier) CreateRetirementAccount(ctx context.Context, arg sqlc.CreateRetirementAccountParams) (sqlc.RetirementAccount, error) {
	if m.createRetirementAccountFunc != nil {
		return m.createRetirementAccountFunc(ctx, arg)
	}
	return sqlc.RetirementAccount{}, nil
}

func (m *mockRetirementQuerier) GetRetirementAccountByID(ctx context.Context, id uuid.UUID) (sqlc.RetirementAccount, error) {
	if m.getRetirementAccountByIDFunc != nil {
		return m.getRetirementAccountByIDFunc(ctx, id)
	}
	return sqlc.RetirementAccount{}, nil
}

func (m *mockRetirementQuerier) ListRetirementAccountsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.RetirementAccount, error) {
	if m.listRetirementAccountsByUserIDFunc != nil {
		return m.listRetirementAccountsByUserIDFunc(ctx, userID)
	}
	return []sqlc.RetirementAccount{}, nil
}

func (m *mockRetirementQuerier) UpdateRetirementAccount(ctx context.Context, arg sqlc.UpdateRetirementAccountParams) (sqlc.RetirementAccount, error) {
	if m.updateRetirementAccountFunc != nil {
		return m.updateRetirementAccountFunc(ctx, arg)
	}
	return sqlc.RetirementAccount{}, nil
}

func (m *mockRetirementQuerier) SoftDeleteRetirementAccount(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteRetirementAccountFunc != nil {
		return m.softDeleteRetirementAccountFunc(ctx, id)
	}
	return 0, nil
}

func (m *mockRetirementQuerier) CreateContributionEntry(ctx context.Context, arg sqlc.CreateContributionEntryParams) (sqlc.ContributionEntry, error) {
	if m.createContributionEntryFunc != nil {
		return m.createContributionEntryFunc(ctx, arg)
	}
	return sqlc.ContributionEntry{}, nil
}

func (m *mockRetirementQuerier) GetContributionLimitByAccountTypeAndTaxYear(ctx context.Context, arg sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
	if m.getContributionLimitByAccountTypeAndYearFunc != nil {
		return m.getContributionLimitByAccountTypeAndYearFunc(ctx, arg)
	}
	return sqlc.ContributionLimit{}, nil
}

func (m *mockRetirementQuerier) GetContributionProgress(ctx context.Context, arg sqlc.GetContributionProgressParams) (sqlc.GetContributionProgressRow, error) {
	if m.getContributionProgressFunc != nil {
		return m.getContributionProgressFunc(ctx, arg)
	}
	return sqlc.GetContributionProgressRow{}, nil
}

func testRetirementAccountRow() sqlc.RetirementAccount {
	balance, _ := decimal.Parse("12500.00")
	limit, _ := decimal.Parse("24500.00")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.RetirementAccount{
		ID:                      uuid.New(),
		UserID:                  uuid.New(),
		Name:                    "401k",
		AccountType:             sqlc.RetirementAccountTypeACCOUNT401K,
		Owner:                   sqlc.RetirementAccountOwnerSELF,
		TaxTreatment:            sqlc.RetirementTaxTreatmentPRETAX,
		CurrentBalance:          balance,
		AnnualContributionLimit: limit,
		CreatedAt:               timestamp,
		UpdatedAt:               timestamp,
		DeletedAt:               pgtype.Timestamptz{},
	}
}

func testContributionLimitRow() sqlc.ContributionLimit {
	annualLimit, _ := decimal.Parse("24500.00")
	catchUpAmount, _ := decimal.Parse("8000.00")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.ContributionLimit{
		ID:            uuid.New(),
		AccountType:   sqlc.RetirementAccountTypeACCOUNT401K,
		TaxYear:       2026,
		AnnualLimit:   annualLimit,
		CatchUpAge:    50,
		CatchUpAmount: catchUpAmount,
		CreatedAt:     timestamp,
		UpdatedAt:     timestamp,
		DeletedAt:     pgtype.Timestamptz{},
	}
}

func testContributionProgressRow() sqlc.GetContributionProgressRow {
	annualLimit, _ := decimal.Parse("24500.00")
	contributed, _ := decimal.Parse("6000.00")

	return sqlc.GetContributionProgressRow{
		RetirementAccountID: uuid.New(),
		TaxYear:             2026,
		AnnualLimit:         annualLimit,
		ContributedYtd:      contributed,
	}
}

func testContributionEntryRow() sqlc.ContributionEntry {
	amount, _ := decimal.Parse("500.00")
	contributionDate := pgtype.Date{Time: time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC), Valid: true}
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.ContributionEntry{
		ID:                  uuid.New(),
		RetirementAccountID: uuid.New(),
		TaxYear:             2026,
		ContributionDate:    contributionDate,
		Amount:              amount,
		CreatedAt:           timestamp,
		UpdatedAt:           timestamp,
		DeletedAt:           pgtype.Timestamptz{},
	}
}

func TestRetirementAccountService_Create(t *testing.T) {
	ctx := context.Background()
	row := testRetirementAccountRow()
	limit := testContributionLimitRow()

	mock := &mockRetirementQuerier{
		getContributionLimitByAccountTypeAndYearFunc: func(ctx context.Context, arg sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
			assert.Equal(t, row.AccountType, arg.AccountType)
			return limit, nil
		},
		createRetirementAccountFunc: func(ctx context.Context, arg sqlc.CreateRetirementAccountParams) (sqlc.RetirementAccount, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.Name, arg.Name)
			assert.Equal(t, row.AccountType, arg.AccountType)
			assert.Equal(t, row.CurrentBalance, arg.CurrentBalance)
			assert.Equal(t, limit.AnnualLimit, arg.AnnualContributionLimit)
			return row, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.Create(ctx, CreateRetirementAccountInput{
		UserID:         row.UserID,
		Name:           row.Name,
		AccountType:    row.AccountType,
		Owner:          row.Owner,
		TaxTreatment:   row.TaxTreatment,
		CurrentBalance: row.CurrentBalance,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestRetirementAccountService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testRetirementAccountRow()

	mock := &mockRetirementQuerier{
		getRetirementAccountByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.RetirementAccount, error) {
			assert.Equal(t, row.ID, id)
			return row, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.GetByID(ctx, row.ID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestRetirementAccountService_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()
	row := testRetirementAccountRow()

	mock := &mockRetirementQuerier{
		getRetirementAccountByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.RetirementAccount, error) {
			return sqlc.RetirementAccount{}, pgx.ErrNoRows
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.GetByID(ctx, row.ID)

	assert.ErrorIs(t, err, ErrNotFound)
	assert.Nil(t, result)
}

func TestRetirementAccountService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	row1 := testRetirementAccountRow()
	row2 := testRetirementAccountRow()
	row2.ID = uuid.New()

	mock := &mockRetirementQuerier{
		listRetirementAccountsByUserIDFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.RetirementAccount, error) {
			assert.Equal(t, row1.UserID, userID)
			return []sqlc.RetirementAccount{row1, row2}, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.ListByUserID(ctx, row1.UserID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestRetirementAccountService_Update(t *testing.T) {
	ctx := context.Background()
	row := testRetirementAccountRow()
	limit := testContributionLimitRow()
	updatedBalance, _ := decimal.Parse("15000.00")

	mock := &mockRetirementQuerier{
		getContributionLimitByAccountTypeAndYearFunc: func(ctx context.Context, arg sqlc.GetContributionLimitByAccountTypeAndTaxYearParams) (sqlc.ContributionLimit, error) {
			return limit, nil
		},
		updateRetirementAccountFunc: func(ctx context.Context, arg sqlc.UpdateRetirementAccountParams) (sqlc.RetirementAccount, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, updatedBalance, arg.CurrentBalance)
			updated := row
			updated.CurrentBalance = updatedBalance
			updated.AnnualContributionLimit = limit.AnnualLimit
			return updated, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.Update(ctx, UpdateRetirementAccountInput{
		ID:             row.ID,
		Name:           row.Name,
		AccountType:    row.AccountType,
		Owner:          row.Owner,
		TaxTreatment:   row.TaxTreatment,
		CurrentBalance: updatedBalance,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updatedBalance, result.CurrentBalance)
}

func TestRetirementAccountService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testRetirementAccountRow()

	mock := &mockRetirementQuerier{
		softDeleteRetirementAccountFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			assert.Equal(t, row.ID, id)
			return 1, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	err := svc.Delete(ctx, row.ID)
	assert.NoError(t, err)
}

func TestRetirementAccountService_AddContribution(t *testing.T) {
	ctx := context.Background()
	entry := testContributionEntryRow()
	progress := testContributionProgressRow()

	mock := &mockRetirementQuerier{
		getContributionProgressFunc: func(ctx context.Context, arg sqlc.GetContributionProgressParams) (sqlc.GetContributionProgressRow, error) {
			assert.Equal(t, entry.RetirementAccountID, arg.ID)
			assert.Equal(t, entry.TaxYear, int32(arg.TaxYear))
			return progress, nil
		},
		createContributionEntryFunc: func(ctx context.Context, arg sqlc.CreateContributionEntryParams) (sqlc.ContributionEntry, error) {
			assert.Equal(t, entry.RetirementAccountID, arg.RetirementAccountID)
			assert.Equal(t, entry.Amount, arg.Amount)
			return entry, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.AddContribution(ctx, AddContributionInput{
		RetirementAccountID: entry.RetirementAccountID,
		ContributionDate:    entry.ContributionDate.Time,
		Amount:              entry.Amount,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, entry.ID, result.ID)
}

func TestRetirementAccountService_AddContribution_LimitExceeded(t *testing.T) {
	ctx := context.Background()
	entry := testContributionEntryRow()
	limit, _ := decimal.Parse("6500.00")
	contributed, _ := decimal.Parse("6400.00")

	mock := &mockRetirementQuerier{
		getContributionProgressFunc: func(ctx context.Context, arg sqlc.GetContributionProgressParams) (sqlc.GetContributionProgressRow, error) {
			return sqlc.GetContributionProgressRow{
				RetirementAccountID: entry.RetirementAccountID,
				TaxYear:             2026,
				AnnualLimit:         limit,
				ContributedYtd:      contributed,
			}, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.AddContribution(ctx, AddContributionInput{
		RetirementAccountID: entry.RetirementAccountID,
		ContributionDate:    entry.ContributionDate.Time,
		Amount:              entry.Amount,
	})

	assert.ErrorIs(t, err, ErrContributionLimitExceeded)
	assert.Nil(t, result)
}

func TestRetirementAccountService_GetContributionProgress(t *testing.T) {
	ctx := context.Background()
	progressRow := testContributionProgressRow()

	mock := &mockRetirementQuerier{
		getContributionProgressFunc: func(ctx context.Context, arg sqlc.GetContributionProgressParams) (sqlc.GetContributionProgressRow, error) {
			assert.Equal(t, progressRow.RetirementAccountID, arg.ID)
			assert.Equal(t, progressRow.TaxYear, int32(arg.TaxYear))
			return progressRow, nil
		},
	}

	svc := NewRetirementAccountService(mock)
	result, err := svc.GetContributionProgress(ctx, progressRow.RetirementAccountID, int(progressRow.TaxYear))

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, progressRow.RetirementAccountID, result.RetirementAccountID)
}
