export const IRS_MAX_CONTRIBUTION_MATCH_TOLERANCE = 1;

export const isMoneyEqualWithinTolerance = (
  leftAmount: number,
  rightAmount: number,
  tolerance = IRS_MAX_CONTRIBUTION_MATCH_TOLERANCE,
) => Math.abs(leftAmount - rightAmount) <= tolerance;

export const isMoneyGreaterThanWithTolerance = (
  leftAmount: number,
  rightAmount: number,
  tolerance = IRS_MAX_CONTRIBUTION_MATCH_TOLERANCE,
) => leftAmount - rightAmount > tolerance;

export const isMoneyGreaterThanOrEqualWithTolerance = (
  leftAmount: number,
  rightAmount: number,
  tolerance = IRS_MAX_CONTRIBUTION_MATCH_TOLERANCE,
) => leftAmount - rightAmount >= -tolerance;

export const PLANNER_SAFE_WITHDRAWAL_RATE_MIN = 0.1;
export const PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE = 4;
export const PLANNER_DEFAULT_LONGEVITY_AGE = 95;
export const PLANNER_AUTOSAVE_DEBOUNCE_MS = 1200;

export const PLANNER_SAFE_WITHDRAWAL_RATE_SUGGESTIONS = [
  { minimumRetirementYears: 40, rate: 3.25 },
  { minimumRetirementYears: 30, rate: 3.5 },
  { minimumRetirementYears: 20, rate: 4.0 },
  { minimumRetirementYears: 0, rate: 4.5 },
] as const;

export const PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT = 1_500_000;
export const PLANNER_DEFAULT_MONTHLY_EXPENSES = 4000;
export const PLANNER_DEFAULT_INFLATION_RATE = 2.5;
export const PLANNER_DEFAULT_ANNUAL_BONUS = 0;
export const PLANNER_DEFAULT_BONUS_MODE = 'dollars';
export const PLANNER_BONUS_MODE_OPTIONS = [
  { value: 'dollars', label: 'Net Dollars (After Tax)' },
  { value: 'salary-percent', label: '% of Salary' },
] as const;
export const PLANNER_DEFAULT_INCOME_GROWTH_RATE = 0;
export const PLANNER_DEFAULT_IRS_LIMIT_GROWTH_RATE = 2.5;
export const PLANNER_RETIREMENT_METHOD_OPTIONS = [
  { value: 'target-amount', label: 'Custom Target' },
  { value: 'fire', label: 'FIRE Method' },
  { value: 'income-replacement', label: 'Income Replacement' },
] as const;
export const PLANNER_DEFAULT_RETIREMENT_METHOD = 'target-amount';
export const PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE = 80;
export const PLANNER_DEFAULT_NET_INCOME_FACTOR = 0.8;
export const PLANNER_DEFAULT_ANNUAL_EXTRA_EXPENSE_BUFFER = 15000;
export const PLANNER_ANNUAL_EXTRA_EXPENSE_BUFFER_PERCENT = 10;
export const PLANNER_DEFAULT_FIRE_PROJECTION_RATE = 7;
export const PLANNER_DEFAULT_USE_INFLATION_ADJUSTED_VALUES = true;
export const PLANNER_DEFAULT_RETURN_DISPLAY_MODE = 'real';
export const PLANNER_RETURN_DISPLAY_MODE_OPTIONS = [
  { value: 'real', label: 'Real (Inflation-Adjusted)' },
  { value: 'nominal', label: 'Nominal (Future Dollars)' },
] as const;

export const PLANNER_ACCOUNT_RATE_PROFILE_OPTIONS = [
  { value: 'none', label: 'None (0.0%)' },
  { value: 'money-market', label: 'Money Market (3.0%)' },
  { value: 'bonds', label: 'Bonds (4.0%)' },
  { value: 'stock-bond-mix', label: 'Stocks/Bonds (7.0%)' },
  { value: 'stocks', label: 'Stocks (10.0%)' },
  { value: 'custom', label: 'Custom %' },
] as const;

export const PLANNER_ACCOUNT_RATE_PROFILE_RATES = {
  none: 0,
  'money-market': 3,
  bonds: 4,
  'stock-bond-mix': 7,
  stocks: 10,
} as const;

export const PLANNER_FIRE_LIFESTYLE_OPTIONS = [
  { label: 'Bare Minimum', multiplier: 0.8 },
  { label: 'Lean FIRE', multiplier: 0.9 },
  { label: 'Standard FIRE', multiplier: 1.0 },
  { label: 'Comfortable', multiplier: 1.2 },
  { label: 'Fat FIRE', multiplier: 1.5 },
] as const;

export const PLANNER_FINANCIAL_MATH_SCENARIOS = [
  { label: 'Minimum', spendMultiplier: 1 },
  { label: 'High Quality', spendMultiplier: 2 },
  { label: 'Luxury', spendMultiplier: 3 },
] as const;

export const PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX = 2;

export const PLANNER_DEFAULT_SELF_PERSON = {
  type: 'self',
  name: 'Self',
  birthday: '1990-01-01',
  retirementAge: 60,
  annualSalary: 120000,
  bonusMode: PLANNER_DEFAULT_BONUS_MODE,
  annualBonus: PLANNER_DEFAULT_ANNUAL_BONUS,
  incomeGrowthRate: PLANNER_DEFAULT_INCOME_GROWTH_RATE,
} as const;

export const PLANNER_DEFAULT_SPOUSE_PERSON = {
  type: 'spouse',
  name: 'Spouse',
  birthday: '1990-01-01',
  retirementAge: 60,
  annualSalary: 0,
  bonusMode: PLANNER_DEFAULT_BONUS_MODE,
  annualBonus: PLANNER_DEFAULT_ANNUAL_BONUS,
  incomeGrowthRate: PLANNER_DEFAULT_INCOME_GROWTH_RATE,
} as const;

export const PLANNER_DEFAULT_NEW_ACCOUNT = {
  owner: 'self',
  accountType: 'other',
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 0,
  returnProfile: null,
} as const;

export const PLANNER_DEFAULT_COLLAPSED_SECTIONS = {
  people: false,
  retirementInputs: false,
  plannerTools: false,
  accounts: false,
  requiredMonthly: false,
  plannedMonthly: false,
  retirementEstimateCard: false,
  projectionChart: false,
  yearlyProjection: false,
  accountBreakdown: false,
} as const;

export const PLANNER_DEFAULT_IRS_LIMITS = {
  '401k': { baseAnnualLimit: 24500, catchUpAmount: 8000, catchUpAge: 50 },
  '403b': { baseAnnualLimit: 24500, catchUpAmount: 8000, catchUpAge: 50 },
  '457': { baseAnnualLimit: 24500, catchUpAmount: 8000, catchUpAge: 50 },
  'roth-ira': { baseAnnualLimit: 7500, catchUpAmount: 1100, catchUpAge: 50 },
  'traditional-ira': {
    baseAnnualLimit: 7500,
    catchUpAmount: 1100,
    catchUpAge: 50,
  },
  hsa: {
    baseAnnualLimit: 4400,
    familyAnnualLimit: 8750,
    catchUpAmount: 1000,
    catchUpAge: 55,
  },
} as const;

export const PLANNER_HOME_GROWTH_PROFILE_OPTIONS = [
  { value: 'none', label: 'None (0.0%)' },
  { value: 'low', label: 'Low (2.5%)' },
  { value: 'medium', label: 'Medium (4.0%)' },
  { value: 'high', label: 'High (6.0%)' },
  { value: 'custom', label: 'Custom %' },
] as const;

export const PLANNER_HOME_GROWTH_PROFILE_RATES = {
  none: 0,
  low: 2.5,
  medium: 4,
  high: 6,
} as const;

export const PLANNER_DEFAULT_HOME_GROWTH_PROFILE = 'medium';
export const PLANNER_DEFAULT_HOME_APPRECIATION_RATE = 4;

export const PLANNER_VEHICLE_DEPRECIATION_PROFILE_OPTIONS = [
  { value: 'low', label: 'Low (Toyota/Honda style)' },
  { value: 'medium', label: 'Medium (Ford/Chevy style)' },
  { value: 'high', label: 'High (Luxury style)' },
  { value: 'custom', label: 'Custom %' },
] as const;

export const PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES = {
  low: 11,
  medium: 16,
  high: 22,
} as const;

export const PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS = {
  low: 4,
  medium: 6,
  high: 9,
} as const;

export const PLANNER_DEFAULT_VEHICLE_DEPRECIATION_PROFILE = 'medium';
export const PLANNER_DEFAULT_VEHICLE_DEPRECIATION_RATE = 10;
export const PLANNER_VEHICLE_DEPRECIATION_TAPER_STRENGTH = 0.55;

export const PLANNER_DEFAULT_ASSET_LOAN_INTEREST_RATE = 6;
export const PLANNER_DEFAULT_HOME_LOAN_TERM_YEARS = 30;
export const PLANNER_DEFAULT_VEHICLE_LOAN_TERM_YEARS = 5;
