export const GET_ASSETS_BY_USER = `
  query GetAssetsByUser($userId: ID!) {
    assets(userId: $userId) {
      id
      userId
      name
      assetType
      currentValue
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
    }
  }
`;

export const CREATE_ASSET = `
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_ASSET = `
  mutation UpdateAsset($input: UpdateAssetInput!) {
    updateAsset(input: $input) {
      id
      name
    }
  }
`;

export const CREATE_LIABILITY = `
  mutation CreateLiability($input: CreateLiabilityInput!) {
    createLiability(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_LIABILITY = `
  mutation UpdateLiability($input: UpdateLiabilityInput!) {
    updateLiability(input: $input) {
      id
      name
    }
  }
`;
