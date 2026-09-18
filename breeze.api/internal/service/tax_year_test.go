package service

import (
	"context"
	"errors"
	"testing"

	"breeze.api/internal/db/sqlc"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockTaxYearQuerier struct {
	getLatestTaxYearFunc                     func(context.Context) (int32, error)
	listTaxBracketsByYearAndFilingStatusFunc func(context.Context, sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error)
	listStandardDeductionsByYearFunc         func(context.Context, int32) ([]sqlc.StandardDeduction, error)
	getFicaParametersByYearFunc              func(context.Context, int32) (sqlc.FicaParameter, error)
}

func (m *mockTaxYearQuerier) GetLatestTaxYear(ctx context.Context) (int32, error) {
	if m.getLatestTaxYearFunc != nil {
		return m.getLatestTaxYearFunc(ctx)
	}
	return 0, nil
}

func (m *mockTaxYearQuerier) ListTaxBracketsByYearAndFilingStatus(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) { //nolint:gocritic // interface impl
	if m.listTaxBracketsByYearAndFilingStatusFunc != nil {
		return m.listTaxBracketsByYearAndFilingStatusFunc(ctx, arg)
	}
	return []sqlc.TaxBracket{}, nil
}

func (m *mockTaxYearQuerier) ListStandardDeductionsByYear(ctx context.Context, year int32) ([]sqlc.StandardDeduction, error) {
	if m.listStandardDeductionsByYearFunc != nil {
		return m.listStandardDeductionsByYearFunc(ctx, year)
	}
	return []sqlc.StandardDeduction{}, nil
}

func (m *mockTaxYearQuerier) GetFicaParametersByYear(ctx context.Context, year int32) (sqlc.FicaParameter, error) {
	if m.getFicaParametersByYearFunc != nil {
		return m.getFicaParametersByYearFunc(ctx, year)
	}
	return sqlc.FicaParameter{}, nil
}

func TestTaxYearService_ResolvesLatestYearWhenNil(t *testing.T) {
	var requestedYear *int32
	var capturedYear int32

	querier := &mockTaxYearQuerier{
		getLatestTaxYearFunc: func(ctx context.Context) (int32, error) {
			return 2025, nil
		},
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			capturedYear = arg.Year
			row := testTaxBracketRow()
			row.Year = arg.Year
			return []sqlc.TaxBracket{row}, nil
		},
		listStandardDeductionsByYearFunc: func(ctx context.Context, year int32) ([]sqlc.StandardDeduction, error) {
			return []sqlc.StandardDeduction{{
				Year:         year,
				FilingStatus: sqlc.FilingStatusSINGLE,
				Amount:       mustDecimal("15000"),
			}}, nil
		},
		getFicaParametersByYearFunc: func(ctx context.Context, year int32) (sqlc.FicaParameter, error) {
			return sqlc.FicaParameter{Year: year, SsWageBase: mustDecimal("176100")}, nil
		},
	}

	svc := NewTaxYearService(querier)
	data, err := svc.GetTaxYearData(context.Background(), requestedYear, sqlc.FilingStatusSINGLE)

	require.NoError(t, err)
	assert.Equal(t, int32(2025), data.Year)
	assert.Equal(t, int32(2025), capturedYear)
	assert.Equal(t, "15000", data.StandardDeduction.String())
	assert.Equal(t, "176100", data.SSWageBase.String())
	assert.Len(t, data.Brackets, 1)
}

func TestTaxYearService_UsesExplicitYear(t *testing.T) {
	year := int32(2024)
	latestCalled := false

	querier := &mockTaxYearQuerier{
		getLatestTaxYearFunc: func(ctx context.Context) (int32, error) {
			latestCalled = true
			return 2025, nil
		},
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			row := testTaxBracketRow()
			row.Year = arg.Year
			return []sqlc.TaxBracket{row}, nil
		},
		listStandardDeductionsByYearFunc: func(ctx context.Context, y int32) ([]sqlc.StandardDeduction, error) {
			assert.Equal(t, int32(2024), y)
			return []sqlc.StandardDeduction{{
				Year:         y,
				FilingStatus: sqlc.FilingStatusSINGLE,
				Amount:       mustDecimal("14600"),
			}}, nil
		},
		getFicaParametersByYearFunc: func(ctx context.Context, y int32) (sqlc.FicaParameter, error) {
			assert.Equal(t, int32(2024), y)
			return sqlc.FicaParameter{Year: y, SsWageBase: mustDecimal("168600")}, nil
		},
	}

	svc := NewTaxYearService(querier)
	data, err := svc.GetTaxYearData(context.Background(), &year, sqlc.FilingStatusSINGLE)

	require.NoError(t, err)
	assert.Equal(t, int32(2024), data.Year)
	assert.False(t, latestCalled, "latest-year lookup should be skipped for explicit years")
}

func TestTaxYearService_FiltersStandardDeductionByFilingStatus(t *testing.T) {
	querier := &mockTaxYearQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{testTaxBracketRow()}, nil
		},
		listStandardDeductionsByYearFunc: func(ctx context.Context, year int32) ([]sqlc.StandardDeduction, error) {
			return []sqlc.StandardDeduction{
				{Year: year, FilingStatus: sqlc.FilingStatusSINGLE, Amount: mustDecimal("15000")},
				{Year: year, FilingStatus: sqlc.FilingStatusMFJ, Amount: mustDecimal("30000")},
			}, nil
		},
		getFicaParametersByYearFunc: func(ctx context.Context, year int32) (sqlc.FicaParameter, error) {
			return sqlc.FicaParameter{Year: year, SsWageBase: mustDecimal("176100")}, nil
		},
	}

	svc := NewTaxYearService(querier)
	data, err := svc.GetTaxYearData(context.Background(), nil, sqlc.FilingStatusMFJ)

	require.NoError(t, err)
	assert.Equal(t, "30000", data.StandardDeduction.String())
}

func TestTaxYearService_ErrorsWhenNoBrackets(t *testing.T) {
	querier := &mockTaxYearQuerier{
		getLatestTaxYearFunc: func(ctx context.Context) (int32, error) {
			return 2025, nil
		},
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{}, nil
		},
	}

	svc := NewTaxYearService(querier)
	_, err := svc.GetTaxYearData(context.Background(), nil, sqlc.FilingStatusSINGLE)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "no tax brackets")
}

func TestTaxYearService_ErrorsWhenDeductionMissingForStatus(t *testing.T) {
	querier := &mockTaxYearQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return []sqlc.TaxBracket{testTaxBracketRow()}, nil
		},
		listStandardDeductionsByYearFunc: func(ctx context.Context, year int32) ([]sqlc.StandardDeduction, error) {
			return []sqlc.StandardDeduction{}, nil
		},
		getFicaParametersByYearFunc: func(ctx context.Context, year int32) (sqlc.FicaParameter, error) {
			return sqlc.FicaParameter{Year: year}, nil
		},
	}

	svc := NewTaxYearService(querier)
	_, err := svc.GetTaxYearData(context.Background(), nil, sqlc.FilingStatusHOH)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "no standard deduction")
}

func TestTaxYearService_WrapsQueryErrors(t *testing.T) {
	querier := &mockTaxYearQuerier{
		getLatestTaxYearFunc: func(ctx context.Context) (int32, error) {
			return 0, errors.New("db down")
		},
	}

	svc := NewTaxYearService(querier)
	_, err := svc.GetTaxYearData(context.Background(), nil, sqlc.FilingStatusSINGLE)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "resolve latest tax year")
}
