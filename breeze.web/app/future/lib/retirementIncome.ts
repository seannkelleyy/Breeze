/**
 * Retirement income planner: account-type-aware withdrawal sequencing.
 *
 * The net-worth projection engine (projection.ts) withdraws proportionally
 * from every account once retired. This module replaces that proportional
 * split with the tax-aware order real retirement spending follows:
 *
 *   1. HSA reimbursements, capped by the saved-receipt balance — tax- and
 *      penalty-free at any age.
 *   2. Taxable accounts (brokerage, checking, emergency fund, other).
 *   3. Pre-tax accounts (Traditional IRA, 401(k)/403(b)/457) — each dollar
 *      taken before 59½ flags 10% penalty exposure.
 *   4. Roth conversions whose five-year clock has cleared (penalty-free).
 *   5. Remaining Roth balance — before 59½ this is earnings/basis mix, so it
 *      also flags penalty exposure.
 *
 * Yearly granularity, mirroring the projection engine's conventions: nominal
 * rates with the same real-mode deflation, expenses flat in real mode and
 * inflation-grown in nominal mode, and withdrawals starting the year AFTER the
 * retirement age. Property and liabilities are not spending sources.
 *
 * Tax brackets are not modeled yet — pre-tax withdrawals report their size,
 * not their cost; bracket-aware filling is the planned next phase.
 */
import { getEffectiveAnnualRatePercent } from './rates';
import { clamp } from './plannerMath';
import { isCombinedAssetType, isLiabilityAccountType } from './config';
import type { PlannerAccount } from '../types/account';

const PENALTY_RATE_BEFORE_AGE = 0.1;
const PENALTY_FREE_AGE = 59.5;

const TAXABLE_TYPES = new Set(['brokerage', 'checking', 'emergency-fund', 'other']);
const PRETAX_TYPES = new Set(['traditional-ira', '401k', '403b', '457']);

export interface ConversionClockBucket {
  /** ISO date the conversion principal becomes penalty-free (Jan 1 of year+5). */
  availableOn: string;
  amount: number;
}

export interface RetirementIncomePlanInput {
  /** Full planner account list — the planner picks its own spending sources. */
  accounts: PlannerAccount[];
  currentAge: number;
  retirementAge: number;
  endAge: number;
  /** Today's-dollar annual spending the plan must cover. */
  annualExpenses: number;
  inflationRatePercent: number;
  useInflationAdjustedValues: boolean;
  marketAdjustmentPercent?: number;
  currentYear?: number;
  /** Unreimbursed HSA receipts — the tax-free spending pool inside the HSA. */
  hsaReceiptBalance: number;
  conversionBuckets: ConversionClockBucket[];
}

export interface RetirementIncomeRow {
  age: number;
  year: number;
  expense: number;
  hsaReceipts: number;
  taxable: number;
  pretax: number;
  rothClocked: number;
  rothOther: number;
  shortfall: number;
  penaltyExposure: number;
  taxableBalance: number;
  pretaxBalance: number;
  rothBalance: number;
  hsaBalance: number;
  receiptBalance: number;
}

export interface RetirementIncomePlan {
  rows: RetirementIncomeRow[];
  totalPenaltyExposure: number;
  totalShortfall: number;
  firstShortfallAge: number | null;
  endingPortfolioBalance: number;
}

interface SourcePools {
  taxable: number[];
  pretax: number[];
  roth: number;
  hsa: number;
}

const groupTotal = (balances: number[]) => balances.reduce((sum, b) => sum + b, 0);

/**
 * Builds the per-year withdrawal plan. Balances grow at each account's
 * effective rate, then spending is sequenced through the source order above.
 * HSA receipts spend down a separate receipt pool but also leave the HSA
 * account; clocked conversions spend down the Roth balance.
 */
export const buildRetirementIncomePlan = (
  input: RetirementIncomePlanInput,
): RetirementIncomePlan => {
  const {
    accounts,
    currentAge,
    retirementAge,
    endAge,
    annualExpenses,
    inflationRatePercent,
    useInflationAdjustedValues,
    marketAdjustmentPercent = 0,
    currentYear = new Date().getFullYear(),
    hsaReceiptBalance,
    conversionBuckets,
  } = input;

  const empty: RetirementIncomePlan = {
    rows: [],
    totalPenaltyExposure: 0,
    totalShortfall: 0,
    firstShortfallAge: null,
    endingPortfolioBalance: 0,
  };
  if (!(retirementAge < endAge)) return empty;

  const taxableAccounts = accounts.filter(
    (a) => !isCombinedAssetType(a.accountType) && !isLiabilityAccountType(a.accountType)
      && TAXABLE_TYPES.has(a.accountType),
  );
  const pretaxAccounts = accounts.filter(
    (a) => !isCombinedAssetType(a.accountType) && !isLiabilityAccountType(a.accountType)
      && PRETAX_TYPES.has(a.accountType),
  );
  const rothAccounts = accounts.filter((a) => a.accountType === 'roth-ira');
  const hsaAccounts = accounts.filter((a) => a.accountType === 'hsa');

  const pools: SourcePools = {
    taxable: taxableAccounts.map((a) => clamp(a.startingBalance)),
    pretax: pretaxAccounts.map((a) => clamp(a.startingBalance)),
    roth: clamp(rothAccounts.reduce((sum, a) => sum + a.startingBalance, 0)),
    hsa: clamp(hsaAccounts.reduce((sum, a) => sum + a.startingBalance, 0)),
  };
  let receiptBalance = clamp(hsaReceiptBalance);
  // Each conversion bucket's clock is checked against the calendar year; the
  // clocked pool is consumed oldest-first and never exceeds the Roth balance.
  const bucketUnlockYear = conversionBuckets.map((b) => Number(b.availableOn.slice(0, 4)));
  let clockedUsed = 0;

  const rows: RetirementIncomeRow[] = [];
  let totalPenaltyExposure = 0;
  let totalShortfall = 0;
  let firstShortfallAge: number | null = null;

  const grows = (ratePercent: number) => {
    const eff =
      getEffectiveAnnualRatePercent(ratePercent + marketAdjustmentPercent, inflationRatePercent, useInflationAdjustedValues) / 100;
    return 1 + eff;
  };
  const taxableGrowth = taxableAccounts.map((a) => grows(a.annualRate));
  const pretaxGrowth = pretaxAccounts.map((a) => grows(a.annualRate));
  const rothGrowth = grows(rothAccounts[0]?.annualRate ?? 0);
  const hsaGrowth = grows(hsaAccounts[0]?.annualRate ?? 0);

  const totalYears = endAge - currentAge;
  for (let year = 1; year <= totalYears; year++) {
    const age = currentAge + year;
    // Grow every pool one year (a retirement year's growth lands before its
    // spending, matching the projection engine's growth-then-withdraw order).
    pools.taxable = pools.taxable.map((b, i) => b * taxableGrowth[i]);
    pools.pretax = pools.pretax.map((b, i) => b * pretaxGrowth[i]);
    pools.roth *= rothGrowth;
    pools.hsa *= hsaGrowth;

    if (age <= retirementAge) continue;

    const calendarYear = currentYear + year;
    // Mirror the projection engine: a constant lifestyle is flat in real mode;
    // in nominal mode withdrawals grow with inflation.
    const expenseInflator = useInflationAdjustedValues
      ? 1
      : (1 + inflationRatePercent / 100) ** (year - 1);
    let need = annualExpenses * expenseInflator;
    let penaltyExposure = 0;

    // 1. HSA receipts — tax-free, any age, capped by the HSA account itself.
    const hsaTake = Math.min(need, receiptBalance, pools.hsa);
    receiptBalance -= hsaTake;
    pools.hsa -= hsaTake;
    need -= hsaTake;

    // 2. Taxable accounts, proportional to balance.
    const taxableTotal = groupTotal(pools.taxable);
    const taxableTake = Math.min(need, taxableTotal);
    if (taxableTake > 0 && taxableTotal > 0) {
      pools.taxable = pools.taxable.map((b) => {
        const share = taxableTotal > 0 ? b / taxableTotal : 0;
        return Math.max(0, b - taxableTake * share);
      });
      need -= taxableTake;
    }

    // 3. Pre-tax accounts, proportional to balance; penalized before 59½.
    const pretaxTotal = groupTotal(pools.pretax);
    const pretaxTake = Math.min(need, pretaxTotal);
    if (pretaxTake > 0 && pretaxTotal > 0) {
      pools.pretax = pools.pretax.map((b) => {
        const share = pretaxTotal > 0 ? b / pretaxTotal : 0;
        return Math.max(0, b - pretaxTake * share);
      });
      need -= pretaxTake;
      if (age < PENALTY_FREE_AGE) penaltyExposure += pretaxTake * PENALTY_RATE_BEFORE_AGE;
    }

    // 4. Clocked conversions — penalty-free once five years have passed.
    const clockedAvailable = conversionBuckets.reduce(
      (sum, bucket, i) =>
        bucketUnlockYear[i] <= calendarYear ? sum + clamp(bucket.amount) : sum,
      0,
    ) - clockedUsed;
    const rothClockedTake = Math.min(need, Math.max(0, clockedAvailable), pools.roth);
    clockedUsed += rothClockedTake;
    pools.roth -= rothClockedTake;
    need -= rothClockedTake;

    // 5. Remaining Roth — before 59½ this is the earnings/basis mix, so flag it.
    const rothOtherTake = Math.min(need, Math.max(0, pools.roth));
    pools.roth -= rothOtherTake;
    need -= rothOtherTake;
    if (rothOtherTake > 0 && age < PENALTY_FREE_AGE) {
      penaltyExposure += rothOtherTake * PENALTY_RATE_BEFORE_AGE;
    }

    const shortfall = Math.max(0, need);
    totalPenaltyExposure += penaltyExposure;
    totalShortfall += shortfall;
    if (shortfall > 0 && firstShortfallAge === null) firstShortfallAge = age;

    rows.push({
      age,
      year: calendarYear,
      expense: annualExpenses * expenseInflator,
      hsaReceipts: hsaTake,
      taxable: taxableTake,
      pretax: pretaxTake,
      rothClocked: rothClockedTake,
      rothOther: rothOtherTake,
      shortfall,
      penaltyExposure,
      taxableBalance: groupTotal(pools.taxable),
      pretaxBalance: groupTotal(pools.pretax),
      rothBalance: pools.roth,
      hsaBalance: pools.hsa,
      receiptBalance,
    });
  }

  return {
    rows,
    totalPenaltyExposure,
    totalShortfall,
    firstShortfallAge,
    endingPortfolioBalance: groupTotal(pools.taxable) + groupTotal(pools.pretax) + pools.roth,
  };
};
