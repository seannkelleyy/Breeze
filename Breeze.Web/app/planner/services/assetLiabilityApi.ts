import { PlannerApi } from './plannerApi';

export const createAssetLiabilityApi = (api: PlannerApi) => ({
  assets: {
    list: (userId: string) => api.getAssets(userId),
    create: (input: any) => api.createAsset(input),
    update: (input: any) => api.updateAsset(input),
  },
  liabilities: {
    list: (userId: string) => api.getLiabilities(userId),
    create: (input: any) => api.createLiability(input),
    update: (input: any) => api.updateLiability(input),
  },
});

export type AssetLiabilityApi = ReturnType<typeof createAssetLiabilityApi>;
