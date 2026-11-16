import { graphql } from '@/lib/gql';

export const CATEGORY_FIELDS = graphql(`
  fragment CategoryFields on ExpenseCategory {
    id
    userId
    budgetId
    name
    allocation
    currentSpend
    sourceType
    sourceTemplateId
    generationMonth
    createdAt
    updatedAt
  }
`);
