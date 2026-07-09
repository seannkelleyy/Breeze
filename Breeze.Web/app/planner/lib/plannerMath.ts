import type { ChartConfig } from '@/components/ui/chart';
import type { AccountRateProfile, AccountType, PlannerAccount } from '../types/account';
import type {
  AssetFinanceDetails,
  AssetFinanceSnapshot,
  FinancialMathSnapshot,
} from '../types/finance';
import type { IrsLimitConfig, IrsLimitKey } from '../types/irs';
import type { PlannerPerson } from '../types/person';
import type { ProjectionRow } from '../types/projection';
import * as plannerConstants from './constants';

export const plannerChartConfig = {
  totalBalance: { label: 'Total Portfolio', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;
export const accountLineColors = [
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1))',
];
export const clamp = (v: number, m = 0): number => (Number.isFinite(v) ? Math.max(m, v) : m);
export const normalizeBonusMode = (v: string | undefined): 'dollars' | 'salary-percent' =>
  v === 'salary-percent' || v === 'percent' ? 'salary-percent' : 'dollars';
export const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const formatCurrencyWithCode = (v: number, c: string): string => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(v);
  } catch {
    return `${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};
export const getHomeAnnualGrowthRate = (p: string | undefined, r?: number): number =>
  p === 'low' ? 0.02 : p === 'high' ? 0.06 : (r ?? 0.035);
export const getVehicleAnnualDepreciationRate = (
  p: string | undefined,
  y: number,
  c?: number,
): number => {
  if (p === 'low') return 0.08;
  if (p === 'moderate' || !p) {
    if (y < 3) return 0.2;
    if (y < 5) return 0.15;
    if (y < 8) return 0.1;
    return 0.08;
  }
  if (p === 'high') return 0.25;
  return c ?? 0.15;
};
export const getRealAnnualRatePercent = (n: number, i: number): number =>
  i >= 100 ? n : ((1 + n / 100) / (1 + i / 100) - 1) * 100;
export const getEffectiveAnnualRatePercent = (a: number, i: number, u: boolean): number =>
  u ? getRealAnnualRatePercent(a, i) : a;
export const getNominalAnnualRatePercentFromReal = (r: number, i: number): number =>
  i >= 100 ? r : (1 + r / 100) * (1 + i / 100) - 1;
export const getSuggestedSafeWithdrawalRate = (y: number): number =>
  y >= 60 ? 3.0 : y >= 50 ? 3.25 : y >= 40 ? 3.5 : y >= 30 ? 4.0 : 4.5;
export const getDisplayedRatePercent = (a: PlannerAccount, i: number, u: boolean): number =>
  u ? getRealAnnualRatePercent(a.annualRate, i) : a.annualRate;
export const getAccountAnnualRateFromProfile = (
  p: AccountRateProfile,
  c: number,
  i: number,
  u: boolean,
): number => {
  // Profile nominal rates must match PLANNER_ACCOUNT_RATE_PROFILE_RATES in constants.ts
  const R: Record<AccountRateProfile, number> = {
    none: 0,
    'money-market': 3,
    bonds: 4,
    'stock-bond-mix': 7,
    stocks: 10,
    custom: c,
  };
  const n = R[p] ?? c;
  // Profile rates (none, money-market, bonds, stock-bond-mix, stocks) are already nominal rates.
  // Only 'custom' receives a displayed rate (possibly real/inflation-adjusted) that needs conversion.
  return p === 'custom' && u ? getNominalAnnualRatePercentFromReal(n, i) : n;
};
export const getAccountRateProfileFromAnnualRate = (
  a: number,
  i: number,
  u: boolean,
): AccountRateProfile => {
  // Thresholds are midpoints between profile nominal rates: 0, 3, 4, 7, 10
  const adj = u ? getNominalAnnualRatePercentFromReal(a, i) : a;
  if (adj <= 1.5) return 'none';
  if (adj <= 3.5) return 'money-market';
  if (adj <= 5.5) return 'bonds';
  if (adj <= 8.5) return 'stock-bond-mix';
  if (adj <= 10 + 1e-6) return 'stocks';
  return 'custom';
};
export const getStoredAnnualRateFromInput = (
  _: PlannerAccount,
  v: number,
  i: number,
  u: boolean,
): number => (u ? getNominalAnnualRatePercentFromReal(v, i) : v);
export const getNetWorthStartingBalance = (a: PlannerAccount): number =>
  a.accountType === 'home' || a.accountType === 'vehicle' ? 0 : clamp(a.startingBalance);
export const getAssetFinanceSnapshot = (d: AssetFinanceDetails, _: Date): AssetFinanceSnapshot => ({
  assetValue: clamp(d.currentValue, 1),
  loanBalance: d.currentLoanBalance ?? 0,
  equity: clamp(d.currentValue, 1) - (d.currentLoanBalance ?? 0),
  monthsSincePurchase: 0,
  remainingLoanMonths: (d.loanTermYears ?? 0) * 12,
});
export const getTotalMonthlyForAccount = (
  a: PlannerAccount,
  selfIncome: number,
  spouseIncome: number,
): number =>
  getEmployeeMonthlyContribution(a, selfIncome, spouseIncome) +
  getEmployerMatchMonthly(a, selfIncome, spouseIncome);
export const getOwnerAnnualIncome = (o: 'self' | 'spouse', p: PlannerPerson[]): number =>
  p.find((x) => x.type === (o === 'self' ? 'self' : 'spouse'))?.annualSalary ?? 0;
export const getTotalAnnualIncome = (p: PlannerPerson | undefined): number =>
  p ? p.annualSalary + (p.bonusMode === 'dollars' ? p.annualBonus : 0) : 0;
export const getPlannerContributionTotals = (
  accounts: PlannerAccount[],
  selfAI: number,
  spouseAI: number,
) => {
  let te = 0,
    tm = 0,
    ti = 0;
  for (const a of accounts) {
    const e = getEmployeeMonthlyContribution(a, selfAI, spouseAI);
    const m = getEmployerMatchMonthly(a, selfAI, spouseAI);
    te += e;
    tm += m;
    ti += e + m;
  }
  return {
    totalPlannedMonthlyEmployee: te,
    totalPlannedMonthlyMatch: tm,
    totalPlannedMonthlyInvestment: ti,
  };
};
export const getPlannerHouseholdSnapshot = (people: PlannerPerson[]) => {
  const sp = people.find((p) => p.type === 'self');
  const s2 = people.find((p) => p.type === 'spouse');
  const bd = sp?.birthday ?? '';
  const si = sp?.annualSalary ?? 0;
  const si2 = s2?.annualSalary ?? 0;
  const hi = si + si2;
  const ca = getAgeFromBirthday(bd);
  return {
    selfPerson: sp,
    spousePerson: s2,
    hasSpouse: !!s2,
    selfBirthday: bd,
    selfAnnualIncome: si,
    spouseAnnualIncome: si2,
    householdIncome: hi,
    currentAge: ca,
    annualHouseholdIncome: hi,
  };
};
export const defaultIrsLimits: IrsLimitConfig = plannerConstants.PLANNER_DEFAULT_IRS_LIMITS;
export const getAgeFromBirthday = (birthday: string): number => {
  if (!birthday) return 30;
  const b = new Date(birthday);
  if (isNaN(b.getTime())) return 30;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return Math.max(a, 0);
};
export const getSuggestedAnnualLimit = (
  t: AccountType,
  age: number,
  limits: IrsLimitConfig,
  inclSpouse: boolean,
): number => {
  const key = getIrsLimitKeyFromApiType(t);
  if (!key) return 0;
  const rule = limits[key];
  if (!rule) return 0;
  let limit = rule.baseAnnualLimit;
  if (age >= rule.catchUpAge) limit += rule.catchUpAmount;
  return inclSpouse && rule.familyAnnualLimit ? rule.familyAnnualLimit : limit;
};
export const getIrsLimitKeyFromApiType = (type: string): IrsLimitKey | null => {
  if (type === '401k' || type === '403b' || type === '457') return '401k';
  if (type === 'roth-ira') return 'roth-ira';
  if (type === 'traditional-ira') return 'traditional-ira';
  if (type === 'hsa') return 'hsa';
  return null;
};
export const getFinancialMathSnapshot = (
  _input: Record<string, unknown>,
): FinancialMathSnapshot => ({
  monthlyExpenses: 0,
  annualSpend: 0,
  emergencyFund3Months: 0,
  emergencyFund6Months: 0,
  emergencyFund12Months: 0,
  selfSalary: 0,
  spouseSalary: 0,
  grossIncome: 0,
  netIncomeFactor: 0,
  netIncome: 0,
  annualExtraExpenseBuffer: 0,
  yearlySavings: 0,
  safeWithdrawalRatePercent: 0,
  withdrawalMultiplier: 0,
  currentPortfolio: 0,
  yearlyPortfolioIncome: 0,
  yearsToGoalRatePercent: 0,
  scenarios: [],
});
export const getProjection = (
  ..._args: unknown[]
): { projectionRows: ProjectionRow[]; finalBalances: number[]; contributedTotal: number } => ({
  projectionRows: [],
  finalBalances: [],
  contributedTotal: 0,
});
export const getDefaultAssetFinanceDetailsForAccount = (
  account: PlannerAccount,
): AssetFinanceDetails => {
  const isV = account.accountType === 'vehicle';
  const v = Math.max(clamp(account.startingBalance), 1);
  return {
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: v,
    currentValue: v,
    annualChangeRate: isV
      ? -Math.max(Math.abs(account.annualRate), 0.15)
      : account.annualRate || 0.035,
    homeGrowthProfile: 'none',
    vehicleDepreciationProfile: 'custom',
    hasLoan: false,
    loanInterestRate: 0.05,
    originalLoanAmount: 0,
    loanMonthlyPayment: 0,
    loanTermYears: isV ? 5 : 30,
    loanStartDate: new Date().toISOString().slice(0, 10),
    currentLoanBalance: 0,
  };
};

export const getMonthlyContribution = (
  target: number,
  _start: number,
  _rate: number,
  _years?: number,
): number => (target > 0 ? target / 120 : 0);
export const getYearsUntilGoalEstimate = (
  target: number,
  _cur: number,
  contrib: number,
  _rate: number,
): number => (target > 0 && contrib > 0 ? Math.ceil(target / (contrib * 12)) : 0);
export const getAnnualIncomeWithGrowth = (b: number, g: number, y: number): number =>
  b * (1 + g) ** y;
export const getEmployeeMonthlyContribution = (
  a: PlannerAccount,
  selfIncome: number,
  spouseIncome: number,
): number => {
  const inc = a.owner === 'self' ? selfIncome : spouseIncome;
  if (a.contributionMode === 'salary-percent')
    return clamp((inc * (a.contributionValue / 100)) / 12);
  if (a.contributionMode === 'yearly') return clamp(a.contributionValue / 12);
  return clamp(a.contributionValue);
};
export const getEmployerMatchMonthly = (
  a: PlannerAccount,
  selfIncome: number,
  spouseIncome: number,
): number => {
  const inc = a.owner === 'self' ? selfIncome : spouseIncome;
  const emp = getEmployeeMonthlyContribution(a, selfIncome, spouseIncome);
  if (a.employerMatchRate <= 0) return 0;
  const cap = inc * (a.employerMatchMaxPercentOfSalary / 100);
  const eff = Math.min(emp * 12, cap);
  return clamp((eff * a.employerMatchRate) / 100 / 12);
};
