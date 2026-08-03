'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EXCHANGE_PLAID_PUBLIC_TOKEN,
  PLAID_ACCOUNTS,
  PLAID_CONNECTIONS,
  SYNC_PLAID_CONNECTION,
  DELETE_PLAID_CONNECTION,
  CREATE_PLAID_LINK_TOKEN,
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

export const useCreateLinkToken = () => {
  const { request } = useGraphql();

  return useMutation({
    mutationFn: async (userId: string) => {
      const resp = await request<{ createPlaidLinkToken: string }>(CREATE_PLAID_LINK_TOKEN, {
        userId,
      } as unknown as Record<string, unknown>);
      return resp.createPlaidLinkToken;
    },
  });
};

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

export const useDeletePlaidConnection = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return request<boolean>(DELETE_PLAID_CONNECTION, { id } as unknown as Record<string, unknown>);
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
      const resp = await request<{ plaidConnections: PlaidConnection[] }>(
        PLAID_CONNECTIONS,
        { userId } as unknown as Record<string, unknown>,
      );
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
      const resp = await request<{ plaidAccounts: PlaidAccount[] }>(
        PLAID_ACCOUNTS,
        { connectionId } as unknown as Record<string, unknown>,
      );
      return resp.plaidAccounts;
    },
    enabled: enabled && !!connectionId,
  });
};
