package graph

import (
	"context"
	"errors"
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"breeze.api/internal/service"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
)

func mapTransactionToModel(t *service.Transaction) *model.Transaction {
	var plaidAccountID *string
	if t.PlaidAccountID != nil {
		id := t.PlaidAccountID.String()
		plaidAccountID = &id
	}
	var plaidTransactionID *string
	if t.PlaidTransactionID != nil {
		plaidTransactionID = t.PlaidTransactionID
	}
	var categoryID *string
	if t.ExpenseCategoryID != nil {
		id := t.ExpenseCategoryID.String()
		categoryID = &id
	}

	return &model.Transaction{
		ID:                 t.ID.String(),
		UserID:             t.UserID.String(),
		PlaidAccountID:     plaidAccountID,
		PlaidTransactionID: plaidTransactionID,
		Date:               t.Date.Format("2006-01-02"),
		Amount:             t.Amount.String(),
		Name:               t.Name,
		ExpenseCategoryID:  categoryID,
		Pending:            t.Pending,
		CreatedAt:          t.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          t.UpdatedAt.Format(time.RFC3339),
	}
}

// syncTransactionExpense mirrors a categorized transaction into its budget as
// an expense row. Clearing the category deletes the realized expense.
func (r *Resolver) syncTransactionExpense(ctx context.Context, userID uuid.UUID, tx *service.Transaction) error {
	if tx.ExpenseCategoryID == nil {
		if tx.ExpenseID != nil {
			return r.ExpenseService.Delete(ctx, *tx.ExpenseID)
		}
		return nil
	}

	budget, err := r.TransactionService.BudgetForMonth(ctx, r.BudgetService, userID, tx.Date)
	if err != nil {
		return err
	}

	// Spend amount is the positive (money-out) magnitude.
	amount := tx.Amount
	if amount.IsNeg() {
		var negErr error
		if amount, negErr = amount.Mul(decimal.MustParse("-1")); negErr != nil {
			return negErr
		}
	}

	input := &service.CreateExpenseInput{
		UserID:      userID,
		BudgetID:    budget.ID,
		Amount:      amount,
		Date:        tx.Date,
		Description: tx.Name,
		SourceType:  sqlc.ExpenseSourceTypeMANUAL,
		Splits: []service.ExpenseSplitInput{
			{CategoryID: *tx.ExpenseCategoryID, Amount: amount},
		},
	}

	if tx.ExpenseID != nil {
		if delErr := r.ExpenseService.Delete(ctx, *tx.ExpenseID); delErr != nil && !errors.Is(delErr, service.ErrNotFound) {
			return delErr
		}
	}

	created, err := r.ExpenseService.Create(ctx, input)
	if err != nil {
		return err
	}
	if _, err := r.TransactionService.SetTransactionExpense(ctx, tx.ID, &created.ID); err != nil {
		return err
	}
	return nil
}
