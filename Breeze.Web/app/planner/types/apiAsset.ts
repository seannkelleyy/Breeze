export type ApiAssetType =
  | 'CASH'
  | 'INVESTMENT'
  | 'RETIREMENT'
  | 'REAL_ESTATE'
  | 'VEHICLE'
  | 'OTHER';

export interface ApiUser {
  id: string;
  identityProviderId: string;
  email: string;
}

export interface ApiAsset {
  id: string;
  userId: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
  lastValueUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiAssetInput {
  userId: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
}

export interface UpdateApiAssetInput {
  id: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
}
