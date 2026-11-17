import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import useIrsLimits from '../useIrsLimits';
import { defaultIrsLimits } from '@/features/planning/lib/plannerMath';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

const limitRow = (overrides: Record<string, unknown> = {}) => ({
  accountType: 'ACCOUNT_401K',
  annualLimit: '23500',
  catchUpAmount: '7500',
  catchUpAge: 50,
  familyAnnualLimit: null,
  ...overrides,
});

describe('useIrsLimits', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('maps API limit rows onto the planner configuration', async () => {
    requestMock.mockResolvedValue({
      contributionLimits: [
        limitRow(),
        limitRow({ accountType: 'HSA', annualLimit: '4300', familyAnnualLimit: '8550' }),
        limitRow({ accountType: 'UNKNOWN', annualLimit: '999999' }),
      ],
    });

    const { result } = renderHook(() => useIrsLimits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isIrsAccountsLoading).toBe(false));
    expect(result.current.irsLimits['401k']).toMatchObject({
      baseAnnualLimit: 23500,
      catchUpAmount: 7500,
      catchUpAge: 50,
    });
    expect(result.current.irsLimits.hsa).toMatchObject({
      baseAnnualLimit: 4300,
      familyAnnualLimit: 8550,
      superCatchUpAmount: defaultIrsLimits.hsa.superCatchUpAmount,
    });
  });

  it('falls back to bundled limits when the API has no rows', async () => {
    requestMock.mockResolvedValue({ contributionLimits: [] });
    const { result } = renderHook(() => useIrsLimits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isIrsAccountsLoading).toBe(false));
    expect(result.current.irsLimits).toEqual(defaultIrsLimits);
  });

  it('renders bundled limits while the query is loading', async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    requestMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result } = renderHook(() => useIrsLimits(), { wrapper: createWrapper() });

    expect(result.current.isIrsAccountsLoading).toBe(true);
    expect(result.current.irsLimits).toEqual(defaultIrsLimits);

    await act(async () => {
      resolveRequest({ contributionLimits: [] });
    });
    await waitFor(() => expect(result.current.isIrsAccountsLoading).toBe(false));
  });

  it('falls back to bundled limits when the query fails', async () => {
    requestMock.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useIrsLimits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isIrsAccountsError).toBe(true));
    expect(result.current.irsLimits).toEqual(defaultIrsLimits);
  });
});
