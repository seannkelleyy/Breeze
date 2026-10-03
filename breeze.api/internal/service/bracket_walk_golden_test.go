package service

// Golden test: the Go federal bracket walk against a shared fixture that the
// TS suite (breeze.web/app/taxes/lib/__tests__/tax-bracket-walk.golden.test.ts)
// also loads. If the implementations drift, CI fails here AND there.
// Fixture: tests/fixtures/tax-bracket-walk.json (repo root).

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"breeze.api/internal/db/sqlc"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
)

type goldenBracket struct {
	Rate    float64  `json:"rate"`
	Minimum float64  `json:"minimum"`
	Maximum *float64 `json:"maximum"`
}

type goldenCase struct {
	Name          string  `json:"name"`
	TaxableIncome float64 `json:"taxableIncome"`
	ExpectedTax   float64 `json:"expectedTax"`
}

type goldenFixture struct {
	Brackets []goldenBracket `json:"brackets"`
	Cases    []goldenCase    `json:"cases"`
}

func loadGoldenFixture(t *testing.T) goldenFixture {
	t.Helper()
	path := filepath.Join("..", "..", "..", "tests", "fixtures", "tax-bracket-walk.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read golden fixture: %v", err)
	}
	var fixture goldenFixture
	if err := json.Unmarshal(data, &fixture); err != nil {
		t.Fatalf("parse golden fixture: %v", err)
	}
	return fixture
}

func TestBracketWalk_GoldenFixtures(t *testing.T) {
	fixture := loadGoldenFixture(t)

	// Materialize fixture brackets as sqlc rows. An open bracket (null
	// maximum) is an invalid pgtype.Numeric, like the seeded rows.
	brackets := make([]sqlc.TaxBracket, 0, len(fixture.Brackets))
	for _, b := range fixture.Brackets {
		minimum := decimal.MustParse(fmt.Sprintf("%f", b.Minimum))
		maximum := pgtype.Numeric{}
		if b.Maximum != nil {
			maximum = mkNumeric(fmt.Sprintf("%f", *b.Maximum))
		}
		rate := decimal.MustParse(fmt.Sprintf("%.2f", b.Rate))
		brackets = append(brackets, sqlc.TaxBracket{
			Year:          2026,
			FilingStatus:  sqlc.FilingStatusMFJ,
			MinimumAmount: minimum,
			MaximumAmount: maximum,
			Rate:          rate,
		})
	}

	mock := &mockTaxBracketQuerier{
		listTaxBracketsByYearAndFilingStatusFunc: func(ctx context.Context, arg sqlc.ListTaxBracketsByYearAndFilingStatusParams) ([]sqlc.TaxBracket, error) {
			return brackets, nil
		},
	}
	svc := NewTaxPlanningService(mock)

	for _, tc := range fixture.Cases {
		t.Run(tc.Name, func(t *testing.T) {
			// Zero itemized deduction keeps the comparison pure: TaxOwed is
			// exactly the federal bracket walk on the taxable income (no
			// standard deduction, no FICA).
			zero := mkNumeric("0.00")
			est, err := svc.EstimateForYear(
				context.Background(),
				2026,
				sqlc.FilingStatusMFJ,
				decimal.MustParse(fmt.Sprintf("%f", tc.TaxableIncome)),
				&zero,
			)
			if err != nil {
				t.Fatalf("estimate: %v", err)
			}
			expected := decimal.MustParse(fmt.Sprintf("%.2f", tc.ExpectedTax))
			if est.TaxOwed.Cmp(expected) != 0 {
				t.Errorf("taxable %f: got %s, want %s", tc.TaxableIncome, est.TaxOwed.String(), expected.String())
			}
		})
	}
}
