import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

import type { PlannerAccount } from '@/features/planning/types/account';

const { requestMock, updateAccount, removeAccount } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  updateAccount: vi.fn(),
  removeAccount: vi.fn(),
}));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import { useAccountMutations } from '../useAccountMutations';

const account = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'a1',
  name: 'Checking',
  personIds: ['p1'],
  accountType: 'checking',
  contributionMode: 'monthly',
  contributionValue: 250,
  employerMatchRate: 5,
  employerMatchMaxPercentOfSalary: 4,
  startingBalance: 10000,
  annualRate: 6,
  returnProfile: null,
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
  ...overrides,
});

const liability = (overrides: Partial<PlannerAccount> = {}): PlannerAccount =>
  account({
    id: 'l1',
    name: 'Student Loan',
    accountType: 'student-loan',
    startingBalance: 25000,
    annualRate: 5.5,
    contributionValue: 400,
    originalLoanAmount: 30000,
    ...overrides,
  });

const operationName = (document: unknown) => print(document as never);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: QueryWrapper, invalidateSpy };
};

const renderMutations = () => {
  const { wrapper, invalidateSpy } = createWrapper();
  return {
    invalidateSpy,
    ...renderHook(() => useAccountMutations({ userId: 'u1', updateAccount, removeAccount }), {
      wrapper,
    }),
  };
};

describe('useAccountMutations', () => {
  beforeEach(() => {
    requestMock.mockReset();
    updateAccount.mockReset();
    removeAccount.mockReset();
  });

  it('creates an asset and swaps the local id for the API id', async () => {
    requestMock.mockResolvedValue({ createAsset: { id: 'saved-a1' } });
    const { result } = renderMutations();

    await act(async () => {
      await result.current.createAssetMutation.mutateAsync(account());
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        name: 'Checking',
        assetType: 'CHECKING',
        currentValue: '10000',
        contributionMode: 'monthly',
        contributionValue: '250',
        employerMatchRate: '0.05',
        employerMatchMaxPercentOfSalary: '0.04',
        annualRate: '0.06',
        returnProfile: null,
        taxTreatment: 'PRE_TAX',
        pretaxSharePercent: null,
        personIds: ['p1'],
        purchaseDate: null,
        purchasePrice: null,
        homeGrowthProfile: null,
        vehicleDepreciationProfile: null,
        linkedLiabilityId: null,
      },
    });
    expect(updateAccount).toHaveBeenCalledWith('a1', expect.any(Function));
    const updater = updateAccount.mock.calls[0][1] as (current: PlannerAccount) => PlannerAccount;
    expect(updater(account()).id).toBe('saved-a1');
  });

  it('updates an asset with the same mapped fields', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderMutations();

    await act(async () => {
      await result.current.updateAssetMutation.mutateAsync(account({ name: 'Main Checking' }));
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: expect.objectContaining({ id: 'a1', name: 'Main Checking', assetType: 'CHECKING' }),
    });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('UpdateAsset');
  });

  it('creates a liability and swaps the local id for the API id', async () => {
    requestMock.mockResolvedValue({ createLiability: { id: 'saved-l1' } });
    const { result } = renderMutations();

    await act(async () => {
      await result.current.createLiabilityMutation.mutateAsync(liability());
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        name: 'Student Loan',
        liabilityType: 'STUDENT_LOAN',
        currentBalance: '25000',
        originalLoanAmount: '30000',
        interestRate: '0.0550',
        minimumPayment: '400',
        targetExtraPayment: '0',
        payoffPriority: 0,
        contributionMode: 'monthly',
        contributionValue: '400',
        personIds: ['p1'],
      },
    });
    expect(updateAccount).toHaveBeenCalledWith('l1', expect.any(Function));
  });

  it('updates a liability without sending the user id', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderMutations();

    await act(async () => {
      await result.current.updateLiabilityMutation.mutateAsync(liability({ name: 'Loan' }));
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: expect.objectContaining({ id: 'l1', name: 'Loan', liabilityType: 'STUDENT_LOAN' }),
    });
    const { input } = requestMock.mock.calls[0][1] as { input: Record<string, unknown> };
    expect(input).not.toHaveProperty('userId');
  });

  it('removes an asset locally after deleting it', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderMutations();

    await act(async () => {
      await result.current.deleteAssetMutation.mutateAsync('a1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'a1' });
    expect(removeAccount).toHaveBeenCalledWith('a1');
  });

  it('removes a liability locally after deleting it', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderMutations();

    await act(async () => {
      await result.current.deleteLiabilityMutation.mutateAsync('l1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'l1' });
    expect(removeAccount).toHaveBeenCalledWith('l1');
  });

  it('invalidates the user’s planner query', () => {
    const { result, invalidateSpy } = renderMutations();

    result.current.invalidatePlanner();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['planner', 'u1'] });
  });
});
