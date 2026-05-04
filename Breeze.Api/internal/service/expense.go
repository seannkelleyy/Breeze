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
	"github.com/jackc/pgx/v5/pgxpool"
)

type Expense struct {
	ID                uuid.UUID
	UserID            uuid.UUID
	BudgetID          uuid.UUID
	Amount            decimal.Decimal
	Date              time.Time
	Description       string
	RecurringSourceID *uuid.UUID
	Splits            []ExpenseSplit
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type ExpenseSplit struct {
	ID          uuid.UUID
	ExpenseID   uuid.UUID
	CategoryID  uuid.UUID
	Amount      decimal.Decimal
	Description *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type ExpenseSplitInput struct {
	CategoryID  uuid.UUID
	Amount      decimal.Decimal
	Description *string
}

type CreateExpenseInput struct {
	UserID            uuid.UUID
	BudgetID          uuid.UUID
	Amount            decimal.Decimal
	Date              time.Time
	Description       string
	RecurringSourceID *uuid.UUID
	Splits            []ExpenseSplitInput
}

type UpdateExpenseInput struct {
	ID          uuid.UUID
	Amount      decimal.Decimal
	Date        time.Time
	Description string
	Splits      []ExpenseSplitInput
}

type expenseQuerier interface {
	CreateExpense(ctx context.Context, arg sqlc.CreateExpenseParams) (sqlc.Expense, error)
	GetExpenseByID(ctx context.Context, id uuid.UUID) (sqlc.Expense, error)
	ListExpensesByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlc.Expense, error)
	UpdateExpense(ctx context.Context, arg sqlc.UpdateExpenseParams) (sqlc.Expense, error)
	SoftDeleteExpense(ctx context.Context, id uuid.UUID) (int64, error)
	CreateExpenseSplit(ctx context.Context, arg sqlc.CreateExpenseSplitParams) (sqlc.ExpenseSplit, error)
	ListExpenseSplitsByExpenseIDs(ctx context.Context, expenseIDs []uuid.UUID) ([]sqlc.ExpenseSplit, error)
	SoftDeleteExpenseSplitsByExpenseID(ctx context.Context, expenseID uuid.UUID) (int64, error)
}

type expenseTxRunner interface {
	Run(ctx context.Context, fn func(q expenseQuerier) error) error
}

type expenseTxRunnerFunc func(ctx context.Context, fn func(q expenseQuerier) error) error

func (f expenseTxRunnerFunc) Run(ctx context.Context, fn func(q expenseQuerier) error) error {
	return f(ctx, fn)
}

type expenseTxRunnerImpl struct {
	pool    *pgxpool.Pool
	queries *sqlc.Queries
}

func (r *expenseTxRunnerImpl) Run(ctx context.Context, fn func(q expenseQuerier) error) error {
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

type ExpenseService struct {
	queries  expenseQuerier
	txRunner expenseTxRunner
}

func NewExpenseService(queries *sqlc.Queries, pool *pgxpool.Pool) *ExpenseService {
	return &ExpenseService{
		queries: queries,
		txRunner: &expenseTxRunnerImpl{
			pool:    pool,
			queries: queries,
		},
	}
}

func newExpenseServiceWithRunner(queries expenseQuerier, runner expenseTxRunner) *ExpenseService {
	return &ExpenseService{queries: queries, txRunner: runner}
}

func (s *ExpenseService) Create(ctx context.Context, input CreateExpenseInput) (*Expense, error) {
	if err := validateExpenseSplits(input.Amount, input.Splits); err != nil {
		return nil, err
	}

	var expenseRow sqlc.Expense
	splitRows := make([]sqlc.ExpenseSplit, 0, len(input.Splits))

	err := s.txRunner.Run(ctx, func(q expenseQuerier) error {
		row, err := q.CreateExpense(ctx, sqlc.CreateExpenseParams{
			UserID:            input.UserID,
			BudgetID:          input.BudgetID,
			Amount:            input.Amount,
			Date:              pgtype.Date{Time: input.Date, Valid: true},
			Description:       input.Description,
			RecurringSourceID: uuidToPGUUID(input.RecurringSourceID),
		})
		if err != nil {
			return fmt.Errorf("create expense: %w", err)
		}
		expenseRow = row

		for _, split := range input.Splits {
			splitRow, err := q.CreateExpenseSplit(ctx, sqlc.CreateExpenseSplitParams{
				ExpenseID:   row.ID,
				CategoryID:  split.CategoryID,
				Amount:      split.Amount,
				Description: split.Description,
			})
			if err != nil {
				return fmt.Errorf("create expense split: %w", err)
			}
			splitRows = append(splitRows, splitRow)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	expense := mapExpenseRecord(expenseRow)
	expense.Splits = mapExpenseSplitRecords(splitRows)
	return &expense, nil
}

func (s *ExpenseService) GetByID(ctx context.Context, id uuid.UUID) (*Expense, error) {
	expenseRow, err := s.queries.GetExpenseByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get expense by id: %w", err)
	}

	splits, err := s.queries.ListExpenseSplitsByExpenseIDs(ctx, []uuid.UUID{id})
	if err != nil {
		return nil, fmt.Errorf("list expense splits: %w", err)
	}

	expense := mapExpenseRecord(expenseRow)
	expense.Splits = mapExpenseSplitRecords(splits)
	return &expense, nil
}

func (s *ExpenseService) ListByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]Expense, error) {
	expenseRows, err := s.queries.ListExpensesByBudgetID(ctx, budgetID)
	if err != nil {
		return nil, fmt.Errorf("list expenses by budget id: %w", err)
	}

	if len(expenseRows) == 0 {
		return []Expense{}, nil
	}

	expenseIDs := make([]uuid.UUID, 0, len(expenseRows))
	for _, row := range expenseRows {
		expenseIDs = append(expenseIDs, row.ID)
	}

	splitRows, err := s.queries.ListExpenseSplitsByExpenseIDs(ctx, expenseIDs)
	if err != nil {
		return nil, fmt.Errorf("list expense splits: %w", err)
	}

	splitsByExpense := make(map[uuid.UUID][]ExpenseSplit)
	for _, split := range splitRows {
		mapped := mapExpenseSplitRecord(split)
		splitsByExpense[split.ExpenseID] = append(splitsByExpense[split.ExpenseID], mapped)
	}

	expenses := make([]Expense, 0, len(expenseRows))
	for _, row := range expenseRows {
		expense := mapExpenseRecord(row)
		expense.Splits = splitsByExpense[row.ID]
		expenses = append(expenses, expense)
	}

	return expenses, nil
}

func (s *ExpenseService) Update(ctx context.Context, input UpdateExpenseInput) (*Expense, error) {
	if err := validateExpenseSplits(input.Amount, input.Splits); err != nil {
		return nil, err
	}

	var expenseRow sqlc.Expense
	splitRows := make([]sqlc.ExpenseSplit, 0, len(input.Splits))

	err := s.txRunner.Run(ctx, func(q expenseQuerier) error {
		row, err := q.UpdateExpense(ctx, sqlc.UpdateExpenseParams{
			ID:          input.ID,
			Amount:      input.Amount,
			Date:        pgtype.Date{Time: input.Date, Valid: true},
			Description: input.Description,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrNotFound
			}
			return fmt.Errorf("update expense: %w", err)
		}
		expenseRow = row

		_, err = q.SoftDeleteExpenseSplitsByExpenseID(ctx, input.ID)
		if err != nil {
			return fmt.Errorf("delete expense splits: %w", err)
		}

		for _, split := range input.Splits {
			splitRow, err := q.CreateExpenseSplit(ctx, sqlc.CreateExpenseSplitParams{
				ExpenseID:   row.ID,
				CategoryID:  split.CategoryID,
				Amount:      split.Amount,
				Description: split.Description,
			})
			if err != nil {
				return fmt.Errorf("create expense split: %w", err)
			}
			splitRows = append(splitRows, splitRow)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	expense := mapExpenseRecord(expenseRow)
	expense.Splits = mapExpenseSplitRecords(splitRows)
	return &expense, nil
}

func (s *ExpenseService) Delete(ctx context.Context, id uuid.UUID) error {
	err := s.txRunner.Run(ctx, func(q expenseQuerier) error {
		rows, err := q.SoftDeleteExpense(ctx, id)
		if err != nil {
			return fmt.Errorf("delete expense: %w", err)
		}
		if rows == 0 {
			return ErrNotFound
		}

		_, err = q.SoftDeleteExpenseSplitsByExpenseID(ctx, id)
		if err != nil {
			return fmt.Errorf("delete expense splits: %w", err)
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func validateExpenseSplits(amount decimal.Decimal, splits []ExpenseSplitInput) error {
	if len(splits) == 0 {
		return ErrNoSplits
	}

	splitTotal := decimal.Zero
	for _, split := range splits {
		if split.Amount.IsZero() || split.Amount.IsNeg() {
			return ErrSplitAmountNonPositive
		}
		var err error
		splitTotal, err = splitTotal.Add(split.Amount)
		if err != nil {
			return fmt.Errorf("sum split amounts: %w", err)
		}
	}

	if !splitTotal.Equal(amount) {
		return ErrSplitMismatch
	}

	return nil
}

func mapExpenseRecord(row sqlc.Expense) Expense {
	return Expense{
		ID:                row.ID,
		UserID:            row.UserID,
		BudgetID:          row.BudgetID,
		Amount:            row.Amount,
		Date:              row.Date.Time,
		Description:       row.Description,
		RecurringSourceID: uuidFromPGUUID(row.RecurringSourceID),
		CreatedAt:         timestamptzToTime(row.CreatedAt),
		UpdatedAt:         timestamptzToTime(row.UpdatedAt),
	}
}

func mapExpenseSplitRecord(row sqlc.ExpenseSplit) ExpenseSplit {
	return ExpenseSplit{
		ID:          row.ID,
		ExpenseID:   row.ExpenseID,
		CategoryID:  row.CategoryID,
		Amount:      row.Amount,
		Description: row.Description,
		CreatedAt:   timestamptzToTime(row.CreatedAt),
		UpdatedAt:   timestamptzToTime(row.UpdatedAt),
	}
}

func mapExpenseSplitRecords(rows []sqlc.ExpenseSplit) []ExpenseSplit {
	splits := make([]ExpenseSplit, 0, len(rows))
	for _, row := range rows {
		splits = append(splits, mapExpenseSplitRecord(row))
	}
	return splits
}

func uuidToPGUUID(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: *id, Valid: true}
}

func uuidFromPGUUID(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	id := uuid.UUID(value.Bytes)
	return &id
}
