export const ME_QUERY = `
  query Me {
    me {
      id
      email
      identityProviderId
      inflationRate
      safeWithdrawalRate
      filingStatus
      returnType
      currencyType
      deductionType
      deductionAmount
      payoffStrategy
      maxTaxBracketId
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      identityProviderId
      inflationRate
      safeWithdrawalRate
      filingStatus
      returnType
      currencyType
      deductionType
      deductionAmount
      payoffStrategy
      maxTaxBracketId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_MUTATION = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      email
      identityProviderId
      inflationRate
      safeWithdrawalRate
      filingStatus
      returnType
      currencyType
      deductionType
      deductionAmount
      payoffStrategy
      maxTaxBracketId
      createdAt
      updatedAt
    }
  }
`;
