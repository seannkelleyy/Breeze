import { graphql } from '@/lib/gql';

export const EXCHANGE_PLAID_PUBLIC_TOKEN = graphql(`
  mutation ExchangePlaidPublicToken($userId: ID!, $publicToken: String!) {
    exchangePlaidPublicToken(userId: $userId, publicToken: $publicToken) {
      id
      userId
      environment
      itemId
      institutionId
      institutionName
      updatedAt
      createdAt
    }
  }
`);

export const SYNC_PLAID_CONNECTION = graphql(`
  mutation SyncPlaidConnection($id: ID!) {
    syncPlaidConnection(id: $id)
  }
`);

export const DELETE_PLAID_CONNECTION = graphql(`
  mutation DeletePlaidConnection($id: ID!) {
    deletePlaidConnection(id: $id)
  }
`);

export const PLAID_CONNECTIONS = graphql(`
  query PlaidConnections($userId: ID!) {
    plaidConnections(userId: $userId) {
      id
      userId
      environment
      itemId
      institutionId
      institutionName
      updatedAt
      createdAt
    }
  }
`);

export const PLAID_ACCOUNTS = graphql(`
  query PlaidAccounts($connectionId: ID!) {
    plaidAccounts(connectionId: $connectionId) {
      id
      plaidConnectionId
      externalId
      name
      officialName
      type
      subtype
      currentBalance
      isoCurrencyCode
      createdAt
      updatedAt
    }
  }
`);

export const CREATE_PLAID_LINK_TOKEN = graphql(`
  query CreatePlaidLinkToken($userId: ID!) {
    createPlaidLinkToken(userId: $userId)
  }
`);
