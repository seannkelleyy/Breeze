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
import * as plannerConfig from './config';
import * as plannerConstants from './constants';

const { accountTypesWithoutIrsLimits, isCombinedAssetType, isDepreciatingAssetType, isLiabilityAccountType, isNonContributingAccountType } = plannerConfig;

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
const getMonthsBetween = (from: Date, to: Date): number => {
  const monthDelta =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (monthDelta <= 0) return 0;
  return to.getDate() >= from.getDate() ? monthDelta : monthDelta - 1;
};
export const getAssetFinanceSnapshot = (
  details: AssetFinanceDetails,
  asOf: Date,
): AssetFinanceSnapshot => {
  const parsedPurchaseDate = new Date(details.purchaseDate);
  const safePurchaseDate = Number.isNaN(parsedPurchaseDate.getTime())
    ? new Date()
    : parsedPurchaseDate;
  const monthsSincePurchase = getMonthsBetween(safePurchaseDate, asOf);
  const assetValue = clamp(details.currentValue);
  if (!details.hasLoan) {
    return {
      assetValue,
      loanBalance: 0,
      equity: assetValue,
      monthsSincePurchase,
      remainingLoanMonths: 0,
    };
  }
  const parsedLoanStartDate = new Date(details.loanStartDate);
  const safeLoanStartDate = Number.isNaN(parsedLoanStartDate.getTime())
    ? new Date()
    : parsedLoanStartDate;
  const termMonths = Math.max(1, Math.round(clamp(details.loanTermYears) * 12));
  const elapsedLoanMonths = getMonthsBetween(safeLoanStartDate, asOf);
  const remainingLoanMonths = Math.max(0, termMonths - elapsedLoanMonths);
  const loanBalance = clamp(details.currentLoanBalance);
  return {
    assetValue,
    loanBalance,
    equity: assetValue - loanBalance,
    monthsSincePurchase,
    remainingLoanMonths,
  };
};
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
  input: Record<string, unknown>,
): FinancialMathSnapshot => {
  const monthlyExpenses = Number(input.monthlyExpenses ?? 0);
  const selfSalary = Number(input.selfSalary ?? 0);
  const spouseSalary = Number(input.spouseSalary ?? 0);
  const safeWithdrawalRate = Number(input.safeWithdrawalRate ?? 4);
  const currentPortfolio = Number(input.currentPortfolio ?? 0);
  const grossIncome = selfSalary + spouseSalary;
  const annualSpend = monthlyExpenses * 12;
  const netIncomeFactor = 0.7;
  const netIncome = grossIncome * netIncomeFactor;
  const annualExtraExpenseBuffer = annualSpend * 0.1;
  const yearlySavings = grossIncome - annualSpend - annualExtraExpenseBuffer;
  const withdrawalMultiplier =
    safeWithdrawalRate > 0 ? 1 / (safeWithdrawalRate / 100) : 25;
  const yearlyPortfolioIncome =
    currentPortfolio * (safeWithdrawalRate / 100);
  return {
    monthlyExpenses,
    annualSpend,
    emergencyFund3Months: monthlyExpenses * 3,
    emergencyFund6Months: monthlyExpenses * 6,
    emergencyFund12Months: monthlyExpenses * 12,
    selfSalary,
    spouseSalary,
    grossIncome,
    netIncomeFactor,
    netIncome,
    annualExtraExpenseBuffer,
    yearlySavings: Math.max(0, yearlySavings),
    safeWithdrawalRatePercent: safeWithdrawalRate,
    withdrawalMultiplier,
    currentPortfolio,
    yearlyPortfolioIncome,
    yearsToGoalRatePercent: 0,
    scenarios: [],
  };
};
export const getEmployerMatchMonthlyFromAnnual = (
  account: PlannerAccount,
  ownerAnnualIncome: number,
  employeeAnnualContribution: number,
): number => {
  if (account.accountType !== '401k') return 0;
  const normalizedSalary = clamp(ownerAnnualIncome);
  if (normalizedSalary <= 0) return 0;
  const matchable =
    normalizedSalary * (clamp(account.employerMatchMaxPercentOfSalary) / 100);
  const eligible = Math.min(clamp(employeeAnnualContribution), matchable);
  const annualMatch = eligible * (clamp(account.employerMatchRate) / 100);
  return annualMatch / 12;
};

const getProjectedAnnualIrsLimit = (
  accountType: AccountType,
  ownerCurrentAge: number,
  elapsedYears: number,
  limits: IrsLimitConfig,
  hasSpouse: boolean,
  annualIrsLimitGrowthRate: number,
): number => {
  const currentAnnualLimit = getSuggestedAnnualLimit(accountType, ownerCurrentAge, limits, hasSpouse);
  if (currentAnnualLimit <= 0) return 0;
  const growthFactor = (1 + clamp(annualIrsLimitGrowthRate) / 100) ** Math.max(0, elapsedYears);
  return currentAnnualLimit * growthFactor;
};

export const getProjection = (
  accounts: PlannerAccount[],
  currentAge: number,
  targetAge: number,
  selfAnnualIncome: number,
  spouseAnnualIncome: number,
  selfIncomeGrowthRate: number,
  spouseIncomeGrowthRate: number,
  assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
  irLimits: IrsLimitConfig,
  hasSpouse: boolean,
  annualIrsLimitGrowthRate: number,
  selfCurrentAge: number,
  spouseCurrentAge: number,
  inflationRatePercent: number,
  useInflationAdjustedValues: boolean,
): { projectionRows: ProjectionRow[]; finalBalances: number[] } => {
  const years = Math.max(0, targetAge - currentAge);
  const now = new Date();
  const balances = accounts.map((account) => {
    if (isCombinedAssetType(account.accountType)) {
      const details = assetFinanceDetailsByAccountId[account.id];
      if (details) return getAssetFinanceSnapshot(details, now).equity;
    }
    return getNetWorthStartingBalance(account);
  });
  const assetFinanceRuntimeState = accounts.map((account) => {
    if (!isCombinedAssetType(account.accountType)) return null;
    const details = assetFinanceDetailsByAccountId[account.id];
    if (!details) return null;
    const snapshot = getAssetFinanceSnapshot(details, now);
    return {
      accountType: account.accountType,
      assetValue: snapshot.assetValue,
      assetAnnualRate: details.annualChangeRate,
      homeGrowthProfile:
        details.homeGrowthProfile ?? plannerConstants.PLANNER_DEFAULT_HOME_GROWTH_PROFILE,
      vehicleDepreciationProfile: details.vehicleDepreciationProfile,
      monthsSincePurchase: snapshot.monthsSincePurchase,
      loanBalance: snapshot.loanBalance,
      hasLoan: details.hasLoan,
      loanMonthlyRate: clamp(details.loanInterestRate, 0) / 100 / 12,
      loanMonthlyPayment: clamp(details.loanMonthlyPayment),
      vehicleCustomAnnualRate: details.annualChangeRate,
      remainingLoanMonths: snapshot.remainingLoanMonths,
    };
  });
  const initialRowAccounts = balances.reduce(
    (series, balance, index) => ({ ...series, [`account-${index}`]: balance }),
    {} as Record<`account-${number}`, number>,
  );
  const projectionRows: ProjectionRow[] = [
    {
      age: currentAge,
      totalBalance: balances.reduce((sum, b) => sum + b, 0),
      totalContributions: 0,
      ...initialRowAccounts,
    },
  ];
  let contributedTotal = 0;
  for (let year = 1; year <= years; year++) {
    const yearSelfAnnualIncome = getAnnualIncomeWithGrowth(selfAnnualIncome, selfIncomeGrowthRate, year - 1);
    const yearSpouseAnnualIncome = getAnnualIncomeWithGrowth(spouseAnnualIncome, spouseIncomeGrowthRate, year - 1);
    const projectedContributionPlanByAccount = accounts.map((account) => {
      const ownerAnnualIncome =
        account.owner === 'spouse' ? yearSpouseAnnualIncome : yearSelfAnnualIncome;
      const annualEmployeeContribution =
        getEmployeeMonthlyContribution(account, yearSelfAnnualIncome, yearSpouseAnnualIncome) * 12;
      const ownerCurrentAge = account.owner === 'spouse' ? spouseCurrentAge : selfCurrentAge;
      const ownerAgeInProjectionYear = ownerCurrentAge + (year - 1);
      const projectedAnnualIrsLimit = getProjectedAnnualIrsLimit(
        account.accountType,
        ownerAgeInProjectionYear,
        year - 1,
        irLimits,
        hasSpouse,
        annualIrsLimitGrowthRate,
      );
      const cappedAnnualEmployeeContribution =
        projectedAnnualIrsLimit > 0
          ? Math.min(annualEmployeeContribution, projectedAnnualIrsLimit)
          : annualEmployeeContribution;
      return {
        monthlyEmployeeContribution: cappedAnnualEmployeeContribution / 12,
        monthlyEmployerMatch: getEmployerMatchMonthlyFromAnnual(
          account,
          ownerAnnualIncome,
          cappedAnnualEmployeeContribution,
        ),
      };
    });
    for (let month = 0; month < 12; month++) {
      for (let index = 0; index < accounts.length; index++) {
        const account = accounts[index];
        const afState = assetFinanceRuntimeState[index];
        if (afState) {
          if (afState.accountType === 'vehicle') {
            const vehicleAgeYears = afState.monthsSincePurchase / 12;
            const annualDepRate = getVehicleAnnualDepreciationRate(
              afState.vehicleDepreciationProfile,
              vehicleAgeYears,
              afState.vehicleCustomAnnualRate,
            );
            const effRate = getEffectiveAnnualRatePercent(
              -annualDepRate,
              inflationRatePercent,
              useInflationAdjustedValues,
            );
            afState.assetValue *= 1 + effRate / 100 / 12;
          } else {
            const annualHomeRate = getHomeAnnualGrowthRate(
              afState.homeGrowthProfile,
              afState.assetAnnualRate,
            );
            const effRate = getEffectiveAnnualRatePercent(
              annualHomeRate,
              inflationRatePercent,
              useInflationAdjustedValues,
            );
            afState.assetValue *= 1 + effRate / 100 / 12;
          }
          afState.monthsSincePurchase += 1;
          if (afState.hasLoan && afState.loanBalance > 0) {
            afState.loanBalance =
              afState.loanBalance * (1 + afState.loanMonthlyRate) - afState.loanMonthlyPayment;
            if (afState.loanBalance < 0) afState.loanBalance = 0;
            if (afState.remainingLoanMonths > 0) afState.remainingLoanMonths -= 1;
            contributedTotal += afState.loanMonthlyPayment;
          }
          balances[index] = afState.assetValue - afState.loanBalance;
          continue;
        }
        const effAnnualRate = getEffectiveAnnualRatePercent(
          account.annualRate,
          inflationRatePercent,
          useInflationAdjustedValues,
        );
        const monthlyRate = clamp(effAnnualRate, -99) / 100 / 12;
        const plan = projectedContributionPlanByAccount[index];
        const contrib = plan.monthlyEmployeeContribution + plan.monthlyEmployerMatch;
        balances[index] = balances[index] * (1 + monthlyRate) + contrib;
        contributedTotal += contrib;
      }
    }
    projectionRows.push({
      age: currentAge + year,
      totalBalance: balances.reduce((sum, v) => sum + v, 0),
      totalContributions: contributedTotal,
      ...balances.reduce(
        (series, balance, index) => ({ ...series, [`account-${index}`]: balance }),
        {} as Record<`account-${number}`, number>,
      ),
    });
  }
  return { projectionRows, finalBalances: balances };
};
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
  start: number,
  rate: number,
  years?: number,
): number => {
  if (target <= 0) return 0;
  if (!years || years <= 0) return Math.max(0, target - start);
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  if (Math.abs(monthlyRate) < 1e-10)
    return Math.max(0, (target - start) / months);
  const compoundFactor = (1 + monthlyRate) ** months;
  if (Math.abs(compoundFactor - 1) < 1e-10)
    return Math.max(0, (target - start) / months);
  return Math.max(
    0,
    ((target - start * compoundFactor) * monthlyRate) / (compoundFactor - 1),
  );
};
export const getYearsUntilGoalEstimate = (
  target: number,
  cur: number,
  contrib: number,
  rate: number,
): number => {
  if (target <= 0) return 0;
  if (contrib <= 0) return 999;
  const monthlyRate = rate / 100 / 12;
  const monthlyContrib = contrib;
  if (Math.abs(monthlyRate) < 1e-10)
    return Math.ceil((target - cur) / (monthlyContrib * 12));
  const denominator = monthlyContrib + monthlyRate * cur;
  if (Math.abs(denominator) < 1e-10) return 999;
  const numerator = monthlyContrib - monthlyRate * target;
  if (Math.abs(numerator) < 1e-10) return 999;
  const n = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  return Math.max(0, Math.ceil(n / 12));
};
export const getAnnualIncomeWithGrowth = (b: number, g: number, y: number): number =>
  b * (1 + g / 100) ** y;
export const getEmployeeMonthlyContribution = (
  a: PlannerAccount,
  selfIncome: number,
  spouseIncome: number,
): number => {
  if (isNonContributingAccountType(a.accountType)) return 0;
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
