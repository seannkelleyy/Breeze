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

// Transaction is a money movement event — pulled from Plaid or entered
// manually. Amount sign convention: positive = money out (spend),
// negative = money in. Assigning an expense category files it under
// monthly spending.
type Transaction struct {
	ID                 uuid.UUID
	UserID             uuid.UUID
	PlaidAccountID     *uuid.UUID
	PlaidTransactionID *string
	Date               time.Time
	Amount             decimal.Decimal
	Name               string
	ExpenseCategoryID  *uuid.UUID
	ExpenseID          *uuid.UUID
	Pending            bool
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type CreateTransactionInput struct {
	UserID            uuid.UUID
	Date              time.Time
	Amount            decimal.Decimal
	Name              string
	ExpenseCategoryID *uuid.UUID
}

type TransactionService struct {
	queries transactionQuerier
}

func NewTransactionService(queries transactionQuerier) *TransactionService {
	return &TransactionService{queries: queries}
}

// BudgetForMonth returns the budget containing the given date, creating an
// empty one when the month has never been budgeted.
func (s *TransactionService) BudgetForMonth(ctx context.Context, budgetSvc *BudgetService, userID uuid.UUID, date time.Time) (*Budget, error) {
	monthStart := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
	if b, err := budgetSvc.GetByDate(ctx, userID, monthStart); err == nil {
		return b, nil
	} else if !errors.Is(err, ErrNotFound) {
		return nil, fmt.Errorf("find budget: %w", err)
	}
	return budgetSvc.Create(ctx, &CreateBudgetInput{UserID: userID, Date: monthStart})
}

type SetTransactionExpenseParams = sqlc.SetTransactionExpenseParams

type transactionQuerier interface {
	SetTransactionExpense(ctx context.Context, arg SetTransactionExpenseParams) (sqlc.Transaction, error)
	CreateTransaction(ctx context.Context, arg sqlc.CreateTransactionParams) (sqlc.Transaction, error)
	UpsertPlaidTransaction(ctx context.Context, arg sqlc.UpsertPlaidTransactionParams) (sqlc.Transaction, error)
	GetTransaction(ctx context.Context, arg sqlc.GetTransactionParams) (sqlc.Transaction, error)
	ListTransactionsByUserID(ctx context.Context, arg sqlc.ListTransactionsByUserIDParams) ([]sqlc.Transaction, error)
	AssignTransactionCategory(ctx context.Context, arg sqlc.AssignTransactionCategoryParams) (sqlc.Transaction, error)
	SoftDeleteTransaction(ctx context.Context, arg sqlc.SoftDeleteTransactionParams) (int64, error)
}

func (s *TransactionService) Create(ctx context.Context, input *CreateTransactionInput) (*Transaction, error) {
	if input.Amount.IsZero() {
		return nil, fmt.Errorf("transaction amount must not be zero")
	}

	row, err := s.queries.CreateTransaction(ctx, sqlc.CreateTransactionParams{
		UserID:            input.UserID,
		Date:              pgtype.Date{Time: input.Date, Valid: true},
		Amount:            input.Amount,
		Name:              input.Name,
		ExpenseCategoryID: uuidToPGUUID(input.ExpenseCategoryID),
		Pending:           false,
	})
	if err != nil {
		return nil, fmt.Errorf("create transaction: %w", err)
	}

	return mapTransactionRecord(&row), nil
}

// GetByID returns the transaction only when it belongs to userID.
func (s *TransactionService) GetByID(ctx context.Context, userID, id uuid.UUID) (*Transaction, error) {
	row, err := s.queries.GetTransaction(ctx, sqlc.GetTransactionParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get transaction: %w", err)
	}

	return mapTransactionRecord(&row), nil
}

func (s *TransactionService) ListByUserID(ctx context.Context, userID uuid.UUID, fromDate, toDate time.Time) ([]Transaction, error) {
	rows, err := s.queries.ListTransactionsByUserID(ctx, sqlc.ListTransactionsByUserIDParams{
		UserID:   userID,
		FromDate: pgtype.Date{Time: fromDate, Valid: true},
		ToDate:   pgtype.Date{Time: toDate, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("list transactions: %w", err)
	}

	transactions := make([]Transaction, 0, len(rows))
	for i := range rows {
		transactions = append(transactions, *mapTransactionRecord(&rows[i]))
	}

	return transactions, nil
}

func (s *TransactionService) AssignCategory(ctx context.Context, userID, id uuid.UUID, categoryID *uuid.UUID) (*Transaction, error) {
	row, err := s.queries.AssignTransactionCategory(ctx, sqlc.AssignTransactionCategoryParams{
		ID:                id,
		UserID:            userID,
		ExpenseCategoryID: uuidToPGUUID(categoryID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign transaction category: %w", err)
	}

	return mapTransactionRecord(&row), nil
}

func (s *TransactionService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteTransaction(ctx, sqlc.SoftDeleteTransactionParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		return fmt.Errorf("delete transaction: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// UpsertFromPlaid inserts or refreshes a bank-synced transaction, keyed by the
// Plaid transaction id. Already-assigned categories are preserved.
func (s *TransactionService) UpsertFromPlaid(
	ctx context.Context,
	userID, plaidAccountID uuid.UUID,
	plaidTransactionID string,
	date time.Time,
	amount decimal.Decimal,
	name string,
	pending bool,
) (*Transaction, error) {
	row, err := s.queries.UpsertPlaidTransaction(ctx, sqlc.UpsertPlaidTransactionParams{
		UserID:             userID,
		PlaidAccountID:     uuidToPGUUID(&plaidAccountID),
		PlaidTransactionID: &plaidTransactionID,
		Date:               pgtype.Date{Time: date, Valid: true},
		Amount:             amount,
		Name:               name,
		Pending:            pending,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert plaid transaction: %w", err)
	}

	return mapTransactionRecord(&row), nil
}

func mapTransactionRecord(row *sqlc.Transaction) *Transaction {
	return &Transaction{
		ID:                 row.ID,
		UserID:             row.UserID,
		PlaidAccountID:     uuidFromPGUUID(row.PlaidAccountID),
		PlaidTransactionID: row.PlaidTransactionID,
		Date:               row.Date.Time,
		Amount:             row.Amount,
		Name:               row.Name,
		ExpenseCategoryID:  uuidFromPGUUID(row.ExpenseCategoryID),
		ExpenseID:          uuidFromPGUUID(row.ExpenseID),
		Pending:            row.Pending,
		CreatedAt:          timestamptzToTime(row.CreatedAt),
		UpdatedAt:          timestamptzToTime(row.UpdatedAt),
	}
}

// SetTransactionExpense links (or unlinks, nil id) the expense that realizes
// this transaction's spending in the budget.
func (s *TransactionService) SetTransactionExpense(ctx context.Context, userID, id uuid.UUID, expenseID *uuid.UUID) (*Transaction, error) {
	row, err := s.queries.SetTransactionExpense(ctx, SetTransactionExpenseParams{
		ID:        id,
		UserID:    userID,
		ExpenseID: uuidToPGUUID(expenseID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("set transaction expense: %w", err)
	}
	return mapTransactionRecord(&row), nil
}
