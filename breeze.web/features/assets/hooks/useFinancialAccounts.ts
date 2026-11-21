'use client';

import { useQuery } from '@tanstack/react-query';

import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/features/assets/asset.operations';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';

export const financialAccountQueryKeys = {
  assets: (userId: string | null) => ['assets', userId] as const,
  liabilities: (userId: string | null) => ['liabilities', userId] as const,
};

export function useAssets() {
  const { userId } = useCurrentUser();
  const { request } = useGraphql();

  return useQuery({
    queryKey: financialAccountQueryKeys.assets(userId),
    queryFn: async () => {
      const response = await request(GET_ASSETS_BY_USER);
      return response.assets ?? [];
    },
    enabled: Boolean(userId),
  });
}

export function useLiabilities() {
  const { userId } = useCurrentUser();
  const { request } = useGraphql();

  return useQuery({
    queryKey: financialAccountQueryKeys.liabilities(userId),
    queryFn: async () => {
      const response = await request(GET_LIABILITIES_BY_USER);
      return response.liabilities ?? [];
    },
    enabled: Boolean(userId),
  });
}
