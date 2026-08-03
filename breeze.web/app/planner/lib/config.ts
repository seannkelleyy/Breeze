import { AccountRateProfile, AccountType, ContributionMode, LiabilityType } from '../types/account';
import { HomeGrowthProfile, VehicleDepreciationProfile } from '../types/finance';
import {
  PLANNER_ACCOUNT_RATE_PROFILE_OPTIONS,
  PLANNER_HOME_GROWTH_PROFILE_OPTIONS,
  PLANNER_VEHICLE_DEPRECIATION_PROFILE_OPTIONS,
} from './constants';

export const accountTypeOptions: ReadonlyArray<{
  value: AccountType;
  label: string;
}> = [
  { value: '401k', label: '401(k)' },
  { value: 'roth-ira', label: 'Roth IRA' },
  { value: 'traditional-ira', label: 'Traditional IRA' },
  { value: 'hsa', label: 'HSA' },
  { value: '403b', label: '403(b)' },
  { value: '457', label: '457' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'home', label: 'Home / Real Estate' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'checking', label: 'Checking Account' },
  { value: 'emergency-fund', label: 'Emergency Fund' },
  { value: 'student-loan', label: 'Student Loan' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'personal-loan', label: 'Personal Loan' },
  { value: 'auto-loan', label: 'Auto Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'other', label: 'Other' },
];

export const contributionModeOptions: ReadonlyArray<{
  value: ContributionMode;
  label: string;
}> = [
  { value: 'monthly', label: 'Monthly Amount' },
  { value: 'yearly', label: 'Yearly Amount' },
  { value: 'salary-percent', label: '% of Salary' },
];

export const liabilityContributionModeOptions: ReadonlyArray<{
  value: ContributionMode;
  label: string;
}> = [
  { value: 'monthly', label: 'Monthly Payment' },
  { value: 'yearly', label: 'Yearly Payment' },
  { value: 'salary-percent', label: 'Payment % of Salary' },
];

export const liabilityTypeOptions: ReadonlyArray<{
  value: LiabilityType;
  label: string;
}> = [
  { value: 'student-loan', label: 'Student Loan' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'personal-loan', label: 'Personal Loan' },
  { value: 'auto-loan', label: 'Auto Loan' },
  { value: 'mortgage', label: 'Mortgage' },
];

export const homeGrowthProfileOptions: ReadonlyArray<{
  value: HomeGrowthProfile;
  label: string;
}> = PLANNER_HOME_GROWTH_PROFILE_OPTIONS.map((option) => ({ ...option }));

export const vehicleDepreciationProfileOptions: ReadonlyArray<{
  value: VehicleDepreciationProfile;
  label: string;
}> = PLANNER_VEHICLE_DEPRECIATION_PROFILE_OPTIONS.map((option) => ({
  ...option,
}));

export const accountRateProfileOptions: ReadonlyArray<{
  value: AccountRateProfile;
  label: string;
}> = PLANNER_ACCOUNT_RATE_PROFILE_OPTIONS.map((option) => ({ ...option }));

const liabilityAccountTypes = new Set<AccountType>([
  'student-loan',
  'credit-card',
  'personal-loan',
  'auto-loan',
  'mortgage',
]);
const nonContributingAssetAccountTypes = new Set<AccountType>(['home', 'vehicle']);
const depreciatingAssetAccountTypes = new Set<AccountType>(['vehicle']);

export const accountTypesWithoutIrsLimits = new Set<AccountType>([
  'brokerage',
  'home',
  'vehicle',
  'checking',
  'emergency-fund',
  'student-loan',
  'credit-card',
  'personal-loan',
  'auto-loan',
  'mortgage',
  'other',
]);

export const isLiabilityAccountType = (accountType: AccountType) =>
  liabilityAccountTypes.has(accountType);
export const isNonContributingAccountType = (accountType: AccountType) =>
  nonContributingAssetAccountTypes.has(accountType);
export const isDepreciatingAssetType = (accountType: AccountType) =>
  depreciatingAssetAccountTypes.has(accountType);
export const isCombinedAssetType = (accountType: AccountType) =>
  accountType === 'home' || accountType === 'vehicle';
