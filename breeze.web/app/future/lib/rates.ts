/**
 * Rate conversions between nominal and real (inflation-adjusted) values,
 * account rate profiles, and asset growth/depreciation rate lookups.
 */
import type { AccountRateProfile, PlannerAccount } from '../types/account';
import * as plannerConstants from './constants';

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
