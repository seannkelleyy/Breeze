import { useCallback } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiAsset, UpdateApiAssetInput } from '../../types/apiAsset';
import useAssetsApi from './useAssetsApi';

interface UseUpdateAssetProps {
  userId?: string;
}

const useUpdateAsset = ({ userId }: UseUpdateAssetProps) => {
  const { updateAsset } = useAssetsApi();
  const queryClient = useQueryClient();

  const mutationFn = useCallback((input: UpdateApiAssetInput) => updateAsset(input), [updateAsset]);

  return useMutation<ApiAsset, Error, UpdateApiAssetInput>({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-assets', userId] });
    },
  });
};

export default useUpdateAsset;
