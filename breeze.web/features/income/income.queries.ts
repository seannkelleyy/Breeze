import { graphql } from '@/lib/gql';

export const GET_INCOMES_BY_BUDGET = graphql(`
  query GetIncomesByBudget($budgetId: ID!) {
    incomes(budgetId: $budgetId) {
      ...IncomeFields
    }
  }
`);
