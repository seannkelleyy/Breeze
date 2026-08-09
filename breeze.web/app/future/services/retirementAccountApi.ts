import { PlannerApi } from './plannerApi';
import type { CreateApiAssetInput, UpdateApiAssetInput } from '@/app/future/types/apiAsset';

export const createRetirementAccountApi = (api: PlannerApi) => ({
  list: (userId: string) => api.getAssets(userId),
  create: (input: CreateApiAssetInput) => api.createAsset(input),
  update: (input: UpdateApiAssetInput) => api.updateAsset(input),
});

export type RetirementAccountApi = ReturnType<typeof createRetirementAccountApi>;
