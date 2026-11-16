import { graphql } from '@/lib/gql';

export const GET_EXPENSES_BY_BUDGET = graphql(`
  query GetExpensesByBudget($budgetId: ID!) {
    expenses(budgetId: $budgetId) {
      ...ExpenseFields
    }
  }
`);
