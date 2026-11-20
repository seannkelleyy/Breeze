import { graphql } from '@/lib/gql';

export const RETIREMENT_ACCESS = graphql(`
  query RetirementAccess {
    retirementAccess {
      hsaReceipts {
        id
        userId
        incurredOn
        description
        amount
        createdAt
        updatedAt
      }
      hsaReimbursements {
        id
        userId
        reimbursedOn
        amount
        note
        createdAt
        updatedAt
      }
      hsaSummary {
        totalReceipts
        totalReimbursed
        availableToReimburse
      }
      rothConversions {
        id
        userId
        convertedOn
        amount
        fromAssetId
        toAssetId
        note
        createdAt
        updatedAt
      }
      rothBuckets {
        year
        amount
        availableOn
        accessible
      }
    }
  }
`);

export const CREATE_HSA_RECEIPT = graphql(`
  mutation CreateHsaReceipt($input: CreateHsaReceiptInput!) {
    createHsaReceipt(input: $input) {
      id
      userId
      incurredOn
      description
      amount
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_HSA_RECEIPT = graphql(`
  mutation DeleteHsaReceipt($id: ID!) {
    deleteHsaReceipt(id: $id)
  }
`);

export const CREATE_HSA_REIMBURSEMENT = graphql(`
  mutation CreateHsaReimbursement($input: CreateHsaReimbursementInput!) {
    createHsaReimbursement(input: $input) {
      id
      userId
      reimbursedOn
      amount
      note
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_HSA_REIMBURSEMENT = graphql(`
  mutation DeleteHsaReimbursement($id: ID!) {
    deleteHsaReimbursement(id: $id)
  }
`);

export const CREATE_ROTH_CONVERSION = graphql(`
  mutation CreateRothConversion($input: CreateRothConversionInput!) {
    createRothConversion(input: $input) {
      id
      userId
      convertedOn
      amount
      fromAssetId
      toAssetId
      note
      createdAt
      updatedAt
    }
  }
`);

export const DELETE_ROTH_CONVERSION = graphql(`
  mutation DeleteRothConversion($id: ID!) {
    deleteRothConversion(id: $id)
  }
`);
