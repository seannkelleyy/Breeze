import { graphql } from '@/lib/gql';

export const GET_PAYCHECK_DEDUCTIONS = graphql(`
  query PaycheckDeductions($personId: ID!) {
    paycheckDeductions(personId: $personId) {
      id
      userId
      personId
      name
      amount
      pretax
      kind
      linkedAccountId
      createdAt
      updatedAt
    }
  }
`);

export const UPSERT_PAYCHECK_DEDUCTION = graphql(`
  mutation UpsertPaycheckDeduction($input: UpsertPaycheckDeductionInput!) {
    upsertPaycheckDeduction(input: $input) {
      id
      userId
      personId
      name
      amount
      pretax
      kind
      linkedAccountId
      createdAt
      updatedAt
    }
  }
`);

export const GET_PAYCHECK_DEDUCTIONS_BY_USER = graphql(`
  query PaycheckDeductionsByUser($userId: ID!) {
    paycheckDeductionsByUser(userId: $userId) {
      id
      userId
      personId
      name
      amount
      pretax
      kind
      linkedAccountId
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_PAYCHECK_DEDUCTION = graphql(`
  mutation DeletePaycheckDeduction($id: ID!) {
    deletePaycheckDeduction(id: $id)
  }
`);
