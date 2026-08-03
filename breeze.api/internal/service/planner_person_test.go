package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/govalues/decimal"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

type mockPlannerPersonQuerier struct {
	upsertPlannerPersonFunc              func(context.Context, sqlc.UpsertPlannerPersonParams) (sqlc.PlannerPerson, error)
	listPlannerPeopleByUserIDFunc        func(context.Context, uuid.UUID) ([]sqlc.PlannerPerson, error)
	softDeletePlannerPersonFunc          func(context.Context, uuid.UUID) (int64, error)
	softDeletePlannerPeopleByUserIDFunc  func(context.Context, uuid.UUID) (int64, error)
}

func (m *mockPlannerPersonQuerier) UpsertPlannerPerson(ctx context.Context, arg sqlc.UpsertPlannerPersonParams) (sqlc.PlannerPerson, error) {
	if m.upsertPlannerPersonFunc != nil {
		return m.upsertPlannerPersonFunc(ctx, arg)
	}
	return sqlc.PlannerPerson{}, nil
}

func (m *mockPlannerPersonQuerier) ListPlannerPeopleByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.PlannerPerson, error) {
	if m.listPlannerPeopleByUserIDFunc != nil {
		return m.listPlannerPeopleByUserIDFunc(ctx, userID)
	}
	return []sqlc.PlannerPerson{}, nil
}

func (m *mockPlannerPersonQuerier) SoftDeletePlannerPerson(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeletePlannerPersonFunc != nil {
		return m.softDeletePlannerPersonFunc(ctx, id)
	}
	return 0, nil
}

func (m *mockPlannerPersonQuerier) SoftDeletePlannerPeopleByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	if m.softDeletePlannerPeopleByUserIDFunc != nil {
		return m.softDeletePlannerPeopleByUserIDFunc(ctx, userID)
	}
	return 0, nil
}

func testPlannerPersonRow() sqlc.PlannerPerson {
	personID := uuid.New()
	userID := uuid.New()
	salary, _ := decimal.Parse("85000.00")
	bonus, _ := decimal.Parse("5000.00")
	growthRate, _ := decimal.Parse("3.50")
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.PlannerPerson{
		ID:               personID,
		UserID:           userID,
		Name:             "Jane Doe",
		Birthday:         "1990-06-15",
		RetirementAge:    65,
		AnnualSalary:     salary,
		BonusMode:        "dollars",
		AnnualBonus:      bonus,
		IncomeGrowthRate: growthRate,
		CreatedAt:        timestamp,
		UpdatedAt:        timestamp,
		DeletedAt:        pgtype.Timestamptz{},
	}
}

func TestPlannerPersonService_Upsert(t *testing.T) {
	ctx := context.Background()
	expected := testPlannerPersonRow()

	mock := &mockPlannerPersonQuerier{
		upsertPlannerPersonFunc: func(ctx context.Context, arg sqlc.UpsertPlannerPersonParams) (sqlc.PlannerPerson, error) {
			return expected, nil
		},
	}

	svc := NewPlannerPersonService(mock)
	result, err := svc.Upsert(ctx, UpsertPlannerPersonInput{
		ID:               expected.ID,
		UserID:           expected.UserID,
		Name:             expected.Name,
		Birthday:         expected.Birthday,
		RetirementAge:    expected.RetirementAge,
		AnnualSalary:     expected.AnnualSalary,
		BonusMode:        expected.BonusMode,
		AnnualBonus:      expected.AnnualBonus,
		IncomeGrowthRate: expected.IncomeGrowthRate,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expected.ID, result.ID)
	assert.Equal(t, expected.UserID, result.UserID)
	assert.Equal(t, expected.Name, result.Name)
	assert.Equal(t, expected.Birthday, result.Birthday)
	assert.Equal(t, expected.RetirementAge, result.RetirementAge)
	assert.True(t, expected.AnnualSalary.Equal(result.AnnualSalary))
	assert.Equal(t, expected.BonusMode, result.BonusMode)
	assert.True(t, expected.AnnualBonus.Equal(result.AnnualBonus))
	assert.True(t, expected.IncomeGrowthRate.Equal(result.IncomeGrowthRate))
}

func TestPlannerPersonService_Upsert_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("db connection failed")

	mock := &mockPlannerPersonQuerier{
		upsertPlannerPersonFunc: func(ctx context.Context, arg sqlc.UpsertPlannerPersonParams) (sqlc.PlannerPerson, error) {
			return sqlc.PlannerPerson{}, dbErr
		},
	}

	svc := NewPlannerPersonService(mock)
	result, err := svc.Upsert(ctx, UpsertPlannerPersonInput{
		ID:     uuid.New(),
		UserID: uuid.New(),
		Name:   "Test",
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, dbErr)
}

func TestPlannerPersonService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	person1 := testPlannerPersonRow()
	person1.UserID = userID
	person2 := testPlannerPersonRow()
	person2.UserID = userID

	mock := &mockPlannerPersonQuerier{
		listPlannerPeopleByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.PlannerPerson, error) {
			assert.Equal(t, userID, uid)
			return []sqlc.PlannerPerson{person1, person2}, nil
		},
	}

	svc := NewPlannerPersonService(mock)
	result, err := svc.ListByUserID(ctx, userID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, person1.ID, result[0].ID)
	assert.Equal(t, person2.ID, result[1].ID)
}

func TestPlannerPersonService_ListByUserID_Empty(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()

	mock := &mockPlannerPersonQuerier{
		listPlannerPeopleByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.PlannerPerson, error) {
			return []sqlc.PlannerPerson{}, nil
		},
	}

	svc := NewPlannerPersonService(mock)
	result, err := svc.ListByUserID(ctx, userID)

	assert.NoError(t, err)
	assert.Empty(t, result)
}

func TestPlannerPersonService_ListByUserID_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("query failed")

	mock := &mockPlannerPersonQuerier{
		listPlannerPeopleByUserIDFunc: func(ctx context.Context, uid uuid.UUID) ([]sqlc.PlannerPerson, error) {
			return nil, dbErr
		},
	}

	svc := NewPlannerPersonService(mock)
	result, err := svc.ListByUserID(ctx, uuid.New())

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.ErrorIs(t, err, dbErr)
}

func TestPlannerPersonService_Delete(t *testing.T) {
	ctx := context.Background()
	personID := uuid.New()

	mock := &mockPlannerPersonQuerier{
		softDeletePlannerPersonFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			assert.Equal(t, personID, id)
			return 1, nil
		},
	}

	svc := NewPlannerPersonService(mock)
	err := svc.Delete(ctx, personID)

	assert.NoError(t, err)
}

func TestPlannerPersonService_Delete_NotFound(t *testing.T) {
	ctx := context.Background()

	mock := &mockPlannerPersonQuerier{
		softDeletePlannerPersonFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			return 0, nil
		},
	}

	svc := NewPlannerPersonService(mock)
	err := svc.Delete(ctx, uuid.New())

	assert.Error(t, err)
	assert.Equal(t, ErrNotFound, err)
}

func TestPlannerPersonService_Delete_Error(t *testing.T) {
	ctx := context.Background()
	dbErr := errors.New("delete failed")

	mock := &mockPlannerPersonQuerier{
		softDeletePlannerPersonFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
			return 0, dbErr
		},
	}

	svc := NewPlannerPersonService(mock)
	err := svc.Delete(ctx, uuid.New())

	assert.Error(t, err)
	assert.ErrorIs(t, err, dbErr)
}
