package graph

import (
	"testing"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

// ─── decimalZero ────────────────────────────────────────

func TestDecimalZero(t *testing.T) {
	z := decimalZero()
	if !z.IsZero() {
		t.Fatal("expected zero decimal")
	}
}

// ─── createBudgetInputFromModel ────────────────────────

func TestCreateBudgetInputFromModel(t *testing.T) {
	t.Run("valid input", func(t *testing.T) {
		userID := uuid.New().String()
		input := model.CreateBudgetInput{
			UserID:          userID,
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "5000.00",
			MonthlyExpenses: "3000.00",
		}
		result, err := createBudgetInputFromModel(&input)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.UserID.String() != userID {
			t.Fatal("userID mismatch")
		}
		if result.MonthlyIncome.String() != "5000.00" {
			t.Fatalf("income mismatch: %s", result.MonthlyIncome)
		}
		if result.MonthlyExpenses.String() != "3000.00" {
			t.Fatalf("expenses mismatch: %s", result.MonthlyExpenses)
		}
	})

	t.Run("invalid user ID", func(t *testing.T) {
		input := model.CreateBudgetInput{
			UserID:          "not-a-uuid",
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "5000",
			MonthlyExpenses: "3000",
		}
		_, err := createBudgetInputFromModel(&input)
		if err == nil {
			t.Fatal("expected error for invalid user ID")
		}
	})

	t.Run("invalid date", func(t *testing.T) {
		input := model.CreateBudgetInput{
			UserID:          uuid.New().String(),
			Date:            "not-a-date",
			MonthlyIncome:   "5000",
			MonthlyExpenses: "3000",
		}
		_, err := createBudgetInputFromModel(&input)
		if err == nil {
			t.Fatal("expected error for invalid date")
		}
	})

	t.Run("invalid monthly income", func(t *testing.T) {
		input := model.CreateBudgetInput{
			UserID:          uuid.New().String(),
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "not-a-number",
			MonthlyExpenses: "3000",
		}
		_, err := createBudgetInputFromModel(&input)
		if err == nil {
			t.Fatal("expected error for invalid income")
		}
	})

	t.Run("invalid monthly expenses", func(t *testing.T) {
		input := model.CreateBudgetInput{
			UserID:          uuid.New().String(),
			Date:            "2024-06-15T00:00:00Z",
			MonthlyIncome:   "5000",
			MonthlyExpenses: "not-a-number",
		}
		_, err := createBudgetInputFromModel(&input)
		if err == nil {
			t.Fatal("expected error for invalid expenses")
		}
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
