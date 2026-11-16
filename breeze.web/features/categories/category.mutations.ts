import { graphql } from '@/lib/gql';

export const CREATE_EXPENSE_CATEGORY = graphql(`
  mutation CreateExpenseCategory($input: CreateExpenseCategoryInput!) {
    createExpenseCategory(input: $input) {
      ...CategoryFields
    }
  }
`);

export const UPDATE_EXPENSE_CATEGORY = graphql(`
  mutation UpdateExpenseCategory($input: UpdateExpenseCategoryInput!) {
    updateExpenseCategory(input: $input) {
      ...CategoryFields
    }
  }
`);

export const DELETE_EXPENSE_CATEGORY = graphql(`
  mutation DeleteExpenseCategory($id: ID!) {
    deleteExpenseCategory(id: $id)
  }
`);
