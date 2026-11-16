import { graphql } from '@/lib/gql';

export const GET_CATEGORIES = graphql(`
  query GetCategories($budgetId: ID!) {
    expenseCategories(budgetId: $budgetId) {
      ...CategoryFields
    }
  }
`);
