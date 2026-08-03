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

type User struct {
	ID                 uuid.UUID
	IdentityProviderID string
	Email              string
	ReturnType         sqlc.ReturnType
	SafeWithdrawalRate decimal.Decimal
	CurrencyType       string
	InflationRate      decimal.Decimal
	DeductionType      sqlc.DeductionType
	DeductionAmount    *decimal.Decimal
	MaxTaxBracketID    *uuid.UUID
	FilingStatus       sqlc.FilingStatus
	PayoffStrategy     sqlc.PayoffStrategy
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type CreateUserInput struct {
	IdentityProviderID string
	Email              string
	ReturnType         sqlc.ReturnType
	SafeWithdrawalRate decimal.Decimal
	CurrencyType       string
	InflationRate      decimal.Decimal
	DeductionType      sqlc.DeductionType
	DeductionAmount    *decimal.Decimal
	MaxTaxBracketID    *uuid.UUID
	FilingStatus       sqlc.FilingStatus
	PayoffStrategy     sqlc.PayoffStrategy
}

type UpdateUserInput struct {
	ID                 uuid.UUID
	IdentityProviderID string
	Email              string
	ReturnType         sqlc.ReturnType
	SafeWithdrawalRate decimal.Decimal
	CurrencyType       string
	InflationRate      decimal.Decimal
	DeductionType      sqlc.DeductionType
	DeductionAmount    *decimal.Decimal
	MaxTaxBracketID    *uuid.UUID
	FilingStatus       sqlc.FilingStatus
	PayoffStrategy     sqlc.PayoffStrategy
}

type userQuerier interface {
	CreateUser(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.CreateUserRow, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (sqlc.GetUserByIDRow, error)
	GetUserByIdentityProviderID(ctx context.Context, identityProviderID string) (sqlc.GetUserByIdentityProviderIDRow, error)
	GetOrCreateUserByEmail(ctx context.Context, arg sqlc.GetOrCreateUserByEmailParams) (sqlc.GetOrCreateUserByEmailRow, error)
	ListUsers(ctx context.Context) ([]sqlc.ListUsersRow, error)
	UpdateUser(ctx context.Context, arg sqlc.UpdateUserParams) (sqlc.UpdateUserRow, error)
	SoftDeleteUser(ctx context.Context, id uuid.UUID) (int64, error)
}

type UserService struct {
	queries userQuerier
}

func NewUserService(queries userQuerier) *UserService {
	return &UserService{queries: queries}
}

func (s *UserService) Create(ctx context.Context, input CreateUserInput) (*User, error) {
	deductionAmount, err := decimalToPGNumeric(input.DeductionAmount)
	if err != nil {
		return nil, fmt.Errorf("encode deduction amount: %w", err)
	}

	row, err := s.queries.CreateUser(ctx, sqlc.CreateUserParams{
		IdentityProviderID: input.IdentityProviderID,
		Email:              input.Email,
		ReturnType:         input.ReturnType,
		SafeWithdrawalRate: input.SafeWithdrawalRate,
		CurrencyType:       input.CurrencyType,
		InflationRate:      input.InflationRate,
		DeductionType:      input.DeductionType,
		DeductionAmount:    deductionAmount,
		MaxTaxBracketID:    uuidToPG(input.MaxTaxBracketID),
		FilingStatus:       input.FilingStatus,
		PayoffStrategy:     input.PayoffStrategy,
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	user, err := mapUserRecord(
		row.ID,
		row.IdentityProviderID,
		row.Email,
		row.ReturnType,
		row.SafeWithdrawalRate,
		row.CurrencyType,
		row.InflationRate,
		row.DeductionType,
		row.DeductionAmount,
		row.MaxTaxBracketID,
		row.FilingStatus,
		row.PayoffStrategy,
		row.CreatedAt,
		row.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("map created user: %w", err)
	}

	return user, nil
}

// GetOrCreate retrieves an existing user by identity provider ID.
// If the user doesn't exist by ID but a user with the same email exists, it updates that user with the new identity provider ID.
// If no user exists, it creates a new one with the provided input.
// This handles the case where a user re-authenticates with a different Clerk account but the same email.
func (s *UserService) GetOrCreate(ctx context.Context, input CreateUserInput) (*User, error) {
	// First, try to get by identity provider ID (typical case for returning users)
	existing, err := s.GetByIdentityProviderID(ctx, input.IdentityProviderID)
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, ErrNotFound) {
		return nil, fmt.Errorf("check existing user: %w", err)
	}

	// User not found by identity provider ID, use get-or-create by email
	deductionAmount, err := decimalToPGNumeric(input.DeductionAmount)
	if err != nil {
		return nil, fmt.Errorf("encode deduction amount: %w", err)
	}

	row, err := s.queries.GetOrCreateUserByEmail(ctx, sqlc.GetOrCreateUserByEmailParams{
		Email:              input.Email,
		IdentityProviderID: input.IdentityProviderID,
		ReturnType:         input.ReturnType,
		SafeWithdrawalRate: input.SafeWithdrawalRate,
		CurrencyType:       input.CurrencyType,
		InflationRate:      input.InflationRate,
		DeductionType:      input.DeductionType,
		DeductionAmount:    deductionAmount,
		MaxTaxBracketID:    uuidToPG(input.MaxTaxBracketID),
		FilingStatus:       input.FilingStatus,
		PayoffStrategy:     input.PayoffStrategy,
	})
	if err != nil {
		return nil, fmt.Errorf("get or create user: %w", err)
	}

	user, err := mapUserRecord(
		row.ID,
		row.IdentityProviderID,
		row.Email,
		row.ReturnType,
		row.SafeWithdrawalRate,
		row.CurrencyType,
		row.InflationRate,
		row.DeductionType,
		row.DeductionAmount,
		row.MaxTaxBracketID,
		row.FilingStatus,
		row.PayoffStrategy,
		row.CreatedAt,
		row.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("map get-or-create user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	row, err := s.queries.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}

	user, err := mapUserRecord(
		row.ID,
		row.IdentityProviderID,
		row.Email,
		row.ReturnType,
		row.SafeWithdrawalRate,
		row.CurrencyType,
		row.InflationRate,
		row.DeductionType,
		row.DeductionAmount,
		row.MaxTaxBracketID,
		row.FilingStatus,
		row.PayoffStrategy,
		row.CreatedAt,
		row.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("map user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetByIdentityProviderID(ctx context.Context, identityProviderID string) (*User, error) {
	row, err := s.queries.GetUserByIdentityProviderID(ctx, identityProviderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get user by identity provider id: %w", err)
	}

	user, err := mapUserRecord(
		row.ID,
		row.IdentityProviderID,
		row.Email,
		row.ReturnType,
		row.SafeWithdrawalRate,
		row.CurrencyType,
		row.InflationRate,
		row.DeductionType,
		row.DeductionAmount,
		row.MaxTaxBracketID,
		row.FilingStatus,
		row.PayoffStrategy,
		row.CreatedAt,
		row.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("map user: %w", err)
	}

	return user, nil
}

func (s *UserService) List(ctx context.Context) ([]User, error) {
	rows, err := s.queries.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}

	users := make([]User, 0, len(rows))
	for _, row := range rows {
		user, mapErr := mapUserRecord(
			row.ID,
			row.IdentityProviderID,
			row.Email,
			row.ReturnType,
			row.SafeWithdrawalRate,
			row.CurrencyType,
			row.InflationRate,
			row.DeductionType,
			row.DeductionAmount,
			row.MaxTaxBracketID,
			row.FilingStatus,
			row.PayoffStrategy,
			row.CreatedAt,
			row.UpdatedAt,
		)
		if mapErr != nil {
			return nil, fmt.Errorf("map listed user: %w", mapErr)
		}
		users = append(users, *user)
	}

	return users, nil
}

func (s *UserService) Update(ctx context.Context, input UpdateUserInput) (*User, error) {
	deductionAmount, err := decimalToPGNumeric(input.DeductionAmount)
	if err != nil {
		return nil, fmt.Errorf("encode deduction amount: %w", err)
	}

	row, err := s.queries.UpdateUser(ctx, sqlc.UpdateUserParams{
		ID:                 input.ID,
		IdentityProviderID: input.IdentityProviderID,
		Email:              input.Email,
		ReturnType:         input.ReturnType,
		SafeWithdrawalRate: input.SafeWithdrawalRate,
		CurrencyType:       input.CurrencyType,
		InflationRate:      input.InflationRate,
		DeductionType:      input.DeductionType,
		DeductionAmount:    deductionAmount,
		MaxTaxBracketID:    uuidToPG(input.MaxTaxBracketID),
		FilingStatus:       input.FilingStatus,
		PayoffStrategy:     input.PayoffStrategy,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update user: %w", err)
	}

	user, err := mapUserRecord(
		row.ID,
		row.IdentityProviderID,
		row.Email,
		row.ReturnType,
		row.SafeWithdrawalRate,
		row.CurrencyType,
		row.InflationRate,
		row.DeductionType,
		row.DeductionAmount,
		row.MaxTaxBracketID,
		row.FilingStatus,
		row.PayoffStrategy,
		row.CreatedAt,
		row.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("map updated user: %w", err)
	}

	return user, nil
}

func (s *UserService) Delete(ctx context.Context, id uuid.UUID) error {
	rows, err := s.queries.SoftDeleteUser(ctx, id)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func mapUserRecord(
	id uuid.UUID,
	identityProviderID string,
	email string,
	returnType sqlc.ReturnType,
	safeWithdrawalRate decimal.Decimal,
	currencyType string,
	inflationRate decimal.Decimal,
	deductionType sqlc.DeductionType,
	deductionAmount pgtype.Numeric,
	maxTaxBracketID pgtype.UUID,
	filingStatus sqlc.FilingStatus,
	payoffStrategy sqlc.PayoffStrategy,
	createdAt pgtype.Timestamptz,
	updatedAt pgtype.Timestamptz,
) (*User, error) {
	deductionAmountValue, err := decimalFromPGNumeric(deductionAmount)
	if err != nil {
		return nil, err
	}

	return &User{
		ID:                 id,
		IdentityProviderID: identityProviderID,
		Email:              email,
		ReturnType:         returnType,
		SafeWithdrawalRate: safeWithdrawalRate,
		CurrencyType:       currencyType,
		InflationRate:      inflationRate,
		DeductionType:      deductionType,
		DeductionAmount:    deductionAmountValue,
		MaxTaxBracketID:    uuidFromPG(maxTaxBracketID),
		FilingStatus:       filingStatus,
		PayoffStrategy:     payoffStrategy,
		CreatedAt:          timestamptzToTime(createdAt),
		UpdatedAt:          timestamptzToTime(updatedAt),
	}, nil
}
