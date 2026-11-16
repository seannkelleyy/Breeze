'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LINK_ASSET_TO_PLAID_ACCOUNT,
  UNLINK_ASSET_FROM_PLAID_ACCOUNT,
  LINK_LIABILITY_TO_PLAID_ACCOUNT,
  UNLINK_LIABILITY_FROM_PLAID_ACCOUNT,
} from '../../assets/asset.operations';
import useGraphql from '../../../lib/services/useGraphql';

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
      return request(LINK_ASSET_TO_PLAID_ACCOUNT, { assetId, plaidAccountId });
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
      return request(UNLINK_ASSET_FROM_PLAID_ACCOUNT, { assetId });
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
      return request(LINK_LIABILITY_TO_PLAID_ACCOUNT, { liabilityId, plaidAccountId });
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
      return request(UNLINK_LIABILITY_FROM_PLAID_ACCOUNT, { liabilityId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
};
