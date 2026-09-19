/**
 * Net-worth projection engine: monthly compounding of accounts, contributions,
 * employer match, IRS limits, asset appreciation/depreciation, loans, and
 * post-retirement withdrawals.
 */
import * as plannerConfig from './config';
import * as plannerConstants from './constants';
import { clamp } from './plannerMath';
import {
  getAgeFromBirthday,
  getAnnualIncomeWithGrowth,
  getEmployeeMonthlyContribution,
  getEmployerMatchMonthlyFromAnnual,
  getSuggestedAnnualLimit,
} from './plannerMath';
import {
  getEffectiveAnnualRatePercent,
  getHomeAnnualGrowthRate,
  getVehicleAnnualDepreciationRate,
} from './rates';
import type { AccountType, PlannerAccount } from '../types/account';
import type {
  AssetFinanceDetails,
  AssetFinanceSnapshot,
  HomeGrowthProfile,
  VehicleDepreciationProfile,
} from '../types/finance';
import type { IrsLimitConfig } from '../types/irs';
import type { PlannerPerson } from '../types/person';
import type { ProjectionRow } from '../types/projection';

const { isCombinedAssetType, isLiabilityAccountType } = plannerConfig;

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
