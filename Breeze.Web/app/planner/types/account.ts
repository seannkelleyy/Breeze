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

export type LiabilityType = 'student-loan' | 'credit-card' | 'personal-loan' | 'auto-loan' | 'mortgage';

export type AccountOwner = 'self' | 'spouse';
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
  owner: AccountOwner;
  accountType: AccountType;
  contributionMode: ContributionMode;
  contributionValue: number;
  employerMatchRate: number;
  employerMatchMaxPercentOfSalary: number;
  startingBalance: number;
  annualRate: number;
};

export interface PlannerAccountDto {
  name: string;
  owner: 'self' | 'spouse';
  accountType: string;
  contributionMode: 'monthly' | 'yearly' | 'salary-percent';
  contributionValue: number;
  employerMatchRate: number;
  employerMatchMaxPercentOfSalary: number;
  startingBalance: number;
  annualRate: number;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  currentValue?: number | null;
  annualChangeRate?: number | null;
  homeGrowthProfile?: string | null;
  vehicleDepreciationProfile?: string | null;
  hasLoan: boolean;
  loanInterestRate?: number | null;
  originalLoanAmount?: number | null;
  loanMonthlyPayment?: number | null;
  loanTermYears?: number | null;
  loanStartDate?: string | null;
  currentLoanBalance?: number | null;
}
