package graph

import (
	"testing"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── budgetMonthInputFromModel ─────────────────────────

func TestBudgetMonthInputFromModel(t *testing.T) {
	t.Parallel()

	t.Run("valid input", func(t *testing.T) {
		t.Parallel()
		input := model.CreateBudgetInput{
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "5000.00",
			MonthlyExpenses: "3000.00",
		}

		result, err := budgetMonthInputFromModel(&input)

		require.NoError(t, err)
		assert.Equal(t, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), result.Date)
		assert.Equal(t, "5000.00", result.MonthlyIncome.String())
		assert.Equal(t, "3000.00", result.MonthlyExpenses.String())
		assert.Nil(t, result.PayrollIncomes, "omitted payroll incomes stay nil")
	})

	t.Run("empty payroll list is preserved as a request to clear", func(t *testing.T) {
		t.Parallel()
		input := model.CreateBudgetInput{
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "5000.00",
			MonthlyExpenses: "3000.00",
			PayrollIncomes:  []*model.PayrollIncomeInput{},
		}

		result, err := budgetMonthInputFromModel(&input)

		require.NoError(t, err)
		require.NotNil(t, result.PayrollIncomes)
		assert.Empty(t, result.PayrollIncomes)
	})

	t.Run("invalid date", func(t *testing.T) {
		t.Parallel()
		input := model.CreateBudgetInput{
			Date:            "not-a-date",
			MonthlyIncome:   "5000",
			MonthlyExpenses: "3000",
		}

		_, err := budgetMonthInputFromModel(&input)

		require.Error(t, err)
	})

	t.Run("invalid monthly income", func(t *testing.T) {
		t.Parallel()
		input := model.CreateBudgetInput{
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "not-a-number",
			MonthlyExpenses: "3000",
		}

		_, err := budgetMonthInputFromModel(&input)

		require.Error(t, err)
	})

	t.Run("invalid monthly expenses", func(t *testing.T) {
		t.Parallel()
		input := model.CreateBudgetInput{
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "5000",
			MonthlyExpenses: "not-a-number",
		}

		_, err := budgetMonthInputFromModel(&input)

		require.Error(t, err)
	})
}

func TestPayrollIncomesFromModel(t *testing.T) {
	t.Parallel()

	t.Run("maps person, amount, and date", func(t *testing.T) {
		t.Parallel()
		personID := uuid.New()

		result, err := payrollIncomesFromModel([]*model.PayrollIncomeInput{{
			PersonID: personID.String(),
			Name:     "Ada",
			Amount:   "1234.56",
			Date:     "2024-06-15T00:00:00Z",
		}})

		require.NoError(t, err)
		require.Len(t, result, 1)
		assert.Equal(t, personID, result[0].PersonID)
		assert.Equal(t, "Ada", result[0].Name)
		assert.Equal(t, "1234.56", result[0].Amount.String())
		assert.Equal(t, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), result[0].Date)
	})

	t.Run("invalid person id", func(t *testing.T) {
		t.Parallel()
		_, err := payrollIncomesFromModel([]*model.PayrollIncomeInput{{
			PersonID: "not-a-uuid",
			Name:     "Ada",
			Amount:   "1.00",
			Date:     "2024-06-15T00:00:00Z",
		}})

		require.Error(t, err)
	})

	t.Run("invalid amount", func(t *testing.T) {
		t.Parallel()
		_, err := payrollIncomesFromModel([]*model.PayrollIncomeInput{{
			PersonID: uuid.New().String(),
			Name:     "Ada",
			Amount:   "not-a-number",
			Date:     "2024-06-15T00:00:00Z",
		}})

		require.Error(t, err)
	})

	t.Run("invalid date", func(t *testing.T) {
		t.Parallel()
		_, err := payrollIncomesFromModel([]*model.PayrollIncomeInput{{
			PersonID: uuid.New().String(),
			Name:     "Ada",
			Amount:   "1.00",
			Date:     "not-a-date",
		}})

		require.Error(t, err)
	})
}

// ─── updateBudgetInputFromModel ────────────────────────

func TestUpdateBudgetInputFromModel(t *testing.T) {
	t.Run("valid input", func(t *testing.T) {
		id := uuid.New().String()
		input := model.UpdateBudgetInput{
			ID:              id,
			MonthlyIncome:   "6000.00",
			MonthlyExpenses: "3500.00",
		}
		result, err := updateBudgetInputFromModel(&input)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.ID.String() != id {
			t.Fatal("ID mismatch")
		}
		if result.MonthlyIncome.String() != "6000.00" {
			t.Fatalf("income mismatch: %s", result.MonthlyIncome)
		}
	})

	t.Run("invalid ID", func(t *testing.T) {
		input := model.UpdateBudgetInput{
			ID:              "bad",
			MonthlyIncome:   "5000",
			MonthlyExpenses: "3000",
		}
		_, err := updateBudgetInputFromModel(&input)
		if err == nil {
			t.Fatal("expected error for invalid ID")
		}
	})

	t.Run("invalid income", func(t *testing.T) {
		input := model.UpdateBudgetInput{
			ID:              uuid.New().String(),
			MonthlyIncome:   "abc",
			MonthlyExpenses: "3000",
		}
		_, err := updateBudgetInputFromModel(&input)
		if err == nil {
			t.Fatal("expected error for invalid income")
		}
	})
}

// ─── mapBudgetToModel ──────────────────────────────────

func TestMapBudgetToModel(t *testing.T) {
	budget := &service.Budget{
		ID:              uuid.New(),
		UserID:          uuid.New(),
		Date:            time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC),
		MonthlyIncome:   decimal.MustParse("5000.00"),
		MonthlyExpenses: decimal.MustParse("3000.00"),
		CreatedAt:       time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
		UpdatedAt:       time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC),
	}
	result := mapBudgetToModel(budget)
	if result == nil {
		t.Fatal("expected non-nil")
	}
	if result.MonthlyIncome != "5000.00" {
		t.Fatalf("income mismatch: %s", result.MonthlyIncome)
	}
	if result.MonthlyExpenses != "3000.00" {
		t.Fatalf("expenses mismatch: %s", result.MonthlyExpenses)
	}
}
