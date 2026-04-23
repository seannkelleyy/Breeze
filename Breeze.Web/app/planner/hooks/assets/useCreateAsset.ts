import { useCallback } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiAsset, CreateApiAssetInput } from '../../types/apiAsset';
import useAssetsApi from './useAssetsApi';

interface UseCreateAssetProps {
  userId?: string;
}

const useCreateAsset = ({ userId }: UseCreateAssetProps) => {
  const { createAsset } = useAssetsApi();
  const queryClient = useQueryClient();

  const mutationFn = useCallback((input: CreateApiAssetInput) => createAsset(input), [createAsset]);

  return useMutation<ApiAsset, Error, CreateApiAssetInput>({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-assets', userId] });
    },
  });
};

export default useCreateAsset;
