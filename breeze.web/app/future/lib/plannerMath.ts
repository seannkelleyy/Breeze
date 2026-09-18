import type { ChartConfig } from '@/components/ui/chart';
import type { AccountRateProfile, AccountType, PlannerAccount } from '../types/account';
import type {
  AssetFinanceDetails,
  AssetFinanceSnapshot,
  FinancialMathSnapshot,
  HomeGrowthProfile,
  VehicleDepreciationProfile,
} from '../types/finance';
import type { IrsLimitConfig, IrsLimitKey } from '../types/irs';
import type { PlannerPerson } from '../types/person';
import type { ProjectionRow } from '../types/projection';
import type { TaxBracketRow, TaxYearTables } from '../types/tax';
import * as plannerConfig from './config';
import * as plannerConstants from './constants';

const { isCombinedAssetType, isLiabilityAccountType, isNonContributingAccountType } = plannerConfig;

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
export const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const getHomeAnnualGrowthRate = (p: string | undefined, r?: number): number => {
  if (p && p !== 'custom' && p in plannerConstants.PLANNER_HOME_GROWTH_PROFILE_RATES) {
    return plannerConstants.PLANNER_HOME_GROWTH_PROFILE_RATES[
      p as keyof typeof plannerConstants.PLANNER_HOME_GROWTH_PROFILE_RATES
    ];
  }
  return r ?? plannerConstants.PLANNER_DEFAULT_HOME_APPRECIATION_RATE;
};
export const getVehicleAnnualDepreciationRate = (
  p: string | undefined,
  y: number,
  c?: number,
): number => {
  const firstYearRates = plannerConstants.PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES;
  const matureFloors = plannerConstants.PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS;
  const taperStrength = plannerConstants.PLANNER_VEHICLE_DEPRECIATION_TAPER_STRENGTH;

  const getRate = (firstYear: number, matureFloor: number): number => {
    const taperedRate = matureFloor + (firstYear - matureFloor) * Math.pow(taperStrength, y);
    return Math.min(firstYear, Math.max(matureFloor, taperedRate));
  };

  if (p === 'low') return getRate(firstYearRates.low, matureFloors.low);
  if (p === 'medium' || !p) return getRate(firstYearRates.medium, matureFloors.medium);
  if (p === 'high') return getRate(firstYearRates.high, matureFloors.high);
  return c ?? plannerConstants.PLANNER_DEFAULT_VEHICLE_DEPRECIATION_RATE;
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
export const getNetWorthStartingBalance = (a: PlannerAccount): number => {
  if (a.accountType === 'home' || a.accountType === 'vehicle') return 0;
  if (isLiabilityAccountType(a.accountType)) return -clamp(a.startingBalance);
  return clamp(a.startingBalance);
};
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
export const getTotalMonthlyForAccount = (a: PlannerAccount, people: PlannerPerson[]): number =>
  getEmployeeMonthlyContribution(a, people) + getEmployerMatchMonthly(a, people);
export const getPersonsAnnualIncome = (personIds: string[], people: PlannerPerson[]): number => {
  if (personIds.length === 0) return people[0]?.annualSalary ?? 0;
  return personIds.reduce((sum, id) => {
    const p = people.find((p) => p.id === id);
    return sum + (p?.annualSalary ?? 0);
  }, 0);
};
export const getTotalAnnualIncome = (p: PlannerPerson | undefined): number =>
  p ? p.annualSalary + (p.bonusMode === 'dollars' ? p.annualBonus : 0) : 0;
export const getPlannerContributionTotals = (
  accounts: PlannerAccount[],
  people: PlannerPerson[],
) => {
  let te = 0,
    tm = 0,
    ti = 0;
  for (const a of accounts) {
    const e = getEmployeeMonthlyContribution(a, people);
    const m = getEmployerMatchMonthly(a, people);
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
  const bd = people[0]?.birthday ?? '';
  const hi = people.reduce((sum, p) => sum + getTotalAnnualIncome(p), 0);
  const ca = getAgeFromBirthday(bd);
  return {
    people,
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
export const getFederalTax = (taxableIncome: number, brackets: TaxBracketRow[]): number => {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.minimum) break;
    const upper = bracket.maximum === null ? taxableIncome : Math.min(taxableIncome, bracket.maximum);
    tax += (upper - bracket.minimum) * bracket.rate;
  }
  return tax;
};

export const getFicaTax = (income: number, ssWageBase: number): number => {
  const ssTax = Math.min(income, ssWageBase) * 0.062;
  const medicareTax = income * 0.0145;
  return ssTax + medicareTax;
};

export const getEffectiveTaxRate = (
  grossIncome: number,
  tables: TaxYearTables,
  deductionType?: string,
): { effectiveRate: number; netIncomeFactor: number; taxableIncome: number } => {
  const deduction = deductionType === 'ITEMIZED' ? 0 : tables.standardDeduction;
  const taxableIncome = Math.max(0, grossIncome - deduction);
  const federalTax = getFederalTax(taxableIncome, tables.brackets);
  const ficaTax = getFicaTax(grossIncome, tables.ssWageBase);
  const totalTax = federalTax + ficaTax;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;
  return {
    effectiveRate,
    netIncomeFactor: Math.max(0, 1 - effectiveRate),
    taxableIncome,
  };
};

export const getFinancialMathSnapshot = (
  input: Record<string, unknown>,
  taxTables: TaxYearTables | null,
): FinancialMathSnapshot => {
  const monthlyExpenses = Number(input.monthlyExpenses ?? 0);
  const selfSalary = Number(input.selfSalary ?? 0);
  const spouseSalary = Number(input.spouseSalary ?? 0);
  const safeWithdrawalRate = Number(input.safeWithdrawalRate ?? 4);
  const currentPortfolio = Number(input.currentPortfolio ?? 0);
  const emergencyFundBalance = Number(input.emergencyFundBalance ?? 0);
  const deductionType = String(input.deductionType ?? 'STANDARD');
  const grossIncome = selfSalary + spouseSalary;
  const annualSpend = monthlyExpenses * 12;
  // While tax reference data is loading, fall back to a neutral factor
  // instead of blocking the whole projection on the fetch.
  const netIncomeFactor = taxTables
    ? getEffectiveTaxRate(grossIncome, taxTables, deductionType).netIncomeFactor
    : plannerConstants.PLANNER_NEUTRAL_NET_INCOME_FACTOR;
  const netIncome = grossIncome * netIncomeFactor;
  const annualExtraExpenseBuffer =
    annualSpend * (plannerConstants.PLANNER_ANNUAL_EXTRA_EXPENSE_BUFFER_PERCENT / 100);
  const yearlySavings = Math.max(0, netIncome - annualSpend - annualExtraExpenseBuffer);
  const withdrawalMultiplier = safeWithdrawalRate > 0 ? 1 / (safeWithdrawalRate / 100) : 25;
  const yearlyPortfolioIncome = currentPortfolio * (safeWithdrawalRate / 100);
  return {
    monthlyExpenses,
    annualSpend,
    emergencyFundBalance,
    emergencyFund3Months: monthlyExpenses * 3,
    emergencyFund6Months: monthlyExpenses * 6,
    emergencyFund12Months: monthlyExpenses * 12,
    selfSalary,
    spouseSalary,
    grossIncome,
    netIncomeFactor,
    netIncome,
    annualExtraExpenseBuffer,
    yearlySavings,
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
  const matchable = normalizedSalary * (clamp(account.employerMatchMaxPercentOfSalary) / 100);
  const eligible = Math.min(clamp(employeeAnnualContribution), matchable);
  const annualMatch = eligible * (clamp(account.employerMatchRate) / 100);
  return annualMatch / 12;
};

const getProjectedAnnualIrsLimit = (
  accountType: AccountType,
  ownerCurrentAge: number,
  elapsedYears: number,
  limits: IrsLimitConfig,
  hasMultiplePeople: boolean,
  annualIrsLimitGrowthRate: number,
): number => {
  const currentAnnualLimit = getSuggestedAnnualLimit(
    accountType,
    ownerCurrentAge,
    limits,
    hasMultiplePeople,
  );
  if (currentAnnualLimit <= 0) return 0;
  const growthFactor = (1 + clamp(annualIrsLimitGrowthRate) / 100) ** Math.max(0, elapsedYears);
  return currentAnnualLimit * growthFactor;
};

export const getProjection = (
  accounts: PlannerAccount[],
  currentAge: number,
  targetAge: number,
  people: PlannerPerson[],
  assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
  irLimits: IrsLimitConfig,
  annualIrsLimitGrowthRate: number,
  inflationRatePercent: number,
  useInflationAdjustedValues: boolean,
  projectionEndAge?: number,
  annualWithdrawal?: number,
): { projectionRows: ProjectionRow[]; finalBalances: number[] } => {
  const endAge = projectionEndAge ?? targetAge;
  const years = Math.max(0, endAge - currentAge);
  const now = new Date();
  const balances = accounts.map((account) => {
    if (isCombinedAssetType(account.accountType)) {
      const details = assetFinanceDetailsByAccountId[account.id];
      if (details) return getAssetFinanceSnapshot(details, now).equity;
      return clamp(account.startingBalance);
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
    const isPostRetirement = currentAge + year > targetAge;
    const monthlyWithdrawal =
      isPostRetirement && annualWithdrawal
        ? (annualWithdrawal / 12) * (1 + inflationRatePercent / 100) ** (year - 1)
        : 0;

    const projectedContributionPlanByAccount = isPostRetirement
      ? accounts.map(() => ({ monthlyEmployeeContribution: 0, monthlyEmployerMatch: 0 }))
      : accounts.map((account) => {
          const ownerPersons = people.filter((p) => account.personIds.includes(p.id));
          const ownerPerson = ownerPersons[0] ?? people[0];
          const ownerAnnualIncome = ownerPerson
            ? getAnnualIncomeWithGrowth(
                ownerPerson.annualSalary,
                ownerPerson.incomeGrowthRate,
                year - 1,
              )
            : 0;
          const annualEmployeeContribution = getEmployeeMonthlyContribution(account, people) * 12;
          const ownerAge = ownerPerson ? getAgeFromBirthday(ownerPerson.birthday) : 30;
          const ownerAgeInProjectionYear = ownerAge + (year - 1);
          const projectedAnnualIrsLimit = getProjectedAnnualIrsLimit(
            account.accountType,
            ownerAgeInProjectionYear,
            year - 1,
            irLimits,
            people.length > 1,
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

        if (isPostRetirement && monthlyWithdrawal > 0) {
          const totalBalance = balances.reduce((sum, b) => sum + b, 0);
          if (totalBalance > 0) {
            const accountShare = balances[index] / totalBalance;
            const withdrawal = monthlyWithdrawal * accountShare;
            balances[index] = Math.max(0, balances[index] - withdrawal);
          }
        }

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
    purchaseDate: account.purchaseDate ?? new Date().toISOString().slice(0, 10),
    purchasePrice: account.purchasePrice ?? v,
    currentValue: v,
    annualChangeRate: isV ? -Math.max(Math.abs(account.annualRate), 0.15) : account.annualRate || 4,
    homeGrowthProfile: (account.homeGrowthProfile ?? 'none') as HomeGrowthProfile,
    vehicleDepreciationProfile: (account.vehicleDepreciationProfile ??
      'custom') as VehicleDepreciationProfile,
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
  if (Math.abs(monthlyRate) < 1e-10) return Math.max(0, (target - start) / months);
  const compoundFactor = (1 + monthlyRate) ** months;
  if (Math.abs(compoundFactor - 1) < 1e-10) return Math.max(0, (target - start) / months);
  return Math.max(0, ((target - start * compoundFactor) * monthlyRate) / (compoundFactor - 1));
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
  if (Math.abs(monthlyRate) < 1e-10) return Math.ceil((target - cur) / (monthlyContrib * 12));
  const denominator = monthlyContrib + monthlyRate * cur;
  if (Math.abs(denominator) < 1e-10) return 999;
  const numerator = monthlyContrib + monthlyRate * target;
  if (Math.abs(numerator) < 1e-10) return 999;
  const n = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  return Math.max(0, Math.ceil(n / 12));
};
export const getAnnualIncomeWithGrowth = (b: number, g: number, y: number): number =>
  b * (1 + g / 100) ** y;
export const getEmployeeMonthlyContribution = (
  a: PlannerAccount,
  people: PlannerPerson[],
): number => {
  if (isNonContributingAccountType(a.accountType)) return 0;
  const inc = getPersonsAnnualIncome(a.personIds, people);
  if (a.contributionMode === 'salary-percent')
    return clamp((inc * (a.contributionValue / 100)) / 12);
  if (a.contributionMode === 'yearly') return clamp(a.contributionValue / 12);
  if (a.contributionMode === 'biweekly') return clamp((a.contributionValue * 26) / 12);
  if (a.contributionMode === 'weekly') return clamp((a.contributionValue * 52) / 12);
  return clamp(a.contributionValue);
};
export const getEmployerMatchMonthly = (a: PlannerAccount, people: PlannerPerson[]): number => {
  const inc = getPersonsAnnualIncome(a.personIds, people);
  const emp = getEmployeeMonthlyContribution(a, people);
  if (a.employerMatchRate <= 0) return 0;
  const cap = inc * (a.employerMatchMaxPercentOfSalary / 100);
  const eff = Math.min(emp * 12, cap);
  return clamp((eff * a.employerMatchRate) / 100 / 12);
};
