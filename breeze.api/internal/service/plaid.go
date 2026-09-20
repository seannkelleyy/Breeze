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

// PlaidTransaction is one bank transaction pulled from Plaid. Amount is
// positive for money out (spend) and negative for money in, matching Plaid.
type PlaidTransaction struct {
	ExternalID     string
	PlaidAccountID string
	Date           time.Time
	Amount         decimal.Decimal
	Name           string
	Pending        bool
}

// PlaidClient abstracts the external Plaid API calls.
type PlaidClient interface {
	// FetchAccounts returns accounts for an access token.
	FetchAccounts(ctx context.Context, accessToken string) ([]PlaidAccount, error)
	// FetchTransactions returns posted and pending transactions in the range.
	FetchTransactions(ctx context.Context, accessToken string, startDate, endDate time.Time) ([]PlaidTransaction, error)
	// ExchangePublicToken exchanges a Link public_token for an access_token and item_id and institution info.
	ExchangePublicToken(ctx context.Context, publicToken string) (accessToken, itemID, institutionID, institutionName, environment string, err error)
	// CreateLinkToken creates a Link token for initializing Plaid Link.
	CreateLinkToken(ctx context.Context, userID string) (string, error)
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
	ListActivePlaidConnections(ctx context.Context) ([]sqlc.PlaidConnection, error)
	GetPlaidAccountsByConnectionID(ctx context.Context, connectionID uuid.UUID) ([]sqlc.PlaidAccount, error)
	SoftDeletePlaidConnection(ctx context.Context, id uuid.UUID) (int64, error)
	UpsertPlaidTransaction(ctx context.Context, arg sqlc.UpsertPlaidTransactionParams) (sqlc.Transaction, error)
	LinkAssetToPlaidAccount(ctx context.Context, arg sqlc.LinkAssetToPlaidAccountParams) error
	UnlinkAssetFromPlaidAccount(ctx context.Context, id uuid.UUID) error
	LinkLiabilityToPlaidAccount(ctx context.Context, arg sqlc.LinkLiabilityToPlaidAccountParams) error
	UnlinkLiabilityFromPlaidAccount(ctx context.Context, id uuid.UUID) error
	GetAssetsByPlaidAccountID(ctx context.Context, plaidAccountID pgtype.UUID) ([]sqlc.GetAssetsByPlaidAccountIDRow, error)
	GetLiabilitiesByPlaidAccountID(ctx context.Context, plaidAccountID pgtype.UUID) ([]sqlc.GetLiabilitiesByPlaidAccountIDRow, error)
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

// CreateLinkToken creates a Link token for initializing Plaid Link.
func (s *PlaidService) CreateLinkToken(ctx context.Context, userID string) (string, error) {
	token, err := s.client.CreateLinkToken(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("create link token: %w", err)
	}
	return token, nil
}

// LinkAssetToPlaidAccount links an asset to a Plaid account.
func (s *PlaidService) LinkAssetToPlaidAccount(ctx context.Context, assetID, plaidAccountID uuid.UUID) error {
	return s.queries.LinkAssetToPlaidAccount(ctx, sqlc.LinkAssetToPlaidAccountParams{
		ID:             assetID,
		PlaidAccountID: pgtypeUUIDFromPtr(&plaidAccountID),
	})
}

// UnlinkAssetFromPlaidAccount removes the Plaid account link from an asset.
func (s *PlaidService) UnlinkAssetFromPlaidAccount(ctx context.Context, assetID uuid.UUID) error {
	return s.queries.UnlinkAssetFromPlaidAccount(ctx, assetID)
}

// LinkLiabilityToPlaidAccount links a liability to a Plaid account.
func (s *PlaidService) LinkLiabilityToPlaidAccount(ctx context.Context, liabilityID, plaidAccountID uuid.UUID) error {
	return s.queries.LinkLiabilityToPlaidAccount(ctx, sqlc.LinkLiabilityToPlaidAccountParams{
		ID:             liabilityID,
		PlaidAccountID: pgtypeUUIDFromPtr(&plaidAccountID),
	})
}

// UnlinkLiabilityFromPlaidAccount removes the Plaid account link from a liability.
func (s *PlaidService) UnlinkLiabilityFromPlaidAccount(ctx context.Context, liabilityID uuid.UUID) error {
	return s.queries.UnlinkLiabilityFromPlaidAccount(ctx, liabilityID)
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

			var numeric pgtype.Numeric
			numeric, err = decimalToPGNumeric(&balance)
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

		var numeric pgtype.Numeric
		numeric, err = decimalToPGNumeric(&balance)
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

// SyncTransactions pulls the last 90 days of transactions for a connection
// and upserts them, keyed by the Plaid transaction id. Assigned categories
// survive re-syncs.
func (s *PlaidService) SyncTransactions(ctx context.Context, connectionID uuid.UUID) error {
	conn, err := s.queries.GetPlaidConnectionByID(ctx, connectionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get plaid connection: %w", err)
	}

	accounts, err := s.queries.GetPlaidAccountsByConnectionID(ctx, connectionID)
	if err != nil {
		return fmt.Errorf("list plaid accounts: %w", err)
	}
	localAccountByExternal := make(map[string]uuid.UUID, len(accounts))
	for _, a := range accounts {
		localAccountByExternal[a.ExternalID] = a.ID
	}

	end := time.Now().UTC()
	start := end.AddDate(0, 0, -90)
	transactions, err := s.client.FetchTransactions(ctx, conn.AccessToken, start, end)
	if err != nil {
		return fmt.Errorf("fetch transactions: %w", err)
	}

	for _, t := range transactions {
		localAccountID, ok := localAccountByExternal[t.PlaidAccountID]
		if !ok {
			continue
		}
		externalID := t.ExternalID
		if _, err := s.queries.UpsertPlaidTransaction(ctx, sqlc.UpsertPlaidTransactionParams{
			UserID:             conn.UserID,
			PlaidAccountID:     uuidToPGUUID(&localAccountID),
			PlaidTransactionID: &externalID,
			Date:               pgtype.Date{Time: t.Date, Valid: true},
			Amount:             t.Amount,
			Name:               t.Name,
			Pending:            t.Pending,
		}); err != nil {
			return fmt.Errorf("upsert plaid transaction: %w", err)
		}
	}

	return nil
}

// SyncConnection refreshes account balances, then pulls the latest
// transactions. A transaction failure fails the whole call so scheduled runs
// surface it; callers may choose to log-and-continue.
func (s *PlaidService) SyncConnection(ctx context.Context, connectionID uuid.UUID) error {
	if err := s.SyncAccounts(ctx, connectionID); err != nil {
		return err
	}
	return s.SyncTransactions(ctx, connectionID)
}

// ListAllConnections returns every active connection across all users.
func (s *PlaidService) ListAllConnections(ctx context.Context) ([]sqlc.PlaidConnection, error) {
	return s.queries.ListActivePlaidConnections(ctx)
}
