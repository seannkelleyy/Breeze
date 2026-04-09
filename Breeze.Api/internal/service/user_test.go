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
)

// mockQuerier is a minimal mock of sqlc.Querier for testing
type mockQuerier struct {
	createUserFunc                   func(context.Context, sqlc.CreateUserParams) (sqlc.CreateUserRow, error)
	getUserByIDFunc                  func(context.Context, uuid.UUID) (sqlc.GetUserByIDRow, error)
	getUserByIdentityProviderIDFunc  func(context.Context, string) (sqlc.GetUserByIdentityProviderIDRow, error)
	listUsersFunc                    func(context.Context) ([]sqlc.ListUsersRow, error)
	updateUserFunc                   func(context.Context, sqlc.UpdateUserParams) (sqlc.UpdateUserRow, error)
	softDeleteUserFunc               func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockQuerier) CreateUser(ctx context.Context, params sqlc.CreateUserParams) (sqlc.CreateUserRow, error) {
	if m.createUserFunc != nil {
		return m.createUserFunc(ctx, params)
	}
	return sqlc.CreateUserRow{}, nil
}

func (m *mockQuerier) GetUserByID(ctx context.Context, id uuid.UUID) (sqlc.GetUserByIDRow, error) {
	if m.getUserByIDFunc != nil {
		return m.getUserByIDFunc(ctx, id)
	}
	return sqlc.GetUserByIDRow{}, nil
}

func (m *mockQuerier) GetUserByIdentityProviderID(ctx context.Context, id string) (sqlc.GetUserByIdentityProviderIDRow, error) {
	if m.getUserByIdentityProviderIDFunc != nil {
		return m.getUserByIdentityProviderIDFunc(ctx, id)
	}
	return sqlc.GetUserByIdentityProviderIDRow{}, nil
}

func (m *mockQuerier) ListUsers(ctx context.Context) ([]sqlc.ListUsersRow, error) {
	if m.listUsersFunc != nil {
		return m.listUsersFunc(ctx)
	}
	return []sqlc.ListUsersRow{}, nil
}

func (m *mockQuerier) UpdateUser(ctx context.Context, params sqlc.UpdateUserParams) (sqlc.UpdateUserRow, error) {
	if m.updateUserFunc != nil {
		return m.updateUserFunc(ctx, params)
	}
	return sqlc.UpdateUserRow{}, nil
}

func (m *mockQuerier) SoftDeleteUser(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteUserFunc != nil {
		return m.softDeleteUserFunc(ctx, id)
	}
	return 0, nil
}

// Helper to create a test user row
func testUserRow() sqlc.CreateUserRow {
	testID := uuid.New()
	testDeductionAmount := mustNumeric("5000.00")
	testTimestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	safeWithdrawalRate, _ := decimal.Parse("0.0400")
	inflationRate, _ := decimal.Parse("0.0300")

	return sqlc.CreateUserRow{
		ID:                 testID,
		IdentityProviderID: "user_123",
		Email:              "test@example.com",
		ReturnType:         sqlc.ReturnTypeREAL,
		SafeWithdrawalRate: safeWithdrawalRate,
		CurrencyType:       "USD",
		InflationRate:      inflationRate,
		DeductionType:      sqlc.DeductionTypeSTANDARD,
		DeductionAmount:    testDeductionAmount,
		MaxTaxBracketID:    pgtype.UUID{},
		FilingStatus:       sqlc.FilingStatusSINGLE,
		PayoffStrategy:     sqlc.PayoffStrategyAVALANCHE,
		CreatedAt:          testTimestamp,
		UpdatedAt:          testTimestamp,
		DeletedAt:          pgtype.Timestamptz{},
	}
}

func mustNumeric(s string) pgtype.Numeric {
	var n pgtype.Numeric
	if err := n.Scan(s); err != nil {
		panic(err)
	}
	return n
}

func TestUserService_Create(t *testing.T) {
	ctx := context.Background()
	userRow := testUserRow()

	t.Run("creates user successfully", func(t *testing.T) {
		mock := &mockQuerier{
			createUserFunc: func(ctx context.Context, params sqlc.CreateUserParams) (sqlc.CreateUserRow, error) {
				assert.Equal(t, "user_123", params.IdentityProviderID)
				assert.Equal(t, "test@example.com", params.Email)
				return userRow, nil
			},
		}

		svc := NewUserService(mock)
		safeWithdrawalRate, _ := decimal.Parse("0.0400")
		inflationRate, _ := decimal.Parse("0.0300")

		input := CreateUserInput{
			IdentityProviderID: "user_123",
			Email:              "test@example.com",
			ReturnType:         sqlc.ReturnTypeREAL,
			SafeWithdrawalRate: safeWithdrawalRate,
			CurrencyType:       "USD",
			InflationRate:      inflationRate,
			DeductionType:      sqlc.DeductionTypeSTANDARD,
			DeductionAmount:    ptrDecimal(safeWithdrawalRate),
			FilingStatus:       sqlc.FilingStatusSINGLE,
			PayoffStrategy:     sqlc.PayoffStrategyAVALANCHE,
		}

		result, err := svc.Create(ctx, input)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, userRow.ID, result.ID)
		assert.Equal(t, "user_123", result.IdentityProviderID)
		assert.Equal(t, "test@example.com", result.Email)
	})

	t.Run("handles nil deduction amount", func(t *testing.T) {
		mock := &mockQuerier{
			createUserFunc: func(ctx context.Context, params sqlc.CreateUserParams) (sqlc.CreateUserRow, error) {
				return userRow, nil
			},
		}

		svc := NewUserService(mock)
		safeWithdrawalRate, _ := decimal.Parse("0.0400")
		inflationRate, _ := decimal.Parse("0.0300")

		input := CreateUserInput{
			IdentityProviderID: "user_123",
			Email:              "test@example.com",
			ReturnType:         sqlc.ReturnTypeREAL,
			SafeWithdrawalRate: safeWithdrawalRate,
			CurrencyType:       "USD",
			InflationRate:      inflationRate,
			DeductionType:      sqlc.DeductionTypeSTANDARD,
			DeductionAmount:    nil,
			FilingStatus:       sqlc.FilingStatusSINGLE,
			PayoffStrategy:     sqlc.PayoffStrategyAVALANCHE,
		}

		result, err := svc.Create(ctx, input)

		assert.NoError(t, err)
		assert.NotNil(t, result)
	})
}

func TestUserService_GetByID(t *testing.T) {
	ctx := context.Background()
	testID := uuid.New()
	userRow := testUserRow()
	userRow.ID = testID

	t.Run("retrieves user by id", func(t *testing.T) {
		mock := &mockQuerier{
			getUserByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetUserByIDRow, error) {
				assert.Equal(t, testID, id)
				return sqlc.GetUserByIDRow{
					ID:                 userRow.ID,
					Email:              userRow.Email,
					IdentityProviderID: userRow.IdentityProviderID,
					ReturnType:         userRow.ReturnType,
					SafeWithdrawalRate: userRow.SafeWithdrawalRate,
					CurrencyType:       userRow.CurrencyType,
					InflationRate:      userRow.InflationRate,
					DeductionType:      userRow.DeductionType,
					DeductionAmount:    userRow.DeductionAmount,
					MaxTaxBracketID:    userRow.MaxTaxBracketID,
					FilingStatus:       userRow.FilingStatus,
					PayoffStrategy:     userRow.PayoffStrategy,
					CreatedAt:          userRow.CreatedAt,
					UpdatedAt:          userRow.UpdatedAt,
					DeletedAt:          userRow.DeletedAt,
				}, nil
			},
		}

		svc := NewUserService(mock)
		result, err := svc.GetByID(ctx, testID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, testID, result.ID)
		assert.Equal(t, "test@example.com", result.Email)
	})

	t.Run("returns ErrNotFound when user does not exist", func(t *testing.T) {
		mock := &mockQuerier{
			getUserByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetUserByIDRow, error) {
				return sqlc.GetUserByIDRow{}, pgx.ErrNoRows
			},
		}

		svc := NewUserService(mock)
		result, err := svc.GetByID(ctx, testID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})

	t.Run("wraps database errors", func(t *testing.T) {
		mock := &mockQuerier{
			getUserByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetUserByIDRow, error) {
				return sqlc.GetUserByIDRow{}, errors.New("database connection error")
			},
		}

		svc := NewUserService(mock)
		result, err := svc.GetByID(ctx, testID)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "get user by id")
	})
}

func TestUserService_GetByIdentityProviderID(t *testing.T) {
	ctx := context.Background()
	userRow := testUserRow()
	providerID := "user_123"

	t.Run("retrieves user by identity provider id", func(t *testing.T) {
		mock := &mockQuerier{
			getUserByIdentityProviderIDFunc: func(ctx context.Context, id string) (sqlc.GetUserByIdentityProviderIDRow, error) {
				assert.Equal(t, providerID, id)
				return sqlc.GetUserByIdentityProviderIDRow{
					ID:                 userRow.ID,
					Email:              userRow.Email,
					IdentityProviderID: userRow.IdentityProviderID,
					ReturnType:         userRow.ReturnType,
					SafeWithdrawalRate: userRow.SafeWithdrawalRate,
					CurrencyType:       userRow.CurrencyType,
					InflationRate:      userRow.InflationRate,
					DeductionType:      userRow.DeductionType,
					DeductionAmount:    userRow.DeductionAmount,
					MaxTaxBracketID:    userRow.MaxTaxBracketID,
					FilingStatus:       userRow.FilingStatus,
					PayoffStrategy:     userRow.PayoffStrategy,
					CreatedAt:          userRow.CreatedAt,
					UpdatedAt:          userRow.UpdatedAt,
					DeletedAt:          userRow.DeletedAt,
				}, nil
			},
		}

		svc := NewUserService(mock)
		result, err := svc.GetByIdentityProviderID(ctx, providerID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, providerID, result.IdentityProviderID)
	})

	t.Run("returns ErrNotFound when user does not exist", func(t *testing.T) {
		mock := &mockQuerier{
			getUserByIdentityProviderIDFunc: func(ctx context.Context, id string) (sqlc.GetUserByIdentityProviderIDRow, error) {
				return sqlc.GetUserByIdentityProviderIDRow{}, pgx.ErrNoRows
			},
		}

		svc := NewUserService(mock)
		result, err := svc.GetByIdentityProviderID(ctx, providerID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestUserService_List(t *testing.T) {
	ctx := context.Background()

	t.Run("lists all users", func(t *testing.T) {
		user1 := testUserRow()
		user2 := testUserRow()
		user2.ID = uuid.New()
		user2.Email = "other@example.com"

		mock := &mockQuerier{
			listUsersFunc: func(ctx context.Context) ([]sqlc.ListUsersRow, error) {
				return []sqlc.ListUsersRow{
					{
						ID:                 user1.ID,
						Email:              user1.Email,
						IdentityProviderID: user1.IdentityProviderID,
						ReturnType:         user1.ReturnType,
						SafeWithdrawalRate: user1.SafeWithdrawalRate,
						CurrencyType:       user1.CurrencyType,
						InflationRate:      user1.InflationRate,
						DeductionType:      user1.DeductionType,
						DeductionAmount:    user1.DeductionAmount,
						MaxTaxBracketID:    user1.MaxTaxBracketID,
						FilingStatus:       user1.FilingStatus,
						PayoffStrategy:     user1.PayoffStrategy,
						CreatedAt:          user1.CreatedAt,
						UpdatedAt:          user1.UpdatedAt,
						DeletedAt:          user1.DeletedAt,
					},
					{
						ID:                 user2.ID,
						Email:              user2.Email,
						IdentityProviderID: user2.IdentityProviderID,
						ReturnType:         user2.ReturnType,
						SafeWithdrawalRate: user2.SafeWithdrawalRate,
						CurrencyType:       user2.CurrencyType,
						InflationRate:      user2.InflationRate,
						DeductionType:      user2.DeductionType,
						DeductionAmount:    user2.DeductionAmount,
						MaxTaxBracketID:    user2.MaxTaxBracketID,
						FilingStatus:       user2.FilingStatus,
						PayoffStrategy:     user2.PayoffStrategy,
						CreatedAt:          user2.CreatedAt,
						UpdatedAt:          user2.UpdatedAt,
						DeletedAt:          user2.DeletedAt,
					},
				}, nil
			},
		}

		svc := NewUserService(mock)
		result, err := svc.List(ctx)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Len(t, result, 2)
		assert.Equal(t, user1.ID, result[0].ID)
		assert.Equal(t, user2.ID, result[1].ID)
	})

	t.Run("returns empty list when no users exist", func(t *testing.T) {
		mock := &mockQuerier{
			listUsersFunc: func(ctx context.Context) ([]sqlc.ListUsersRow, error) {
				return []sqlc.ListUsersRow{}, nil
			},
		}

		svc := NewUserService(mock)
		result, err := svc.List(ctx)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Len(t, result, 0)
	})

	t.Run("wraps database errors", func(t *testing.T) {
		mock := &mockQuerier{
			listUsersFunc: func(ctx context.Context) ([]sqlc.ListUsersRow, error) {
				return nil, errors.New("database error")
			},
		}

		svc := NewUserService(mock)
		result, err := svc.List(ctx)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "list users")
	})
}

func TestUserService_Update(t *testing.T) {
	ctx := context.Background()
	testID := uuid.New()
	userRow := testUserRow()
	userRow.ID = testID

	t.Run("updates user successfully", func(t *testing.T) {
		mock := &mockQuerier{
			updateUserFunc: func(ctx context.Context, params sqlc.UpdateUserParams) (sqlc.UpdateUserRow, error) {
				assert.Equal(t, testID, params.ID)
				assert.Equal(t, "updated@example.com", params.Email)
				updatedRow := sqlc.UpdateUserRow{
					ID:                 userRow.ID,
					Email:              "updated@example.com",
					IdentityProviderID: userRow.IdentityProviderID,
					ReturnType:         userRow.ReturnType,
					SafeWithdrawalRate: userRow.SafeWithdrawalRate,
					CurrencyType:       userRow.CurrencyType,
					InflationRate:      userRow.InflationRate,
					DeductionType:      userRow.DeductionType,
					DeductionAmount:    userRow.DeductionAmount,
					MaxTaxBracketID:    userRow.MaxTaxBracketID,
					FilingStatus:       userRow.FilingStatus,
					PayoffStrategy:     userRow.PayoffStrategy,
					CreatedAt:          userRow.CreatedAt,
					UpdatedAt:          userRow.UpdatedAt,
					DeletedAt:          userRow.DeletedAt,
				}
				return updatedRow, nil
			},
		}

		svc := NewUserService(mock)
		safeWithdrawalRate, _ := decimal.Parse("0.0400")
		inflationRate, _ := decimal.Parse("0.0300")

		input := UpdateUserInput{
			ID:                 testID,
			IdentityProviderID: userRow.IdentityProviderID,
			Email:              "updated@example.com",
			ReturnType:         userRow.ReturnType,
			SafeWithdrawalRate: safeWithdrawalRate,
			CurrencyType:       userRow.CurrencyType,
			InflationRate:      inflationRate,
			DeductionType:      userRow.DeductionType,
			DeductionAmount:    ptrDecimal(safeWithdrawalRate),
			FilingStatus:       userRow.FilingStatus,
			PayoffStrategy:     userRow.PayoffStrategy,
		}

		result, err := svc.Update(ctx, input)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "updated@example.com", result.Email)
	})

	t.Run("returns ErrNotFound when user does not exist", func(t *testing.T) {
		mock := &mockQuerier{
			updateUserFunc: func(ctx context.Context, params sqlc.UpdateUserParams) (sqlc.UpdateUserRow, error) {
				return sqlc.UpdateUserRow{}, pgx.ErrNoRows
			},
		}

		svc := NewUserService(mock)
		safeWithdrawalRate, _ := decimal.Parse("0.0400")
		inflationRate, _ := decimal.Parse("0.0300")

		input := UpdateUserInput{
			ID:                 testID,
			IdentityProviderID: "user_123",
			Email:              "updated@example.com",
			ReturnType:         sqlc.ReturnTypeREAL,
			SafeWithdrawalRate: safeWithdrawalRate,
			CurrencyType:       "USD",
			InflationRate:      inflationRate,
			DeductionType:      sqlc.DeductionTypeSTANDARD,
			FilingStatus:       sqlc.FilingStatusSINGLE,
			PayoffStrategy:     sqlc.PayoffStrategyAVALANCHE,
		}

		result, err := svc.Update(ctx, input)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestUserService_Delete(t *testing.T) {
	ctx := context.Background()
	testID := uuid.New()

	t.Run("deletes user successfully", func(t *testing.T) {
		mock := &mockQuerier{
			softDeleteUserFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				assert.Equal(t, testID, id)
				return 1, nil
			},
		}

		svc := NewUserService(mock)
		err := svc.Delete(ctx, testID)

		assert.NoError(t, err)
	})

	t.Run("returns ErrNotFound when user does not exist", func(t *testing.T) {
		mock := &mockQuerier{
			softDeleteUserFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, nil
			},
		}

		svc := NewUserService(mock)
		err := svc.Delete(ctx, testID)

		assert.ErrorIs(t, err, ErrNotFound)
	})

	t.Run("wraps database errors", func(t *testing.T) {
		mock := &mockQuerier{
			softDeleteUserFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, errors.New("database error")
			},
		}

		svc := NewUserService(mock)
		err := svc.Delete(ctx, testID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "delete user")
	})
}

// Helper function
func ptrDecimal(d decimal.Decimal) *decimal.Decimal {
	return &d
}
