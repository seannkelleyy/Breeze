import type { CreateApiAssetInput, UpdateApiAssetInput } from '@/app/planner/types/apiAsset';
import { PlannerApi } from './plannerApi';

export const createAssetLiabilityApi = (api: PlannerApi) => ({
  assets: {
    list: (userId: string) => api.getAssets(userId),
    create: (input: CreateApiAssetInput) => api.createAsset(input),
    update: (input: UpdateApiAssetInput) => api.updateAsset(input),
  },
  liabilities: {
    list: (userId: string) => api.getLiabilities(userId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (input: any) => api.createLiability(input),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (input: any) => api.updateLiability(input),
  },
});

export type AssetLiabilityApi = ReturnType<typeof createAssetLiabilityApi>;
