export const GET_ASSETS_BY_USER = `
  query GetAssetsByUser($userId: ID!) {
    assets(userId: $userId) {
      id
      userId
      name
      assetType
      currentValue
      lastValueUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_LIABILITIES_BY_USER = `
  query GetLiabilitiesByUser($userId: ID!) {
    liabilities(userId: $userId) {
      id
      userId
      name
      liabilityType
      currentBalance
      interestRate
      minimumPayment
      targetExtraPayment
      payoffPriority
      lastBalanceUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ASSET = `
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      id
      userId
      name
      assetType
      currentValue
      lastValueUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ASSET = `
  mutation UpdateAsset($input: UpdateAssetInput!) {
    updateAsset(input: $input) {
      id
      userId
      name
      assetType
      currentValue
      lastValueUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_LIABILITY = `
  mutation CreateLiability($input: CreateLiabilityInput!) {
    createLiability(input: $input) {
      id
      userId
      name
      liabilityType
      currentBalance
      interestRate
      minimumPayment
      targetExtraPayment
      payoffPriority
      lastBalanceUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_LIABILITY = `
  mutation UpdateLiability($input: UpdateLiabilityInput!) {
    updateLiability(input: $input) {
      id
      userId
      name
      liabilityType
      currentBalance
      interestRate
      minimumPayment
      targetExtraPayment
      payoffPriority
      lastBalanceUpdatedAt
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ASSET = `
  mutation DeleteAsset($id: ID!) {
    deleteAsset(id: $id)
  }
`;

export const DELETE_LIABILITY = `
  mutation DeleteLiability($id: ID!) {
    deleteLiability(id: $id)
  }
`;

export const GET_ASSETS = GET_ASSETS_BY_USER;
export const GET_LIABILITIES = GET_LIABILITIES_BY_USER;
