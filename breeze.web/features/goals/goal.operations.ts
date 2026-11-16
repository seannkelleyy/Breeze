import { graphql } from '@/lib/gql';

export const GET_GOALS = graphql(`
  query GetGoals($userId: ID!) {
    goals(userId: $userId) {
      id
      userId
      description
      isCompleted
      targetAmount
      targetDate
      category
      customCategory
      priority
      notes
      connectedAccountIds
      isFinancialOrderStep
      financialOrderStep
      createdAt
      updatedAt
    }
  }
`);

export const CREATE_GOAL = graphql(`
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) {
      id
      userId
      description
      isCompleted
      targetAmount
      targetDate
      category
      customCategory
      priority
      notes
      connectedAccountIds
      isFinancialOrderStep
      financialOrderStep
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_GOAL = graphql(`
  mutation UpdateGoal($input: UpdateGoalInput!) {
    updateGoal(input: $input) {
      id
      userId
      description
      isCompleted
      targetAmount
      targetDate
      category
      customCategory
      priority
      notes
      connectedAccountIds
      isFinancialOrderStep
      financialOrderStep
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_GOAL = graphql(`
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`);

export const CREATE_FINANCIAL_ORDER_STEPS = graphql(`
  mutation CreateFinancialOrderSteps {
    createFinancialOrderSteps {
      id
      userId
      description
      isCompleted
      targetAmount
      targetDate
      category
      customCategory
      priority
      notes
      connectedAccountIds
      isFinancialOrderStep
      financialOrderStep
      createdAt
      updatedAt
    }
  }
`);
