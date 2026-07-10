export type ApiAssetType =
  | 'CHECKING'
  | 'EMERGENCY_FUND'
  | 'BROKERAGE'
  | '_401K'
  | '_403B'
  | '_457'
  | 'ROTH_IRA'
  | 'TRADITIONAL_IRA'
  | 'HSA'
  | 'HOME'
  | 'VEHICLE'
  | 'OTHER';

export type ApiLiabilityType =
  | 'MORTGAGE'
  | 'CREDIT_CARD'
  | 'STUDENT_LOAN'
  | 'AUTO_LOAN'
  | 'PERSONAL_LOAN'
  | 'OTHER';

export interface ApiUser {
  id: string;
  identityProviderId: string;
  email: string;
}

/**
 * Wire type for the GraphQL Asset object.
 * All monetary fields are strings per the API contract (never Float).
 */
export interface ApiAsset {
  id: string;
  userId: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
  owner: string;
  contributionMode: string;
  contributionValue: string;
  employerMatchRate: string;
  employerMatchMaxPercentOfSalary: string;
  annualRate: string;
  returnProfile: string | null;
  lastValueUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiAssetInput {
  userId: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
  owner: string;
  contributionMode: string;
  contributionValue: string;
  employerMatchRate: string;
  employerMatchMaxPercentOfSalary: string;
  annualRate: string;
  returnProfile?: string | null;
}

export interface UpdateApiAssetInput {
  id: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
  owner: string;
  contributionMode: string;
  contributionValue: string;
  employerMatchRate: string;
  employerMatchMaxPercentOfSalary: string;
  annualRate: string;
  returnProfile?: string | null;
}

/**
 * Wire type for the GraphQL Liability object.
 */
export interface ApiLiability {
  id: string;
  userId: string;
  name: string;
  liabilityType: ApiLiabilityType;
  currentBalance: string;
  interestRate: string;
  minimumPayment: string;
  targetExtraPayment: string;
  payoffPriority: number;
  owner: string;
  contributionMode: string;
  contributionValue: string;
  lastBalanceUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}
