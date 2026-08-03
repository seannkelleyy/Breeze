'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LINK_ASSET_TO_PLAID_ACCOUNT,
  UNLINK_ASSET_FROM_PLAID_ACCOUNT,
  LINK_LIABILITY_TO_PLAID_ACCOUNT,
  UNLINK_LIABILITY_FROM_PLAID_ACCOUNT,
} from '../queries/assets';
import useGraphql from '../useGraphql';

export const useLinkAssetToPlaidAccount = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      plaidAccountId,
    }: {
      assetId: string;
      plaidAccountId: string;
    }) => {
      return request<boolean>(LINK_ASSET_TO_PLAID_ACCOUNT, {
        assetId,
        plaidAccountId,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
};

export const useUnlinkAssetFromPlaidAccount = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      return request<boolean>(UNLINK_ASSET_FROM_PLAID_ACCOUNT, {
        assetId,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
};

export const useLinkLiabilityToPlaidAccount = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      liabilityId,
      plaidAccountId,
    }: {
      liabilityId: string;
      plaidAccountId: string;
    }) => {
      return request<boolean>(LINK_LIABILITY_TO_PLAID_ACCOUNT, {
        liabilityId,
        plaidAccountId,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
};

export const useUnlinkLiabilityFromPlaidAccount = () => {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (liabilityId: string) => {
      return request<boolean>(UNLINK_LIABILITY_FROM_PLAID_ACCOUNT, {
        liabilityId,
      } as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
};
