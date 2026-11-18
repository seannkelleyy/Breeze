'use client';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerHydration } from '@/features/planning/hooks/usePlannerHydration';
import { usePlannerState } from '@/features/planning/providers/PlannerStateProvider';
import { usePaycheckDeductions } from '@/features/planning/hooks/planner/usePaycheckDeductions';
import useTaxYear from '@/features/planning/hooks/planner/useTaxYear';
import { computeHouseholdWaterfall } from '@/features/planning/lib/paycheck';
import { computeTaxScenario, householdPretaxReductions } from '../lib/taxScenario';
import { getWealthByTaxTreatment } from '../lib/wealthByTaxTreatment';
import { ADDITIONAL_MEDICARE_THRESHOLDS } from '@/lib/calc/payrollWages';

/**
 * Builds the household tax scenario from planner data: the per-person paycheck
 * waterfall, the with/without pre-tax accounts comparison, and the current
 * wealth split by tax treatment.
 */
export function useHouseholdTaxScenario() {
  const { filingStatus, deductionType } = useCurrentUser();
  usePlannerHydration();
  const { plannerPeople, plannerAccounts } = usePlannerState();
  const { deductions: withholdings } = usePaycheckDeductions(null);
  const taxTables = useTaxYear(filingStatus);

  const scenario = (() => {
    if (!taxTables || plannerPeople.length === 0) return null;
    const waterfall = computeHouseholdWaterfall(
      plannerPeople,
      plannerAccounts,
      withholdings,
      taxTables,
      deductionType,
    );
    const grossIncome = waterfall.grossMonthly * 12;
    const reductions = householdPretaxReductions(waterfall);
    return {
      waterfall,
      baseline: computeTaxScenario(
        'Without tax-advantaged accounts',
        grossIncome,
        0,
        0,
        taxTables,
        deductionType,
        ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus] ?? Number.POSITIVE_INFINITY,
      ),
      current: computeTaxScenario(
        'Your setup today',
        grossIncome,
        reductions.incomeTax,
        reductions.ficaExempt,
        taxTables,
        deductionType,
        ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus] ?? Number.POSITIVE_INFINITY,
      ),
    };
  })();

  const wealth = getWealthByTaxTreatment(plannerAccounts);

  return {
    waterfall: scenario?.waterfall,
    baseline: scenario?.baseline,
    current: scenario?.current,
    wealth,
    taxTables,
    isLoading: !scenario || !taxTables,
    hasHousehold: plannerPeople.length > 0,
  };
}
