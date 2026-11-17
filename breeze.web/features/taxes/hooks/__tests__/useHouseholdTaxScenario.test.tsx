import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const {
  userState,
  plannerState,
  deductionsState,
  taxYearState,
  waterfallMock,
  reductionsMock,
  scenarioMock,
  wealthMock,
} = vi.hoisted(() => ({
  userState: { filingStatus: 'single', deductionType: 'standard' },
  plannerState: {
    plannerPeople: [] as Array<{ id: string }>,
    plannerAccounts: [] as Array<{ id: string }>,
  },
  deductionsState: { deductions: [] as unknown[] },
  taxYearState: { tables: { brackets: [] } as unknown },
  waterfallMock: vi.fn(),
  reductionsMock: vi.fn(),
  scenarioMock: vi.fn(),
  wealthMock: vi.fn(),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

vi.mock('@/features/planning/hooks/usePlannerHydration', () => ({
  usePlannerHydration: () => {},
}));

vi.mock('@/features/planning/providers/PlannerStateProvider', () => ({
  usePlannerState: () => plannerState,
}));

vi.mock('@/features/planning/hooks/planner/usePaycheckDeductions', () => ({
  usePaycheckDeductions: () => deductionsState,
}));

vi.mock('@/features/planning/hooks/planner/useTaxYear', () => ({
  default: () => taxYearState.tables,
}));

vi.mock('@/features/planning/lib/paycheck', () => ({
  computeHouseholdWaterfall: waterfallMock,
}));

vi.mock('@/features/taxes/lib/taxScenario', () => ({
  computeTaxScenario: scenarioMock,
  householdPretaxReductions: reductionsMock,
}));

vi.mock('@/features/taxes/lib/wealthByTaxTreatment', () => ({
  getWealthByTaxTreatment: wealthMock,
}));

import { useHouseholdTaxScenario } from '../useHouseholdTaxScenario';

describe('useHouseholdTaxScenario', () => {
  beforeEach(() => {
    plannerState.plannerPeople = [{ id: 'p1' }];
    plannerState.plannerAccounts = [{ id: 'a1' }];
    deductionsState.deductions = [{ id: 'd1' }];
    taxYearState.tables = { brackets: [] };
    waterfallMock.mockReset().mockReturnValue({ grossMonthly: 10000 });
    reductionsMock.mockReset().mockReturnValue({ incomeTax: 1000, ficaExempt: 500 });
    scenarioMock.mockReset().mockImplementation((label) => ({ label }));
    wealthMock.mockReset().mockReturnValue([{ treatment: 'PRE_TAX', amount: 1000 }]);
  });

  it('stays loading until tax tables are available', () => {
    taxYearState.tables = null;
    const { result } = renderHook(() => useHouseholdTaxScenario());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.waterfall).toBeUndefined();
    expect(result.current.baseline).toBeUndefined();
    expect(result.current.current).toBeUndefined();
  });

  it('stays loading when the household has no people', () => {
    plannerState.plannerPeople = [];
    const { result } = renderHook(() => useHouseholdTaxScenario());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasHousehold).toBe(false);
  });

  it('builds baseline and current scenarios from the paycheck waterfall', () => {
    const { result } = renderHook(() => useHouseholdTaxScenario());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasHousehold).toBe(true);
    expect(result.current.waterfall).toEqual({ grossMonthly: 10000 });
    expect(waterfallMock).toHaveBeenCalledWith(
      plannerState.plannerPeople,
      plannerState.plannerAccounts,
      deductionsState.deductions,
      taxYearState.tables,
      'standard',
    );

    expect(scenarioMock.mock.calls[0].slice(0, 3)).toEqual([
      'Without tax-advantaged accounts',
      120000,
      0,
    ]);
    expect(reductionsMock).toHaveBeenCalledWith({ grossMonthly: 10000 });
    expect(scenarioMock.mock.calls[1].slice(0, 4)).toEqual(['Your setup today', 120000, 1000, 500]);
    expect(result.current.current).toEqual({ label: 'Your setup today' });
  });

  it('exposes the wealth split by tax treatment', () => {
    const { result } = renderHook(() => useHouseholdTaxScenario());

    expect(wealthMock).toHaveBeenCalledWith(plannerState.plannerAccounts);
    expect(result.current.wealth).toEqual([{ treatment: 'PRE_TAX', amount: 1000 }]);
    expect(result.current.taxTables).toBe(taxYearState.tables);
  });
});
