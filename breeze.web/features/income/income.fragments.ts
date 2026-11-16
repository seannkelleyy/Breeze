import { graphql } from '@/lib/gql';

export const INCOME_FIELDS = graphql(`
  fragment IncomeFields on Income {
    id
    userId
    budgetId
    name
    amount
    date
    sourceType
    sourceTemplateId
    sourceOccurrenceDate
    generationMonth
    personId
    createdAt
    updatedAt
  }
`);
