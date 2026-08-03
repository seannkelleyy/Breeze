export type AccountType =
  | '401k'
  | 'roth-ira'
  | 'traditional-ira'
  | 'hsa'
  | 'brokerage'
  | '403b'
  | '457'
  | 'home'
  | 'vehicle'
  | 'checking'
  | 'emergency-fund'
  | 'student-loan'
  | 'credit-card'
  | 'personal-loan'
  | 'auto-loan'
  | 'mortgage'
  | 'other';

export type LiabilityType =
  | 'student-loan'
  | 'credit-card'
  | 'personal-loan'
  | 'auto-loan'
  | 'mortgage';

export type ContributionMode = 'monthly' | 'yearly' | 'salary-percent';
export type AccountRateProfile =
  | 'none'
  | 'money-market'
  | 'bonds'
  | 'stock-bond-mix'
  | 'stocks'
  | 'custom';

export type PlannerAccount = {
  id: string;
  name: string;
  personIds: string[];
  accountType: AccountType;
  contributionMode: ContributionMode;
  contributionValue: number;
  employerMatchRate: number;
  employerMatchMaxPercentOfSalary: number;
  startingBalance: number;
  annualRate: number;
  returnProfile: AccountRateProfile | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  homeGrowthProfile: string | null;
  vehicleDepreciationProfile: string | null;
  linkedLiabilityId: string | null;
  plaidAccountId: string | null;
  originalLoanAmount?: number | null;
};

export interface PlannerAccountDto {
  name: string;
  personIds: string[];
  accountType: string;
  contributionMode: 'monthly' | 'yearly' | 'salary-percent';
  contributionValue: number;
  employerMatchRate: number;
  employerMatchMaxPercentOfSalary: number;
  startingBalance: number;
  annualRate: number;
  returnProfile: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  currentValue?: number | null;
  annualChangeRate?: number | null;
  homeGrowthProfile?: string | null;
  vehicleDepreciationProfile?: string | null;
  linkedLiabilityId?: string | null;
  originalLoanAmount?: number | null;
}
