package graph

import (
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/service"
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
