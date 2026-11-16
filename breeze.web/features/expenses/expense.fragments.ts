import { graphql } from '@/lib/gql';

export const EXPENSE_FIELDS = graphql(`
  fragment ExpenseFields on Expense {
    id
    userId
    budgetId
    amount
    date
    description
    splits {
      id
      categoryId
      amount
      description
    }
    sourceType
    sourceTemplateId
    generationMonth
    personId
    createdAt
    updatedAt
  }
`);
