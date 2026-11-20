import { graphql } from '@/lib/gql';

export const GET_BUDGET_BY_DATE = graphql(`
  query GetBudgetByDate($date: String!) {
    budgetByDate(date: $date) {
      id
      userId
      date
      monthlyIncome
      monthlyExpenses
      createdAt
      updatedAt
    }
  }
`);

export const CREATE_BUDGET = graphql(`
  mutation CreateBudget($input: CreateBudgetInput!) {
    createBudget(input: $input) {
      id
      userId
      date
      monthlyIncome
      monthlyExpenses
      createdAt
      updatedAt
    }
  }
`);
