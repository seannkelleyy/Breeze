import { graphql } from '@/lib/gql';

export const CREATE_EXPENSE = graphql(`
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      ...ExpenseFields
    }
  }
`);

export const UPDATE_EXPENSE = graphql(`
  mutation UpdateExpense($input: UpdateExpenseInput!) {
    updateExpense(input: $input) {
      ...ExpenseFields
    }
  }
`);

export const DELETE_EXPENSE = graphql(`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id)
  }
`);
