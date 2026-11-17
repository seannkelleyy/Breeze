import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

const { requestMock, userState } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  userState: { userId: 'u1' as string | null },
}));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

import useFetchPlanner from '../useFetchPlanner';

const operationName = (document: unknown) => print(document as never);

const asset = {
  id: 'a1',
  name: 'Roth IRA',
  personIds: ['p1'],
  assetType: 'ROTH_IRA',
  contributionMode: 'monthly',
  contributionValue: '500.00',
  employerMatchRate: '0.05',
  employerMatchMaxPercentOfSalary: '0.04',
  currentValue: '12000.00',
  annualRate: '0.07',
  returnProfile: 'aggressive',
  taxTreatment: 'ROTH',
  pretaxSharePercent: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: null,
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  plaidAccountId: null,
  lastValueUpdatedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const liability = {
  id: 'l1',
  name: 'Student Loan',
  personIds: ['p1'],
  liabilityType: 'STUDENT_LOAN',
  contributionMode: 'monthly',
  contributionValue: '400.00',
  currentBalance: '25000.00',
  interestRate: '0.055',
  plaidAccountId: null,
  lastBalanceUpdatedAt: null,
  originalLoanAmount: '30000.00',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const plannerPerson = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Alex',
  birthday: '1986-01-01',
  retirementAge: 65,
  annualSalary: '100000',
  bonusMode: 'salary-percent',
  bonusFrequency: 'quarterly',
  annualBonus: '5000',
  incomeGrowthRate: '3',
  payType: 'salary',
  payDay: 15,
  payCadence: 'monthly',
  hourlyRate: '0',
  expectedHoursPerWeek: '0',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('useFetchPlanner', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
    requestMock.mockImplementation((document) => {
      const name = operationName(document);
      if (name.includes('MeQuery') || name.includes('Me')) {
        return Promise.resolve({
          me: {
            inflationRate: '0.03',
            safeWithdrawalRate: '0.04',
            currencyType: 'CAD',
            returnType: 'NOMINAL',
          },
        });
      }
      if (name.includes('PlannerPeople')) {
        return Promise.resolve({
          plannerPeople: [plannerPerson(), plannerPerson({ id: 'p2', name: 'Sam' })],
        });
      }
      if (name.includes('GetAssetsByUser')) {
        return Promise.resolve({ assets: [asset] });
      }
      if (name.includes('GetLiabilitiesByUser')) {
        return Promise.resolve({ liabilities: [liability] });
      }
      return Promise.resolve({});
    });
  });

  it('does not fetch without a user', () => {
    userState.userId = null;
    const { result } = renderHook(() => useFetchPlanner(), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('maps people, assets, liabilities, and preferences', async () => {
    const { result } = renderHook(() => useFetchPlanner(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    const data = result.current.data!;

    expect(data.people).toHaveLength(2);
    expect(data.people[0]).toMatchObject({
      id: 'p1',
      annualSalary: 100000,
      annualBonus: 5000,
      bonusMode: 'salary-percent',
      bonusFrequency: 'quarterly',
      isPrimary: true,
    });
    expect(data.people[1].isPrimary).toBe(false);

    expect(data.accounts).toHaveLength(2);
    const [mappedAsset, mappedLiability] = data.accounts;
    expect(mappedAsset).toMatchObject({
      id: 'a1',
      accountType: 'roth-ira',
      startingBalance: 12000,
      contributionValue: 500,
      employerMatchRate: 5,
      employerMatchMaxPercentOfSalary: 4,
      taxTreatment: 'ROTH',
    });
    expect(mappedAsset.annualRate).toBeCloseTo(7);
    expect(mappedLiability).toMatchObject({
      id: 'l1',
      accountType: 'student-loan',
      startingBalance: 25000,
      annualRate: 5.5,
      originalLoanAmount: 30000,
    });

    expect(data.inflationRate).toBe(3);
    expect(data.safeWithdrawalRate).toBe(4);
    expect(data.currencyCode).toBe('CAD');
    expect(data.returnDisplayMode).toBe('nominal');
  });

  it('falls back to defaults when the user profile is missing', async () => {
    requestMock.mockImplementation((document) => {
      const name = operationName(document);
      if (name.includes('Me')) return Promise.resolve({ me: null });
      if (name.includes('PlannerPeople')) return Promise.resolve({ plannerPeople: [] });
      if (name.includes('GetAssetsByUser')) return Promise.resolve({ assets: [] });
      return Promise.resolve({ liabilities: [] });
    });

    const { result } = renderHook(() => useFetchPlanner(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({
      inflationRate: 3,
      safeWithdrawalRate: 4,
      currencyCode: 'USD',
      returnDisplayMode: 'real',
    });
    expect(result.current.data?.accounts).toEqual([]);
  });
});
