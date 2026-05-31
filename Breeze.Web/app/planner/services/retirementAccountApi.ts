import { PlannerApi } from './plannerApi';

export const createRetirementAccountApi = (api: PlannerApi) => ({
  list: (userId: string) => api.getAssets(userId),
  create: (input: any) => api.createAsset(input),
  update: (input: any) => api.updateAsset(input),
});

export type RetirementAccountApi = ReturnType<typeof createRetirementAccountApi>;
