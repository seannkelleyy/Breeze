package service

import (
	"context"
	"testing"
	"time"

	"breeze.api/internal/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

type mockGoalQuerier struct {
	createGoalFunc                func(context.Context, sqlc.CreateGoalParams) (sqlc.CreateGoalRow, error)
	getGoalByIDFunc               func(context.Context, uuid.UUID) (sqlc.GetGoalByIDRow, error)
	listGoalsFunc                 func(context.Context, uuid.UUID) ([]sqlc.ListGoalsByUserIDRow, error)
	updateGoalFunc                func(context.Context, sqlc.UpdateGoalParams) (sqlc.UpdateGoalRow, error)
	softDeleteGoalFunc            func(context.Context, uuid.UUID) (int64, error)
	listFinancialOrderStepsFunc   func(context.Context, uuid.UUID) ([]sqlc.ListFinancialOrderStepsByUserIDRow, error)
	createFinancialOrderStepsFunc func(context.Context, uuid.UUID) ([]sqlc.CreateFinancialOrderStepsRow, error)
}

func (m *mockGoalQuerier) CreateGoal(ctx context.Context, arg sqlc.CreateGoalParams) (sqlc.CreateGoalRow, error) {
	if m.createGoalFunc != nil {
		return m.createGoalFunc(ctx, arg)
	}
	return sqlc.CreateGoalRow{}, nil
}

func (m *mockGoalQuerier) GetGoalByID(ctx context.Context, id uuid.UUID) (sqlc.GetGoalByIDRow, error) {
	if m.getGoalByIDFunc != nil {
		return m.getGoalByIDFunc(ctx, id)
	}
	return sqlc.GetGoalByIDRow{}, nil
}

func (m *mockGoalQuerier) ListGoalsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListGoalsByUserIDRow, error) {
	if m.listGoalsFunc != nil {
		return m.listGoalsFunc(ctx, userID)
	}
	return []sqlc.ListGoalsByUserIDRow{}, nil
}

func (m *mockGoalQuerier) UpdateGoal(ctx context.Context, arg sqlc.UpdateGoalParams) (sqlc.UpdateGoalRow, error) {
	if m.updateGoalFunc != nil {
		return m.updateGoalFunc(ctx, arg)
	}
	return sqlc.UpdateGoalRow{}, nil
}

func (m *mockGoalQuerier) SoftDeleteGoal(ctx context.Context, id uuid.UUID) (int64, error) {
	if m.softDeleteGoalFunc != nil {
		return m.softDeleteGoalFunc(ctx, id)
	}
	return 0, nil
}

func (m *mockGoalQuerier) ListFinancialOrderStepsByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.ListFinancialOrderStepsByUserIDRow, error) {
	if m.listFinancialOrderStepsFunc != nil {
		return m.listFinancialOrderStepsFunc(ctx, userID)
	}
	return []sqlc.ListFinancialOrderStepsByUserIDRow{}, nil
}

func (m *mockGoalQuerier) CreateFinancialOrderSteps(ctx context.Context, userID uuid.UUID) ([]sqlc.CreateFinancialOrderStepsRow, error) {
	if m.createFinancialOrderStepsFunc != nil {
		return m.createFinancialOrderStepsFunc(ctx, userID)
	}
	return []sqlc.CreateFinancialOrderStepsRow{}, nil
}

func testGoalRow() sqlc.CreateGoalRow {
	timestamp := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	return sqlc.CreateGoalRow{
		ID:          uuid.New(),
		UserID:      uuid.New(),
		Description: "Build emergency fund",
		IsCompleted: false,
		CreatedAt:   timestamp,
		UpdatedAt:   timestamp,
		DeletedAt:   pgtype.Timestamptz{},
	}
}

func goalRowToGetById(row sqlc.CreateGoalRow) sqlc.GetGoalByIDRow {
	return sqlc.GetGoalByIDRow{
		ID:                   row.ID,
		UserID:               row.UserID,
		Description:          row.Description,
		IsCompleted:          row.IsCompleted,
		TargetAmount:         row.TargetAmount,
		TargetDate:           row.TargetDate,
		Category:             row.Category,
		CustomCategory:       row.CustomCategory,
		Priority:             row.Priority,
		Notes:                row.Notes,
		ConnectedAccountIds:  row.ConnectedAccountIds,
		IsFinancialOrderStep: row.IsFinancialOrderStep,
		FinancialOrderStep:   row.FinancialOrderStep,
		CreatedAt:            row.CreatedAt,
		UpdatedAt:            row.UpdatedAt,
		DeletedAt:            row.DeletedAt,
	}
}

func goalRowToList(row sqlc.CreateGoalRow) sqlc.ListGoalsByUserIDRow {
	return sqlc.ListGoalsByUserIDRow{
		ID:                   row.ID,
		UserID:               row.UserID,
		Description:          row.Description,
		IsCompleted:          row.IsCompleted,
		TargetAmount:         row.TargetAmount,
		TargetDate:           row.TargetDate,
		Category:             row.Category,
		CustomCategory:       row.CustomCategory,
		Priority:             row.Priority,
		Notes:                row.Notes,
		ConnectedAccountIds:  row.ConnectedAccountIds,
		IsFinancialOrderStep: row.IsFinancialOrderStep,
		FinancialOrderStep:   row.FinancialOrderStep,
		CreatedAt:            row.CreatedAt,
		UpdatedAt:            row.UpdatedAt,
		DeletedAt:            row.DeletedAt,
	}
}

func goalRowToUpdate(row sqlc.CreateGoalRow) sqlc.UpdateGoalRow {
	return sqlc.UpdateGoalRow{
		ID:                   row.ID,
		UserID:               row.UserID,
		Description:          row.Description,
		IsCompleted:          row.IsCompleted,
		TargetAmount:         row.TargetAmount,
		TargetDate:           row.TargetDate,
		Category:             row.Category,
		CustomCategory:       row.CustomCategory,
		Priority:             row.Priority,
		Notes:                row.Notes,
		ConnectedAccountIds:  row.ConnectedAccountIds,
		IsFinancialOrderStep: row.IsFinancialOrderStep,
		FinancialOrderStep:   row.FinancialOrderStep,
		CreatedAt:            row.CreatedAt,
		UpdatedAt:            row.UpdatedAt,
		DeletedAt:            row.DeletedAt,
	}
}

func TestGoalService_Create(t *testing.T) {
	ctx := context.Background()
	row := testGoalRow()

	mock := &mockGoalQuerier{
		createGoalFunc: func(ctx context.Context, arg sqlc.CreateGoalParams) (sqlc.CreateGoalRow, error) {
			assert.Equal(t, row.UserID, arg.UserID)
			assert.Equal(t, row.Description, arg.Description)
			assert.Equal(t, row.IsCompleted, arg.IsCompleted)
			return row, nil
		},
	}

	svc := NewGoalService(mock)
	result, err := svc.Create(ctx, CreateGoalInput{
		UserID:      row.UserID,
		Description: row.Description,
		IsCompleted: row.IsCompleted,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, row.ID, result.ID)
}

func TestGoalService_GetByID(t *testing.T) {
	ctx := context.Background()
	row := testGoalRow()

	t.Run("retrieves by id", func(t *testing.T) {
		mock := &mockGoalQuerier{
			getGoalByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetGoalByIDRow, error) {
				assert.Equal(t, row.ID, id)
				return goalRowToGetById(row), nil
			},
		}

		svc := NewGoalService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, row.ID, result.ID)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockGoalQuerier{
			getGoalByIDFunc: func(ctx context.Context, id uuid.UUID) (sqlc.GetGoalByIDRow, error) {
				return sqlc.GetGoalByIDRow{}, pgx.ErrNoRows
			},
		}

		svc := NewGoalService(mock)
		result, err := svc.GetByID(ctx, row.ID)

		assert.ErrorIs(t, err, ErrNotFound)
		assert.Nil(t, result)
	})
}

func TestGoalService_ListByUserID(t *testing.T) {
	ctx := context.Background()
	row1 := testGoalRow()
	row2 := testGoalRow()
	row2.ID = uuid.New()
	row2.Description = "Pay off credit card"
	row2.IsCompleted = true

	mock := &mockGoalQuerier{
		listGoalsFunc: func(ctx context.Context, userID uuid.UUID) ([]sqlc.ListGoalsByUserIDRow, error) {
			assert.Equal(t, row1.UserID, userID)
			return []sqlc.ListGoalsByUserIDRow{goalRowToList(row1), goalRowToList(row2)}, nil
		},
	}

	svc := NewGoalService(mock)
	result, err := svc.ListByUserID(ctx, row1.UserID)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, row1.ID, result[0].ID)
	assert.Equal(t, row2.ID, result[1].ID)
}

func TestGoalService_Update(t *testing.T) {
	ctx := context.Background()
	row := testGoalRow()

	mock := &mockGoalQuerier{
		updateGoalFunc: func(ctx context.Context, arg sqlc.UpdateGoalParams) (sqlc.UpdateGoalRow, error) {
			assert.Equal(t, row.ID, arg.ID)
			assert.Equal(t, row.Description, arg.Description)
			assert.True(t, arg.IsCompleted)
			updated := row
			updated.Description = arg.Description
			updated.IsCompleted = arg.IsCompleted
			return goalRowToUpdate(updated), nil
		},
	}

	svc := NewGoalService(mock)
	result, err := svc.Update(ctx, UpdateGoalInput{
		ID:          row.ID,
		Description: row.Description,
		IsCompleted: true,
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.IsCompleted)
}

func TestGoalService_Delete(t *testing.T) {
	ctx := context.Background()
	row := testGoalRow()

	t.Run("deletes goal", func(t *testing.T) {
		mock := &mockGoalQuerier{
			softDeleteGoalFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				assert.Equal(t, row.ID, id)
				return 1, nil
			},
		}

		svc := NewGoalService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.NoError(t, err)
	})

	t.Run("returns not found", func(t *testing.T) {
		mock := &mockGoalQuerier{
			softDeleteGoalFunc: func(ctx context.Context, id uuid.UUID) (int64, error) {
				return 0, nil
			},
		}

		svc := NewGoalService(mock)
		err := svc.Delete(ctx, row.ID)
		assert.ErrorIs(t, err, ErrNotFound)
	})
}
