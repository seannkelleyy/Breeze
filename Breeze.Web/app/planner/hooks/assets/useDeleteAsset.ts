import { useCallback } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import useAssetsApi from './useAssetsApi';

interface UseDeleteAssetProps {
  userId?: string;
}

const useDeleteAsset = ({ userId }: UseDeleteAssetProps) => {
  const { deleteAsset } = useAssetsApi();
  const queryClient = useQueryClient();

  const mutationFn = useCallback((assetId: string) => deleteAsset(assetId), [deleteAsset]);

  return useMutation<boolean, Error, string>({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-assets', userId] });
    },
  });
};

export default useDeleteAsset;
