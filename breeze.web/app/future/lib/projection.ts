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
import type { ProjectionRow, WithdrawalPlanInput, WithdrawalRow } from '../types/projection';

const { isCombinedAssetType, isLiabilityAccountType } = plannerConfig;

// ─── Sequenced drawdown ───────────────────────────────────
// Post-retirement spending follows the tax order real withdrawals follow:
// HSA receipts (capped by the saved-receipt balance), taxable, pre-tax,
// clocked Roth conversions, remaining Roth. Pre-59½ pre-tax or unclocked
// Roth draws flag 10% penalty exposure. Property and liabilities are never
// spending sources.

const PENALTY_RATE_BEFORE_AGE = 0.1;
const PENALTY_FREE_AGE = 59.5;

const TAXABLE_SOURCE_TYPES = new Set<AccountType>(['brokerage', 'checking', 'emergency-fund', 'other']);
const PRETAX_SOURCE_TYPES = new Set<AccountType>(['traditional-ira', '401k', '403b', '457']);

type SourceGroups = {
  taxable: number[];
  pretax: number[];
  roth: number[];
  hsa: number[];
};

const classifySources = (accounts: PlannerAccount[]): SourceGroups => {
  const groups: SourceGroups = { taxable: [], pretax: [], roth: [], hsa: [] };
  accounts.forEach((account, index) => {
    if (isCombinedAssetType(account.accountType) || isLiabilityAccountType(account.accountType)) {
      return;
    }
    if (TAXABLE_SOURCE_TYPES.has(account.accountType)) groups.taxable.push(index);
    else if (PRETAX_SOURCE_TYPES.has(account.accountType)) groups.pretax.push(index);
    else if (account.accountType === 'roth-ira') groups.roth.push(index);
    else if (account.accountType === 'hsa') groups.hsa.push(index);
  });
  return groups;
};

export const getNetWorthStartingBalance = (a: PlannerAccount): number => {
  if (a.accountType === 'home' || a.accountType === 'vehicle') return 0;
  if (isLiabilityAccountType(a.accountType)) return -clamp(a.startingBalance);
  return clamp(a.startingBalance);
};

/**
 * Balance-weighted average growth rate across the projected assets — the rate
 * the portfolio is "actually" earning once the market adjustment is applied.
 * Mirrors the per-account rates the projection engine applies (profile-based
 * home/vehicle rates included); liabilities are excluded since debts don't
 * grow toward the goal. Returns null when there is nothing to weight.
 */
export type PortfolioRateScope = 'all' | 'investable' | 'property';

export const getPortfolioAverageGrowthRate = (
  accounts: PlannerAccount[],
  assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
  inflationRatePercent: number,
  useInflationAdjustedValues: boolean,
  annualReturnAdjustmentPercent = 0,
  now = new Date(),
  scope: PortfolioRateScope = 'all',
): number | null => {
  let weighted = 0;
  let totalWeight = 0;
  for (const account of accounts) {
    if (isLiabilityAccountType(account.accountType)) continue;
    const isProperty = isCombinedAssetType(account.accountType);
    if (scope === 'investable' && isProperty) continue;
    if (scope === 'property' && !isProperty) continue;
    let weight: number;
    let baseRate: number;
    if (isProperty) {
      const details = assetFinanceDetailsByAccountId[account.id];
      if (!details) continue;
      const snapshot = getAssetFinanceSnapshot(details, now);
      weight = snapshot.equity;
      // Mirror the engine exactly: the market adjustment shifts every
      // asset's return — liquid accounts, profile homes (added after profile
      // resolution), and vehicles alike.
      baseRate =
        account.accountType === 'vehicle'
          ? -getVehicleAnnualDepreciationRate(
              details.vehicleDepreciationProfile,
              snapshot.monthsSincePurchase / 12,
              details.annualChangeRate,
            ) + annualReturnAdjustmentPercent
          : getHomeAnnualGrowthRate(details.homeGrowthProfile, details.annualChangeRate) +
            annualReturnAdjustmentPercent;
    } else {
      weight = clamp(account.startingBalance);
      baseRate = account.annualRate + annualReturnAdjustmentPercent;
    }
    if (weight <= 0) continue;
    weighted +=
      weight *
      getEffectiveAnnualRatePercent(baseRate, inflationRatePercent, useInflationAdjustedValues);
    totalWeight += weight;
  }
  return totalWeight > 0 ? weighted / totalWeight : null;
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
  /** Market stress test: shifts every asset's return by this many %/yr (negative = bad markets). */
  annualReturnAdjustmentPercent = 0,
  /** Ledger facts (receipt balance, conversion clocks) that sequence the drawdown. */
  withdrawalPlan?: WithdrawalPlanInput,
): { projectionRows: ProjectionRow[]; finalBalances: number[]; withdrawalRows?: WithdrawalRow[] } => {
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
      assetAnnualRate: details.annualChangeRate + annualReturnAdjustmentPercent,
      annualChangeRate: details.annualChangeRate,
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

  // Sequenced-drawdown state: active only when the retirement-access ledger
  // facts are supplied. Otherwise the drawdown stays proportional.
  const sourceGroups = withdrawalPlan ? classifySources(accounts) : null;
  const firstCalendarYear = withdrawalPlan?.currentYear ?? new Date().getFullYear();
  let receiptPool = withdrawalPlan ? clamp(withdrawalPlan.hsaReceiptBalance) : 0;
  let clockedUsed = 0;
  let withdrawalAccumulator: WithdrawalRow | null = null;
  const withdrawalRows: WithdrawalRow[] = [];

  for (let year = 1; year <= years; year++) {
    const isPostRetirement = currentAge + year > targetAge;
    // Nominal mode: withdrawals grow with inflation. Real mode: balances are
    // already in today's dollars, so a constant lifestyle is a flat withdrawal —
    // inflating it here would double-count inflation on the spending side.
    const withdrawalInflator = useInflationAdjustedValues
      ? 1
      : (1 + inflationRatePercent / 100) ** (year - 1);
    const monthlyWithdrawal =
      isPostRetirement && annualWithdrawal ? (annualWithdrawal / 12) * withdrawalInflator : 0;

    if (withdrawalPlan && isPostRetirement) {
      withdrawalAccumulator = {
        age: currentAge + year,
        year: firstCalendarYear + year,
        expense: annualWithdrawal ? annualWithdrawal * withdrawalInflator : 0,
        hsaReceipts: 0,
        taxable: 0,
        pretax: 0,
        rothClocked: 0,
        rothOther: 0,
        shortfall: 0,
        penaltyExposure: 0,
        spendableBalance: 0,
        receiptBalance: 0,
      };
    }

    let projectedContributionPlanByAccount = isPostRetirement
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
    if (useInflationAdjustedValues && !isPostRetirement) {
      // Salaries, the IRS caps, and the match above are nominal dollars; deflate
      // deposits so they land in today's-dollar balances at the same scale.
      const depositDeflator = 1 / (1 + inflationRatePercent / 100) ** (year - 1);
      projectedContributionPlanByAccount = projectedContributionPlanByAccount.map((plan) => ({
        monthlyEmployeeContribution: plan.monthlyEmployeeContribution * depositDeflator,
        monthlyEmployerMatch: plan.monthlyEmployerMatch * depositDeflator,
      }));
    }
    for (let month = 0; month < 12; month++) {
      // Sequenced drawdown: split this month's spending across sources in tax
      // order. Without ledger facts the drawdown stays proportional.
      let monthTakeByIndex: number[] | null = null;
      if (withdrawalPlan && sourceGroups && isPostRetirement && monthlyWithdrawal > 0) {
        const acc = withdrawalAccumulator;
        const takes = accounts.map(() => 0);
        const groupBalance = (idxs: number[]) => idxs.reduce((sum, i) => sum + balances[i], 0);
        const takeFrom = (idxs: number[], amount: number): number => {
          const total = groupBalance(idxs);
          const take = Math.min(amount, total);
          if (take <= 0) return 0;
          for (const i of idxs) {
            // Split only — the account loop below applies the withdrawal after
            // each account's growth, exactly like the proportional path.
            takes[i] += take * (balances[i] / total);
          }
          return take;
        };

        let need = monthlyWithdrawal;

        // 1. HSA receipts — tax-free at any age, capped by the receipt pool
        // and the HSA account itself.
        const hsaTake = takeFrom(sourceGroups.hsa, Math.min(need, receiptPool));
        receiptPool -= hsaTake;
        if (acc) acc.hsaReceipts += hsaTake;
        need -= hsaTake;

        // 2. Taxable accounts.
        const taxableTake = takeFrom(sourceGroups.taxable, need);
        if (acc) acc.taxable += taxableTake;
        need -= taxableTake;

        // 3. Pre-tax — penalized before 59½.
        const pretaxTake = takeFrom(sourceGroups.pretax, need);
        if (pretaxTake > 0 && currentAge + year < PENALTY_FREE_AGE && acc) {
          acc.penaltyExposure += pretaxTake * PENALTY_RATE_BEFORE_AGE;
        }
        if (acc) acc.pretax += pretaxTake;
        need -= pretaxTake;

        // 4. Clocked conversions — penalty-free once five years have passed.
        const calendarYear = firstCalendarYear + year;
        const clockedAvailable =
          (withdrawalPlan.conversionBuckets ?? []).reduce(
            (sum, b) =>
              Number(b.availableOn.slice(0, 4)) <= calendarYear ? sum + clamp(b.amount) : sum,
            0,
          ) - clockedUsed;
        const rothClockedTake = takeFrom(
          sourceGroups.roth,
          Math.min(need, Math.max(0, clockedAvailable)),
        );
        clockedUsed += rothClockedTake;
        if (acc) acc.rothClocked += rothClockedTake;
        need -= rothClockedTake;

        // 5. Remaining Roth — before 59½ this is the earnings/basis mix.
        const rothOtherTake = takeFrom(sourceGroups.roth, need);
        if (rothOtherTake > 0 && currentAge + year < PENALTY_FREE_AGE && acc) {
          acc.penaltyExposure += rothOtherTake * PENALTY_RATE_BEFORE_AGE;
        }
        if (acc) acc.rothOther += rothOtherTake;
        need -= rothOtherTake;

        if (acc) acc.shortfall += Math.max(0, need);
        monthTakeByIndex = takes;
      }

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
              -annualDepRate + annualReturnAdjustmentPercent,
              inflationRatePercent,
              useInflationAdjustedValues,
            );
            afState.assetValue *= 1 + effRate / 100 / 12;
          } else {
            const annualHomeRate =
              getHomeAnnualGrowthRate(afState.homeGrowthProfile, afState.annualChangeRate) +
              annualReturnAdjustmentPercent;
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
          isLiabilityAccountType(account.accountType)
            ? account.annualRate
            : account.annualRate + annualReturnAdjustmentPercent,
          inflationRatePercent,
          useInflationAdjustedValues,
        );
        const monthlyRate = clamp(effAnnualRate, -99) / 100 / 12;
        const plan = projectedContributionPlanByAccount[index];
        const contrib = plan.monthlyEmployeeContribution + plan.monthlyEmployerMatch;
        balances[index] = balances[index] * (1 + monthlyRate) + contrib;

        if (isPostRetirement && monthlyWithdrawal > 0) {
          const takes = monthTakeByIndex;
          if (takes) {
            const withdrawal = takes[index];
            if (withdrawal > 0) {
              balances[index] = Math.max(0, balances[index] - withdrawal);
            }
          } else {
            const totalBalance = balances.reduce((sum, b) => sum + b, 0);
            if (totalBalance > 0) {
              const accountShare = balances[index] / totalBalance;
              const withdrawal = monthlyWithdrawal * accountShare;
              balances[index] = Math.max(0, balances[index] - withdrawal);
            }
          }
        }

        contributedTotal += contrib;
      }
    }
    if (withdrawalAccumulator && sourceGroups) {
      const spendableIdxs = [
        ...sourceGroups.taxable,
        ...sourceGroups.pretax,
        ...sourceGroups.roth,
        ...sourceGroups.hsa,
      ];
      withdrawalAccumulator.spendableBalance = spendableIdxs.reduce(
        (sum, i) => sum + balances[i],
        0,
      );
      withdrawalAccumulator.receiptBalance = receiptPool;
      withdrawalRows.push(withdrawalAccumulator);
      withdrawalAccumulator = null;
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
  return withdrawalPlan
    ? { projectionRows, finalBalances: balances, withdrawalRows }
    : { projectionRows, finalBalances: balances };
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
