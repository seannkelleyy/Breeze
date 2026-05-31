export const EXCHANGE_PLAID_PUBLIC_TOKEN = `
  mutation ExchangePlaidPublicToken($userId: ID!, $publicToken: String!) {
    exchangePlaidPublicToken(userId: $userId, publicToken: $publicToken) {
      id
      accessToken
      institutionId
      institutionName
      createdAt
    }
  }
`;

export const SYNC_PLAID_CONNECTION = `
  mutation SyncPlaidConnection($id: ID!) {
    syncPlaidConnection(id: $id)
  }
`;

export const PLAID_CONNECTIONS = `
  query PlaidConnections($userId: ID!) {
    plaidConnections(userId: $userId) {
      id
      accessToken
      institutionId
      institutionName
      createdAt
    }
  }
`;

export const PLAID_ACCOUNTS = `
  query PlaidAccounts($connectionId: ID!) {
    plaidAccounts(connectionId: $connectionId) {
      id
      name
      officialName
      mask
      type
      subtype
      balance
      currency
    }
  }
`;
