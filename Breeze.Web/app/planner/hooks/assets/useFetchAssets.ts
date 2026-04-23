import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';

import useAssetsApi from './useAssetsApi';
import { ApiAsset } from '../../types/apiAsset';

interface UseFetchAssetsProps {
  userId?: string;
  enabled?: boolean;
}

const useFetchAssets = ({ userId, enabled }: UseFetchAssetsProps) => {
  const { getAssets } = useAssetsApi();

  const queryFn = useCallback(() => {
    if (!enabled || !userId) {
      return [] as ApiAsset[];
    }
    return getAssets(userId);
  }, [enabled, getAssets, userId]);

  return useQuery<ApiAsset[], Error>({
    queryKey: ['api-assets', userId],
    queryFn,
    enabled: Boolean(enabled && userId),
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 180 * 1000,
  });
};

export default useFetchAssets;
