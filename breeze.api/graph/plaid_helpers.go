package graph

import (
	"time"

	"breeze.api/graph/model"
	"breeze.api/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

func mapPlaidConnectionToModel(row *sqlc.PlaidConnection) *model.PlaidConnection {
	if row == nil {
		return nil
	}
	return &model.PlaidConnection{
		ID:              row.ID.String(),
		UserID:          row.UserID.String(),
		Environment:     row.Environment,
		InstitutionID:   row.InstitutionID,
		InstitutionName: row.InstitutionName,
		ItemID:          row.ItemID,
		CreatedAt:       timestamptzToRFC3339(row.CreatedAt),
		UpdatedAt:       timestamptzToRFC3339(row.UpdatedAt),
	}
}

func mapPlaidAccountToModel(row *sqlc.PlaidAccount) *model.PlaidAccount {
	if row == nil {
		return nil
	}
	var balPtr *string
	if row.CurrentBalance.Valid {
		raw, err := row.CurrentBalance.Value()
		if err == nil {
			if s, ok := raw.(string); ok {
				balPtr = &s
			}
		}
	}
	return &model.PlaidAccount{
		ID:                row.ID.String(),
		PlaidConnectionID: row.PlaidConnectionID.String(),
		ExternalID:        row.ExternalID,
		Name:              row.Name,
		OfficialName:      row.OfficialName,
		Type:              row.Type,
		Subtype:           row.Subtype,
		CurrentBalance:    balPtr,
		IsoCurrencyCode:   row.IsoCurrencyCode,
		CreatedAt:         timestamptzToRFC3339(row.CreatedAt),
		UpdatedAt:         timestamptzToRFC3339(row.UpdatedAt),
	}
}

func timestamptzToRFC3339(value pgtype.Timestamptz) string {
	if !value.Valid {
		return ""
	}
	return value.Time.UTC().Format(time.RFC3339)
}
