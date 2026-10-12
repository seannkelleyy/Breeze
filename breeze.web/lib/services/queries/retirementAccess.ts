export const RETIREMENT_ACCESS = `
  query RetirementAccess($userId: ID!) {
    retirementAccess(userId: $userId) {
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
`;

export const CREATE_HSA_RECEIPT = `
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
`;

export const DELETE_HSA_RECEIPT = `
  mutation DeleteHsaReceipt($id: ID!) {
    deleteHsaReceipt(id: $id)
  }
`;

export const CREATE_HSA_REIMBURSEMENT = `
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
`;

export const DELETE_HSA_REIMBURSEMENT = `
  mutation DeleteHsaReimbursement($id: ID!) {
    deleteHsaReimbursement(id: $id)
  }
`;

export const CREATE_ROTH_CONVERSION = `
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
`;

export const DELETE_ROTH_CONVERSION = `
  mutation DeleteRothConversion($id: ID!) {
    deleteRothConversion(id: $id)
  }
`;
