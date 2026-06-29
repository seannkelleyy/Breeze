'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useGraphql from '@/lib/services/useGraphql';
import {
  GET_ASSETS,
  CREATE_ASSET,
  UPDATE_ASSET,
  DELETE_ASSET,
  GET_LIABILITIES,
  CREATE_LIABILITY,
  UPDATE_LIABILITY,
  DELETE_LIABILITY,
} from '@/lib/services/queries/assets';

export interface AssetData {
  id: string;
  userId: string;
  name: string;
  assetType: 'CASH' | 'INVESTMENT' | 'REAL_ESTATE' | 'VEHICLE' | 'RETIREMENT' | 'OTHER';
  currentValue: string;
  lastValueUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiabilityData {
  id: string;
  userId: string;
  name: string;
  liabilityType:
    | 'CREDIT_CARD'
    | 'MORTGAGE'
    | 'AUTO_LOAN'
    | 'STUDENT_LOAN'
    | 'PERSONAL_LOAN'
    | 'OTHER';
  currentBalance: string;
  interestRate: string;
  minimumPayment: string;
  targetExtraPayment: string;
  payoffPriority: number;
  lastBalanceUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// GraphQL Response Types
interface GetAssetsPayload {
  assets: AssetData[];
}

interface CreateAssetPayload {
  createAsset: AssetData;
}

interface UpdateAssetPayload {
  updateAsset: AssetData;
}

interface DeleteAssetPayload {
  deleteAsset: boolean;
}

interface GetLiabilitiesPayload {
  liabilities: LiabilityData[];
}

interface CreateLiabilityPayload {
  createLiability: LiabilityData;
}

interface UpdateLiabilityPayload {
  updateLiability: LiabilityData;
}

interface DeleteLiabilityPayload {
  deleteLiability: boolean;
}

interface QueryVariables {
  userId: string;
}

interface CreateAssetInput {
  input: Omit<AssetData, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { userId: string };
}

interface UpdateAssetInput {
  input: Partial<AssetData> & { id: string };
}

interface DeleteInput {
  id: string;
}

interface CreateLiabilityInput {
  input: Omit<LiabilityData, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { userId: string };
}

interface UpdateLiabilityInput {
  input: Partial<LiabilityData> & { id: string };
}

export function useAssetsLiabilities(userId: string | null) {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  // Query: Get all assets
  const assetsQuery = useQuery({
    queryKey: ['assets', userId],
    queryFn: async () => {
      const result = await request<GetAssetsPayload, QueryVariables>(GET_ASSETS, {
        userId: userId || '',
      });
      return result.assets as AssetData[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Query: Get all liabilities
  const liabilitiesQuery = useQuery({
    queryKey: ['liabilities', userId],
    queryFn: async () => {
      const result = await request<GetLiabilitiesPayload, QueryVariables>(GET_LIABILITIES, {
        userId: userId || '',
      });
      return result.liabilities as LiabilityData[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Asset Mutations
  const createAssetMutation = useMutation({
    mutationFn: async (input: Omit<AssetData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const result = await request<CreateAssetPayload, CreateAssetInput>(CREATE_ASSET, {
        input: { ...input, userId: userId || '' },
      });
      return result.createAsset as AssetData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async (input: Partial<AssetData> & { id: string }) => {
      const result = await request<UpdateAssetPayload, UpdateAssetInput>(UPDATE_ASSET, { input });
      return result.updateAsset as AssetData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      await request<DeleteAssetPayload, DeleteInput>(DELETE_ASSET, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] });
    },
  });

  // Liability Mutations
  const createLiabilityMutation = useMutation({
    mutationFn: async (input: Omit<LiabilityData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const result = await request<CreateLiabilityPayload, CreateLiabilityInput>(CREATE_LIABILITY, {
        input: { ...input, userId: userId || '' },
      });
      return result.createLiability as LiabilityData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities', userId] });
    },
  });

  const updateLiabilityMutation = useMutation({
    mutationFn: async (input: Partial<LiabilityData> & { id: string }) => {
      const result = await request<UpdateLiabilityPayload, UpdateLiabilityInput>(UPDATE_LIABILITY, {
        input,
      });
      return result.updateLiability as LiabilityData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities', userId] });
    },
  });

  const deleteLiabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      await request<DeleteLiabilityPayload, DeleteInput>(DELETE_LIABILITY, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities', userId] });
    },
  });

  return {
    // Assets
    assets: assetsQuery.data || [],
    assetsLoading: assetsQuery.isLoading,
    assetsError: assetsQuery.error,
    createAsset: createAssetMutation.mutate,
    updateAsset: updateAssetMutation.mutate,
    deleteAsset: deleteAssetMutation.mutate,
    isAssetPending:
      createAssetMutation.isPending ||
      updateAssetMutation.isPending ||
      deleteAssetMutation.isPending,

    // Liabilities
    liabilities: liabilitiesQuery.data || [],
    liabilitiesLoading: liabilitiesQuery.isLoading,
    liabilitiesError: liabilitiesQuery.error,
    createLiability: createLiabilityMutation.mutate,
    updateLiability: updateLiabilityMutation.mutate,
    deleteLiability: deleteLiabilityMutation.mutate,
    isLiabilityPending:
      createLiabilityMutation.isPending ||
      updateLiabilityMutation.isPending ||
      deleteLiabilityMutation.isPending,

    // Combined
    isLoading: assetsQuery.isLoading || liabilitiesQuery.isLoading,
    isError: assetsQuery.isError || liabilitiesQuery.isError,
  };
}

export default useAssetsLiabilities;
