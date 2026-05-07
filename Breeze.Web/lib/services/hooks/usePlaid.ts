'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    EXCHANGE_PLAID_TOKEN,
    GET_PLAID_ACCOUNTS,
    GET_PLAID_CONNECTIONS,
    SYNC_PLAID_ACCOUNTS,
} from '../queries/plaid'
import useGraphql from '../useGraphql'

export interface PlaidConnection {
  id: string;
  accessToken: string;
  institutionId: string;
  institutionName: string;
  createdAt: string;
}

export interface PlaidAccount {
  id: string;
  name: string;
  officialName: string;
  mask: string;
  type: string;
  subtype: string;
  balance: string;
  currency: string;
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
    mutationFn: async (publicToken: string) => {
      return request<PlaidConnection>(EXCHANGE_PLAID_TOKEN, { publicToken } as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidConnections'] });
    },
  });
};

export const useSyncPlaidAccounts = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      return request<PlaidSyncResponse>(SYNC_PLAID_ACCOUNTS, { connectionId } as unknown as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plaidAccounts', data.connectionId] });
    },
  });
};

export const usePlaidConnections = (enabled: boolean = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['plaidConnections'],
    queryFn: async () => {
      return request<PlaidConnection[]>(GET_PLAID_CONNECTIONS);
    },
    enabled,
  });
};

export const usePlaidAccounts = (connectionId: string | null, enabled: boolean = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['plaidAccounts', connectionId],
    queryFn: async () => {
      if (!connectionId) return null;
      return request<PlaidAccount[]>(GET_PLAID_ACCOUNTS, { connectionId } as unknown as Record<string, unknown>);
    },
    enabled: enabled && !!connectionId,
  });
};
