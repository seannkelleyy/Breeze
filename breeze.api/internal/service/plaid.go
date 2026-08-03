package service

import (
	"context"
	"errors"
	"fmt"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PlaidAccount represents the minimal account fields we persist.
type PlaidAccount struct {
	ExternalID      string
	Name            string
	OfficialName    *string
	Type            *string
	Subtype         *string
	CurrentBalance  *decimal.Decimal
	ISOCurrencyCode *string
}

// PlaidClient abstracts the external Plaid API calls.
type PlaidClient interface {
	// FetchAccounts returns accounts for an access token.
	FetchAccounts(ctx context.Context, accessToken string) ([]PlaidAccount, error)
	// ExchangePublicToken exchanges a Link public_token for an access_token and item_id and institution info.
	ExchangePublicToken(ctx context.Context, publicToken string) (accessToken, itemID, institutionID, institutionName, environment string, err error)
}

type PlaidService struct {
	queries plaidQuerier
	pool    *pgxpool.Pool
	client  PlaidClient
}

type plaidQuerier interface {
	CreatePlaidConnection(ctx context.Context, arg sqlc.CreatePlaidConnectionParams) (sqlc.PlaidConnection, error)
	GetPlaidConnectionByID(ctx context.Context, id uuid.UUID) (sqlc.PlaidConnection, error)
	UpsertPlaidAccount(ctx context.Context, arg sqlc.UpsertPlaidAccountParams) (sqlc.PlaidAccount, error)
	UpdatePlaidConnection(ctx context.Context, arg sqlc.UpdatePlaidConnectionParams) (sqlc.PlaidConnection, error)
	ListPlaidConnectionsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PlaidConnection, error)
	GetPlaidAccountsByConnectionID(ctx context.Context, connectionID uuid.UUID) ([]sqlc.PlaidAccount, error)
	SoftDeletePlaidConnection(ctx context.Context, id uuid.UUID) (int64, error)
}

type plaidTxQuerier interface {
	plaidQuerier
	WithTx(tx pgx.Tx) *sqlc.Queries
}

func NewPlaidService(queries plaidQuerier, pool *pgxpool.Pool, client PlaidClient) *PlaidService {
	return &PlaidService{queries: queries, pool: pool, client: client}
}

// CreateConnection stores a new Plaid connection (token exchange should be handled by caller).
func (s *PlaidService) CreateConnection(ctx context.Context, userID uuid.UUID, environment, institutionID, institutionName, accessToken, itemID string) (*sqlc.PlaidConnection, error) {
	var instID *string
	if institutionID != "" {
		instID = &institutionID
	}
	var instName *string
	if institutionName != "" {
		instName = &institutionName
	}

	row, err := s.queries.CreatePlaidConnection(ctx, sqlc.CreatePlaidConnectionParams{
		UserID:          userID,
		Environment:     environment,
		InstitutionID:   instID,
		InstitutionName: instName,
		AccessToken:     accessToken,
		ItemID:          itemID,
	})
	if err != nil {
		return nil, fmt.Errorf("create plaid connection: %w", err)
	}
	return &row, nil
}

// ExchangePublicToken exchanges the public token via the Plaid client and stores the resulting connection.
func (s *PlaidService) ExchangePublicToken(ctx context.Context, userID uuid.UUID, publicToken string) (*sqlc.PlaidConnection, error) {
	accessToken, itemID, institutionID, institutionName, environment, err := s.client.ExchangePublicToken(ctx, publicToken)
	if err != nil {
		return nil, fmt.Errorf("exchange public token: %w", err)
	}

	return s.CreateConnection(ctx, userID, environment, institutionID, institutionName, accessToken, itemID)
}

func (s *PlaidService) GetByID(ctx context.Context, id uuid.UUID) (*sqlc.PlaidConnection, error) {
	row, err := s.queries.GetPlaidConnectionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get plaid connection: %w", err)
	}
	return &row, nil
}

func (s *PlaidService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PlaidConnection, error) {
	rows, err := s.queries.ListPlaidConnectionsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list plaid connections: %w", err)
	}
	return rows, nil
}

func (s *PlaidService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeletePlaidConnection(ctx, id)
	if err != nil {
		return fmt.Errorf("delete plaid connection: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *PlaidService) ListAccountsByConnectionID(ctx context.Context, connectionID uuid.UUID) ([]sqlc.PlaidAccount, error) {
	rows, err := s.queries.GetPlaidAccountsByConnectionID(ctx, connectionID)
	if err != nil {
		return nil, fmt.Errorf("list plaid accounts: %w", err)
	}
	return rows, nil
}

// SyncAccounts fetches accounts from Plaid and upserts them into the DB.
func (s *PlaidService) SyncAccounts(ctx context.Context, connectionID uuid.UUID) error {
	conn, err := s.queries.GetPlaidConnectionByID(ctx, connectionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get plaid connection: %w", err)
	}

	accounts, err := s.client.FetchAccounts(ctx, conn.AccessToken)
	if err != nil {
		return fmt.Errorf("fetch accounts: %w", err)
	}

	if s.pool == nil {
		for _, a := range accounts {
			var balance decimal.Decimal
			if a.CurrentBalance != nil {
				balance = *a.CurrentBalance
			} else {
				balance = decimal.MustParse("0")
			}

			numeric, err := decimalToPGNumeric(&balance)
			if err != nil {
				return fmt.Errorf("convert balance: %w", err)
			}

			_, err = s.queries.UpsertPlaidAccount(ctx, sqlc.UpsertPlaidAccountParams{
				PlaidConnectionID: conn.ID,
				ExternalID:        a.ExternalID,
				Name:              a.Name,
				OfficialName:      a.OfficialName,
				Type:              a.Type,
				Subtype:           a.Subtype,
				CurrentBalance:    numeric,
				IsoCurrencyCode:   a.ISOCurrencyCode,
			})
			if err != nil {
				return fmt.Errorf("upsert plaid account: %w", err)
			}
		}

		_, err = s.queries.UpdatePlaidConnection(ctx, sqlc.UpdatePlaidConnectionParams{
			ID:              conn.ID,
			InstitutionID:   conn.InstitutionID,
			InstitutionName: conn.InstitutionName,
			AccessToken:     conn.AccessToken,
			ItemID:          conn.ItemID,
		})
		if err != nil {
			return fmt.Errorf("refresh plaid connection timestamp: %w", err)
		}

		return nil
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	txQueries, ok := s.queries.(plaidTxQuerier)
	if !ok {
		return fmt.Errorf("plaid queries do not support transactions")
	}

	q := txQueries.WithTx(tx)
	for _, a := range accounts {
		var balance decimal.Decimal
		if a.CurrentBalance != nil {
			balance = *a.CurrentBalance
		} else {
			balance = decimal.MustParse("0")
		}

		numeric, err := decimalToPGNumeric(&balance)
		if err != nil {
			return fmt.Errorf("convert balance: %w", err)
		}

		_, err = q.UpsertPlaidAccount(ctx, sqlc.UpsertPlaidAccountParams{
			PlaidConnectionID: conn.ID,
			ExternalID:        a.ExternalID,
			Name:              a.Name,
			OfficialName:      a.OfficialName,
			Type:              a.Type,
			Subtype:           a.Subtype,
			CurrentBalance:    numeric,
			IsoCurrencyCode:   a.ISOCurrencyCode,
		})
		if err != nil {
			return fmt.Errorf("upsert plaid account: %w", err)
		}
	}

	_, err = q.UpdatePlaidConnection(ctx, sqlc.UpdatePlaidConnectionParams{
		ID:              conn.ID,
		InstitutionID:   conn.InstitutionID,
		InstitutionName: conn.InstitutionName,
		AccessToken:     conn.AccessToken,
		ItemID:          conn.ItemID,
	})
	if err != nil {
		return fmt.Errorf("refresh plaid connection timestamp: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

// Helper timestamp conversion used elsewhere in service layer (consistent with other services)
// timestamptzToTime removed; service-wide helper exists in other files.
