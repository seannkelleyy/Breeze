import { graphql } from '@/lib/gql';

export const CREATE_INCOME = graphql(`
  mutation CreateIncome($input: CreateIncomeInput!) {
    createIncome(input: $input) {
      ...IncomeFields
    }
  }
`);

export const UPDATE_INCOME = graphql(`
  mutation UpdateIncome($input: UpdateIncomeInput!) {
    updateIncome(input: $input) {
      ...IncomeFields
    }
  }
`);

export const DELETE_INCOME = graphql(`
  mutation DeleteIncome($id: ID!) {
    deleteIncome(id: $id)
  }
`);
