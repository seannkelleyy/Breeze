'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EXCHANGE_PLAID_PUBLIC_TOKEN,
  PLAID_ACCOUNTS,
  PLAID_CONNECTIONS,
  SYNC_PLAID_CONNECTION,
  DELETE_PLAID_CONNECTION,
  CREATE_PLAID_LINK_TOKEN,
} from '../plaid.operations';
import useGraphql from '../../../lib/services/useGraphql';
import type { PlaidAccountsQuery, PlaidConnectionsQuery } from '@/lib/gql/graphql';

/** Response shapes derived from the generated documents — these can't drift
 * from the API because `npm run codegen` ties them to the schema. */
export type PlaidConnection = PlaidConnectionsQuery['plaidConnections'][number];
export type PlaidAccount = PlaidAccountsQuery['plaidAccounts'][number];

export const useCreateLinkToken = () => {
  const { request } = useGraphql();

  return useMutation({
    mutationFn: async (userId: string) => {
      const resp = await request(CREATE_PLAID_LINK_TOKEN, { userId });
      return resp.createPlaidLinkToken;
    },
  });
};

export const useExchangePlaidToken = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, publicToken }: { userId: string; publicToken: string }) => {
      return request(EXCHANGE_PLAID_PUBLIC_TOKEN, { userId, publicToken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidConnections'] });
    },
  });
};

export const useSyncPlaidConnection = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return request(SYNC_PLAID_CONNECTION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidAccounts'] });
    },
  });
};

export const useDeletePlaidConnection = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return request(DELETE_PLAID_CONNECTION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidConnections'] });
    },
  });
};

export const usePlaidConnections = (userId: string | null, enabled: boolean = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['plaidConnections', userId],
    queryFn: async () => {
      if (!userId) return null;
      const resp = await request(PLAID_CONNECTIONS, { userId });
      return resp.plaidConnections;
    },
    enabled: enabled && !!userId,
  });
};

export const usePlaidAccounts = (connectionId: string | null, enabled: boolean = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['plaidAccounts', connectionId],
    queryFn: async () => {
      if (!connectionId) return null;
      const resp = await request(PLAID_ACCOUNTS, { connectionId });
      return resp.plaidAccounts;
    },
    enabled: enabled && !!connectionId,
  });
};
