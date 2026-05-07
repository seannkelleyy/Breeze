export const EXCHANGE_PLAID_TOKEN = `
  mutation ExchangePlaidToken($publicToken: String!) {
    exchangePlaidToken(publicToken: $publicToken) {
      id
      accessToken
      institutionId
      institutionName
      createdAt
    }
  }
`;

export const SYNC_PLAID_ACCOUNTS = `
  mutation SyncPlaidAccounts($connectionId: String!) {
    syncPlaidAccounts(connectionId: $connectionId) {
      connectionId
      syncedAt
      accounts {
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
  }
`;

export const GET_PLAID_CONNECTIONS = `
  query GetPlaidConnections {
    getPlaidConnections {
      id
      accessToken
      institutionId
      institutionName
      createdAt
    }
  }
`;

export const GET_PLAID_ACCOUNTS = `
  query GetPlaidAccounts($connectionId: String!) {
    getPlaidAccounts(connectionId: $connectionId) {
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
