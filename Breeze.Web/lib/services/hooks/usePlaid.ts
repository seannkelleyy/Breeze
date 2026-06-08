'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EXCHANGE_PLAID_PUBLIC_TOKEN,
  PLAID_ACCOUNTS,
  PLAID_CONNECTIONS,
  SYNC_PLAID_CONNECTION,
} from '../queries/plaid';
import useGraphql from '../useGraphql';

export interface PlaidConnection {
  id: string;
  userId: string;
  environment: string;
  itemId: string;
  institutionId: string;
  institutionName: string;
  updatedAt: string;
  createdAt: string;
}

export interface PlaidAccount {
  id: string;
  plaidConnectionId: string;
  externalId: string;
  name: string;
  officialName: string;
  type: string;
  subtype: string;
  currentBalance: string;
  isoCurrencyCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaidSyncResponse {
  connectionId: string;
  syncedAt: string;
  accounts: PlaidAccount[];
}

export const useExchangePlaidToken = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, publicToken }: { userId: string; publicToken: string }) => {
      return request<PlaidConnection>(EXCHANGE_PLAID_PUBLIC_TOKEN, {
        userId,
        publicToken,
      } as unknown as Record<string, unknown>);
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
      return request<boolean>(SYNC_PLAID_CONNECTION, { id } as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidAccounts'] });
    },
  });
};

export const usePlaidConnections = (userId: string | null, enabled: boolean = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['plaidConnections', userId],
    queryFn: async () => {
      if (!userId) return null;
      return request<PlaidConnection[]>(PLAID_CONNECTIONS, { userId } as unknown as Record<
        string,
        unknown
      >);
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
      return request<PlaidAccount[]>(PLAID_ACCOUNTS, { connectionId } as unknown as Record<
        string,
        unknown
      >);
    },
    enabled: enabled && !!connectionId,
  });
};
