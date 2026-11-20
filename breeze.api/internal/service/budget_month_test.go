package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── Stateful fakes ─────────────────────────────────────
//
// The workflow lists rows, deletes the generated ones, creates replacements,
// and lists again to recalculate totals. The fakes below keep enough state to
// make that sequence observable, while embedding the existing narrow mocks for
// the methods the workflow never calls.

type fakeBudgetTable struct {
	mockBudgetQuerier

	date     time.Time
	id       uuid.UUID
	existing *sqlc.Budget
	creates  []sqlc.CreateBudgetParams
	updates  []sqlc.UpdateBudgetParams
	getErr   error
}

func (f *fakeBudgetTable) GetBudgetByDate(context.Context, sqlc.GetBudgetByDateParams) (sqlc.Budget, error) {
	if f.getErr != nil {
		return sqlc.Budget{}, f.getErr
	}
	if f.existing == nil {
		return sqlc.Budget{}, pgx.ErrNoRows
	}
	return *f.existing, nil
}

func (f *fakeBudgetTable) CreateBudget(_ context.Context, arg sqlc.CreateBudgetParams) (sqlc.Budget, error) {
	f.creates = append(f.creates, arg)
	return sqlc.Budget{
		ID:              f.id,
		UserID:          arg.UserID,
		Date:            arg.Date,
		MonthlyIncome:   arg.MonthlyIncome,
		MonthlyExpenses: arg.MonthlyExpenses,
	}, nil
}

func (f *fakeBudgetTable) UpdateBudget(_ context.Context, arg sqlc.UpdateBudgetParams) (sqlc.Budget, error) {
	f.updates = append(f.updates, arg)
	return sqlc.Budget{
		ID:              arg.ID,
		UserID:          arg.UserID,
		Date:            pgtype.Date{Time: f.date, Valid: true},
		MonthlyIncome:   arg.MonthlyIncome,
		MonthlyExpenses: arg.MonthlyExpenses,
	}, nil
}

type fakeIncomeTable struct {
	mockIncomeQuerier

	rows      []sqlc.Income
	created   []sqlc.CreateIncomeParams
	deleted   []uuid.UUID
	createErr error
}

func (f *fakeIncomeTable) CreateIncome(_ context.Context, arg sqlc.CreateIncomeParams) (sqlc.Income, error) {
	if f.createErr != nil {
		return sqlc.Income{}, f.createErr
	}
	f.created = append(f.created, arg)
	row := sqlc.Income{
		ID:                   uuid.New(),
		UserID:               arg.UserID,
		BudgetID:             arg.BudgetID,
		Name:                 arg.Name,
		Amount:               arg.Amount,
		Date:                 arg.Date,
		SourceType:           arg.SourceType,
		SourceTemplateID:     arg.SourceTemplateID,
		SourceOccurrenceDate: arg.SourceOccurrenceDate,
		GenerationMonth:      arg.GenerationMonth,
		PersonID:             arg.PersonID,
	}
	f.rows = append(f.rows, row)
	return row, nil
}

func (f *fakeIncomeTable) ListIncomeByBudgetID(_ context.Context, budgetID uuid.UUID) ([]sqlc.Income, error) {
	out := make([]sqlc.Income, 0, len(f.rows))
	for i := range f.rows {
		if f.rows[i].BudgetID == budgetID {
			out = append(out, f.rows[i])
		}
	}
	return out, nil
}

func (f *fakeIncomeTable) SoftDeleteIncome(_ context.Context, arg sqlc.SoftDeleteIncomeParams) (int64, error) {
	f.deleted = append(f.deleted, arg.ID)
	for i := range f.rows {
		if f.rows[i].ID == arg.ID && f.rows[i].UserID == arg.UserID {
			f.rows = append(f.rows[:i], f.rows[i+1:]...)
			return 1, nil
		}
	}
	return 0, nil
}

func (f *fakeIncomeTable) createdFor(source sqlc.IncomeSourceType) []sqlc.CreateIncomeParams {
	out := make([]sqlc.CreateIncomeParams, 0, len(f.created))
	for i := range f.created {
		if f.created[i].SourceType == source {
			out = append(out, f.created[i])
		}
	}
	return out
}

type fakeCategoryTable struct {
	mockExpenseCategoryQuerier

	rows             []sqlc.ExpenseCategory
	created          []sqlc.CreateExpenseCategoryParams
	generatedDeleted int
	createErr        error
}

func (f *fakeCategoryTable) CreateExpenseCategory(_ context.Context, arg sqlc.CreateExpenseCategoryParams) (sqlc.ExpenseCategory, error) {
	if f.createErr != nil {
		return sqlc.ExpenseCategory{}, f.createErr
	}
	f.created = append(f.created, arg)
	row := sqlc.ExpenseCategory{
		ID:               uuid.New(),
		UserID:           arg.UserID,
		BudgetID:         arg.BudgetID,
		Name:             arg.Name,
		Allocation:       arg.Allocation,
		CurrentSpend:     arg.CurrentSpend,
		SourceType:       arg.SourceType,
		SourceTemplateID: arg.SourceTemplateID,
		GenerationMonth:  arg.GenerationMonth,
	}
	f.rows = append(f.rows, row)
	return row, nil
}

func (f *fakeCategoryTable) ListExpenseCategoriesByBudgetID(_ context.Context, budgetID uuid.UUID) ([]sqlc.ExpenseCategory, error) {
	out := make([]sqlc.ExpenseCategory, 0, len(f.rows))
	for i := range f.rows {
		if f.rows[i].BudgetID == budgetID {
			out = append(out, f.rows[i])
		}
	}
	return out, nil
}

func (f *fakeCategoryTable) SoftDeleteGeneratedCategoriesByBudget(_ context.Context, budgetID uuid.UUID) (int64, error) {
	f.generatedDeleted++
	kept := make([]sqlc.ExpenseCategory, 0, len(f.rows))
	var removed int64
	for i := range f.rows {
		row := f.rows[i]
		if row.BudgetID == budgetID && row.SourceType == sqlc.ExpenseSourceTypeRECURRINGTEMPLATE {
			removed++
			continue
		}
		kept = append(kept, row)
	}
	f.rows = kept
	return removed, nil
}

type fakeBudgetMonthCleanup struct {
	categories        *fakeCategoryTable
	expensesDeleted   int
	categoriesDeleted int
	expenseErr        error
	categoryErr       error
}

func (f *fakeBudgetMonthCleanup) SoftDeleteGeneratedExpensesByBudget(context.Context, uuid.UUID) (int64, error) {
	if f.expenseErr != nil {
		return 0, f.expenseErr
	}
	f.expensesDeleted++
	return 0, nil
}

func (f *fakeBudgetMonthCleanup) SoftDeleteGeneratedCategoriesByBudget(ctx context.Context, budgetID uuid.UUID) (int64, error) {
	if f.categoryErr != nil {
		return 0, f.categoryErr
	}
	f.categoriesDeleted++
	return f.categories.SoftDeleteGeneratedCategoriesByBudget(ctx, budgetID)
}

// ─── Fixture ────────────────────────────────────────────

type budgetMonthFixture struct {
	userID   uuid.UUID
	budgetID uuid.UUID
	date     time.Time

	budgets    *fakeBudgetTable
	incomes    *fakeIncomeTable
	categories *fakeCategoryTable
	cleanup    *fakeBudgetMonthCleanup

	recurringIncomes    []sqlc.RecurringIncome
	recurringExpenses   []sqlc.RecurringExpense
	recurringIncomeErr  error
	recurringExpenseErr error
}

func newBudgetMonthFixture() *budgetMonthFixture {
	f := &budgetMonthFixture{
		userID:   uuid.New(),
		budgetID: uuid.New(),
		date:     time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC),
	}
	f.budgets = &fakeBudgetTable{id: f.budgetID, date: f.date}
	f.incomes = &fakeIncomeTable{}
	f.categories = &fakeCategoryTable{}
	f.cleanup = &fakeBudgetMonthCleanup{categories: f.categories}
	return f
}

func (f *budgetMonthFixture) deps() budgetMonthDeps {
	return budgetMonthDeps{
		budgets:    NewBudgetService(f.budgets),
		incomes:    NewIncomeService(f.incomes),
		categories: NewExpenseCategoryService(f.categories),
		recurringIncomes: NewRecurringIncomeService(&mockRecurringIncomeQuerier{
			listRecurringIncomeFunc: func(context.Context, uuid.UUID) ([]sqlc.RecurringIncome, error) {
				return f.recurringIncomes, f.recurringIncomeErr
			},
		}),
		recurringExpenses: NewRecurringExpenseService(&mockRecurringExpenseQuerier{
			listRecurringExpensesByUserIDFunc: func(context.Context, uuid.UUID) ([]sqlc.RecurringExpense, error) {
				return f.recurringExpenses, f.recurringExpenseErr
			},
		}),
		cleanup: f.cleanup,
	}
}

func (f *budgetMonthFixture) input() *BudgetMonthInput {
	return &BudgetMonthInput{
		UserID:          f.userID,
		Date:            f.date,
		MonthlyIncome:   decimal.MustParse("1.00"),
		MonthlyExpenses: decimal.MustParse("2.00"),
	}
}

func (f *budgetMonthFixture) run(t *testing.T) *Budget {
	t.Helper()
	budget, err := materializeBudgetMonth(context.Background(), f.deps(), f.input())
	require.NoError(t, err)
	return budget
}

func (f *budgetMonthFixture) seedIncome(name, amount string, source sqlc.IncomeSourceType) sqlc.Income {
	row := sqlc.Income{
		ID:         uuid.New(),
		UserID:     f.userID,
		BudgetID:   f.budgetID,
		Name:       name,
		Amount:     decimal.MustParse(amount),
		Date:       pgtype.Date{Time: f.date, Valid: true},
		SourceType: source,
	}
	f.incomes.rows = append(f.incomes.rows, row)
	return row
}

func (f *budgetMonthFixture) seedCategory(name, allocation string, source sqlc.ExpenseSourceType) sqlc.ExpenseCategory {
	row := sqlc.ExpenseCategory{
		ID:         uuid.New(),
		UserID:     f.userID,
		BudgetID:   f.budgetID,
		Name:       name,
		Allocation: decimal.MustParse(allocation),
		SourceType: source,
	}
	f.categories.rows = append(f.categories.rows, row)
	return row
}

func monthlyIncomeTemplate(name, amount string, start time.Time, payday int32) sqlc.RecurringIncome {
	return sqlc.RecurringIncome{
		ID:                 uuid.New(),
		UserID:             uuid.Nil,
		Name:               name,
		Amount:             decimal.MustParse(amount),
		RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
		PaydayDayOfMonth:   &payday,
		StartDate:          pgtype.Date{Time: start, Valid: true},
	}
}

// ─── Budget upsert ──────────────────────────────────────

func TestMaterializeBudgetMonthCreatesMissingBudget(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	budget := f.run(t)

	require.Len(t, f.budgets.creates, 1, "a missing month is created once")
	created := f.budgets.creates[0]
	assert.Equal(t, f.userID, created.UserID)
	assert.Equal(t, f.date, created.Date.Time)
	assert.Equal(t, "1.00", created.MonthlyIncome.String(), "the input amounts seed the new row")

	require.Len(t, f.budgets.updates, 1, "totals are recalculated after generation")
	assert.True(t, budget.MonthlyIncome.IsZero())
	assert.True(t, budget.MonthlyExpenses.IsZero())
}

func TestMaterializeBudgetMonthUpdatesExistingBudget(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	f.budgets.existing = &sqlc.Budget{
		ID:              f.budgetID,
		UserID:          f.userID,
		Date:            pgtype.Date{Time: f.date, Valid: true},
		MonthlyIncome:   decimal.MustParse("900.00"),
		MonthlyExpenses: decimal.MustParse("800.00"),
	}

	f.run(t)

	assert.Empty(t, f.budgets.creates, "an existing month is not recreated")
	require.Len(t, f.budgets.updates, 2)

	assert.Equal(t, "1.00", f.budgets.updates[0].MonthlyIncome.String(), "input amounts are applied first")
	assert.True(t, f.budgets.updates[1].MonthlyIncome.IsZero(), "totals come from the rows that exist")
	assert.True(t, f.budgets.updates[1].MonthlyExpenses.IsZero())
}

func TestMaterializeBudgetMonthPropagatesLookupError(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	f.budgets.getErr = errors.New("lookup exploded")

	_, err := materializeBudgetMonth(context.Background(), f.deps(), f.input())

	require.ErrorContains(t, err, "lookup exploded")
	assert.Empty(t, f.budgets.creates)
	assert.Empty(t, f.budgets.updates)
}

// ─── Generated incomes ──────────────────────────────────

func TestMaterializeBudgetMonthReplacesGeneratedIncomesOnly(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	manual := f.seedIncome("Salary", "500", sqlc.IncomeSourceTypeMANUAL)
	oldGenerated := f.seedIncome("Old rent split", "999", sqlc.IncomeSourceTypeRECURRINGTEMPLATE)
	payroll := f.seedIncome("Ada payroll", "2000", sqlc.IncomeSourceTypePEOPLEPAYROLL)

	f.recurringIncomes = []sqlc.RecurringIncome{
		monthlyIncomeTemplate("Rent split", "1000", time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), 15),
	}

	budget := f.run(t)

	created := f.incomes.createdFor(sqlc.IncomeSourceTypeRECURRINGTEMPLATE)
	require.Len(t, created, 1)
	assert.Equal(t, "Rent split", created[0].Name)
	assert.Equal(t, "1000", created[0].Amount.String())
	assert.Equal(t, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), created[0].Date.Time)
	assert.Equal(t, budget.ID, created[0].BudgetID)

	assert.Equal(t, []uuid.UUID{oldGenerated.ID}, f.incomes.deleted, "only the generated rows are replaced")
	assert.Contains(t, f.incomes.rows, manual, "manual incomes survive regeneration")
	assert.Contains(t, f.incomes.rows, payroll, "omitted payroll incomes are left untouched")

	assert.Equal(t, "3500", budget.MonthlyIncome.String(), "total = manual + regenerated + payroll")
}

func TestMaterializeBudgetMonthSkipsTemplatesOutsideTheMonth(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	ended := monthlyIncomeTemplate("Ended before June", "700", time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), 1)
	ended.EndDate = pgtype.Date{Time: time.Date(2024, 5, 31, 0, 0, 0, 0, time.UTC), Valid: true}
	f.recurringIncomes = []sqlc.RecurringIncome{ended}

	f.run(t)

	assert.Empty(t, f.incomes.createdFor(sqlc.IncomeSourceTypeRECURRINGTEMPLATE))
}

func TestMaterializeBudgetMonthPropagatesGeneratedIncomeError(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	f.recurringIncomes = []sqlc.RecurringIncome{
		monthlyIncomeTemplate("Rent split", "1000", time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), 15),
	}
	f.incomes.createErr = errors.New("insert failed")

	_, err := materializeBudgetMonth(context.Background(), f.deps(), f.input())

	require.ErrorContains(t, err, "create recurring income")
	require.ErrorContains(t, err, "insert failed")
}

// ─── Payroll incomes ────────────────────────────────────

func TestMaterializeBudgetMonthClearsPayrollWhenInputIsEmpty(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	payroll := f.seedIncome("Ada payroll", "2000", sqlc.IncomeSourceTypePEOPLEPAYROLL)
	manual := f.seedIncome("Salary", "500", sqlc.IncomeSourceTypeMANUAL)

	input := f.input()
	input.PayrollIncomes = []PayrollIncome{}

	budget, err := materializeBudgetMonth(context.Background(), f.deps(), input)
	require.NoError(t, err)

	assert.Equal(t, []uuid.UUID{payroll.ID}, f.incomes.deleted)
	assert.NotContains(t, f.incomes.rows, payroll)
	assert.Contains(t, f.incomes.rows, manual)
	assert.Empty(t, f.incomes.createdFor(sqlc.IncomeSourceTypePEOPLEPAYROLL))
	assert.Equal(t, "500", budget.MonthlyIncome.String())
}

func TestMaterializeBudgetMonthReplacesPayrollIncomes(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	oldPayroll := f.seedIncome("Old payroll", "1800", sqlc.IncomeSourceTypePEOPLEPAYROLL)
	personID := uuid.New()
	payDate := time.Date(2024, 6, 30, 0, 0, 0, 0, time.UTC)

	input := f.input()
	input.PayrollIncomes = []PayrollIncome{{
		PersonID: personID,
		Name:     "Ada payroll",
		Amount:   decimal.MustParse("1234.56"),
		Date:     payDate,
	}}

	budget, err := materializeBudgetMonth(context.Background(), f.deps(), input)
	require.NoError(t, err)

	assert.Equal(t, []uuid.UUID{oldPayroll.ID}, f.incomes.deleted)

	created := f.incomes.createdFor(sqlc.IncomeSourceTypePEOPLEPAYROLL)
	require.Len(t, created, 1)
	assert.Equal(t, "Ada payroll", created[0].Name)
	assert.Equal(t, "1234.56", created[0].Amount.String())
	assert.Equal(t, payDate, created[0].Date.Time)
	require.True(t, created[0].PersonID.Valid)
	parsedPersonID := uuidFromPG(created[0].PersonID)
	require.NotNil(t, parsedPersonID)
	assert.Equal(t, personID, *parsedPersonID)

	assert.Equal(t, "1234.56", budget.MonthlyIncome.String())
}

// ─── Expense categories ─────────────────────────────────

func TestMaterializeBudgetMonthRegeneratesExpenseCategories(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	manual := f.seedCategory("Groceries", "50", sqlc.ExpenseSourceTypeMANUAL)
	f.seedCategory("Old generated", "999", sqlc.ExpenseSourceTypeRECURRINGTEMPLATE)
	f.recurringExpenses = []sqlc.RecurringExpense{
		{
			ID:                 uuid.New(),
			Name:               "Rent",
			Amount:             decimal.MustParse("100"),
			RecurrenceInterval: sqlc.RecurrenceIntervalMONTHLY,
			StartDate:          pgtype.Date{Time: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Valid: true},
		},
	}

	budget := f.run(t)

	assert.Equal(t, 1, f.cleanup.expensesDeleted)
	assert.Equal(t, 1, f.cleanup.categoriesDeleted)

	require.Len(t, f.categories.created, 1)
	created := f.categories.created[0]
	assert.Equal(t, "Rent", created.Name)
	assert.Equal(t, "100", created.Allocation.String())
	assert.Equal(t, sqlc.ExpenseSourceTypeRECURRINGTEMPLATE, created.SourceType)

	assert.Contains(t, f.categories.rows, manual, "manual categories survive regeneration")
	assert.Equal(t, "150", budget.MonthlyExpenses.String(), "total = manual + regenerated category")
}

func TestMaterializeBudgetMonthNormalizesRecurringExpenseToMonthly(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	f.recurringExpenses = []sqlc.RecurringExpense{
		{
			ID:                 uuid.New(),
			Name:               "Weekly cleaner",
			Amount:             decimal.MustParse("100"),
			RecurrenceInterval: sqlc.RecurrenceIntervalWEEKLY,
			StartDate:          pgtype.Date{Time: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), Valid: true},
		},
	}

	f.run(t)

	require.Len(t, f.categories.created, 1)
	assert.Equal(t, "433.33", f.categories.created[0].Allocation.String(), "weekly amount is annualized then averaged per month")
}

func TestMaterializeBudgetMonthPropagatesCleanupError(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	f.cleanup.expenseErr = errors.New("cleanup stopped")

	_, err := materializeBudgetMonth(context.Background(), f.deps(), f.input())

	require.ErrorContains(t, err, "delete generated expenses")
	require.ErrorContains(t, err, "cleanup stopped")
	assert.Empty(t, f.categories.created)
}

func TestMaterializeBudgetMonthPropagatesRecurringTemplateError(t *testing.T) {
	t.Parallel()

	f := newBudgetMonthFixture()
	f.recurringExpenseErr = errors.New("templates unavailable")

	_, err := materializeBudgetMonth(context.Background(), f.deps(), f.input())

	require.ErrorContains(t, err, "list recurring expenses")
	require.ErrorContains(t, err, "templates unavailable")
}
