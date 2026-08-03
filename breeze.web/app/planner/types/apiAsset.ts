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

export interface ApiAsset {
  id: string;
  userId: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
  contributionMode: string;
  contributionValue: string;
  employerMatchRate: string;
  employerMatchMaxPercentOfSalary: string;
  annualRate: string;
  returnProfile: string | null;
  personIds: string[];
  purchaseDate: string | null;
  purchasePrice: string | null;
  homeGrowthProfile: string | null;
  vehicleDepreciationProfile: string | null;
  linkedLiabilityId: string | null;
  lastValueUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiAssetInput {
  userId: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
  contributionMode: string;
  contributionValue: string;
  employerMatchRate: string;
  employerMatchMaxPercentOfSalary: string;
  annualRate: string;
  returnProfile?: string | null;
  personIds?: string[];
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  homeGrowthProfile?: string | null;
  vehicleDepreciationProfile?: string | null;
  linkedLiabilityId?: string | null;
}

export interface UpdateApiAssetInput {
  id: string;
  name: string;
  assetType: ApiAssetType;
  currentValue: string;
  contributionMode: string;
  contributionValue: string;
  employerMatchRate: string;
  employerMatchMaxPercentOfSalary: string;
  annualRate: string;
  returnProfile?: string | null;
  personIds?: string[];
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  homeGrowthProfile?: string | null;
  vehicleDepreciationProfile?: string | null;
  linkedLiabilityId?: string | null;
}

export interface ApiLiability {
  id: string;
  userId: string;
  name: string;
  liabilityType: ApiLiabilityType;
  currentBalance: string;
  originalLoanAmount: string | null;
  interestRate: string;
  minimumPayment: string;
  targetExtraPayment: string;
  payoffPriority: number;
  contributionMode: string;
  contributionValue: string;
  personIds: string[];
  lastBalanceUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}
