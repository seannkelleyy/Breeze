'use client';
import { useMemo } from 'react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useTaxYear from './useTaxYear';
import { getEffectiveTaxRate } from '../../lib/tax';
import { getEmployeeMonthlyContribution, getPersonTotalIncome } from '../../lib/plannerMath';
import type { AccountType, PlannerAccount } from '../../types/account';
import type { PlannerPerson } from '../../types/person';

// Contributions to these accounts reduce taxable income.
const PRE_TAX_ACCOUNT_TYPES = new Set<AccountType>(['401k', '403b', '457', 'hsa']);

export interface HouseholdIncomeBreakdown {
  /** Base pay + bonuses, before any deductions. */
  grossAnnual: number;
  /** 401(k)/403(b)/457/HSA employee contributions per year (reduce taxable income). */
  preTaxAnnual: number;
  taxableAnnual: number;
  taxAnnual: number;
  /** What actually lands in bank accounts across the year. */
  netAnnual: number;
  effectiveRate: number;
  /** netAnnual / grossAnnual — scales gross figures down to planning (net) figures. */
  netRatio: number;
}

/**
 * Estimates the household's gross → net income waterfall from tracked people,
 * salaries, and pre-tax contribution accounts (401(k)/403(b)/457/HSA).
 */
export function useHouseholdIncomeBreakdown(
  people: PlannerPerson[],
  accounts: PlannerAccount[],
): HouseholdIncomeBreakdown {
  const { filingStatus, deductionType } = useCurrentUser();
  const taxTables = useTaxYear(filingStatus);

  return useMemo(() => {
    const grossAnnual = people.reduce((sum, p) => sum + getPersonTotalIncome(p), 0);
    const preTaxAnnual = accounts
      .filter((a) => PRE_TAX_ACCOUNT_TYPES.has(a.accountType))
      .reduce((sum, a) => sum + getEmployeeMonthlyContribution(a, people) * 12, 0);

    const taxableAnnual = Math.max(0, grossAnnual - preTaxAnnual);
    const effectiveRate = taxTables
      ? getEffectiveTaxRate(taxableAnnual, taxTables, deductionType).effectiveRate
      : 1 - PLANNER_NEUTRAL_FALLBACK;
    const taxAnnual = taxableAnnual * effectiveRate;
    const netAnnual = grossAnnual - preTaxAnnual - taxAnnual;
    const netRatio = grossAnnual > 0 ? netAnnual / grossAnnual : 1;

    return {
      grossAnnual,
      preTaxAnnual,
      taxableAnnual,
      taxAnnual,
      netAnnual,
      effectiveRate,
      netRatio,
    };
  }, [people, accounts, taxTables, deductionType]);
}

// Neutral take-home factor while tax tables load (matches lib/tax fallback).
const PLANNER_NEUTRAL_FALLBACK = 0.2;
