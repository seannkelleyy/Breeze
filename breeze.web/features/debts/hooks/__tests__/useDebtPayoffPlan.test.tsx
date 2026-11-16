import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { requestMock, userState } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  userState: { userId: 'u1' as string | null, payoffStrategy: 'AVALANCHE' as 'AVALANCHE' | 'SNOWBALL' },
}));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

import { useDebtPayoffPlan } from '../useDebtPayoffPlan';

const liabilityDto = (overrides: Record<string, unknown> = {}) => ({
  id: 'cc1',
  name: 'Visa',
  liabilityType: 'CREDIT_CARD',
  currentBalance: '1000',
  interestRate: '0.2',
  minimumPayment: '50',
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

describe('useDebtPayoffPlan', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
    userState.payoffStrategy = 'AVALANCHE';
  });

  it('maps liabilities to payoff debts, dropping zero balances', async () => {
    requestMock.mockResolvedValue({
      liabilities: [
        liabilityDto(),
        liabilityDto({ id: 'cc2', name: 'Paid Card', currentBalance: '0' }),
      ],
    });

    const { result } = renderHook(() => useDebtPayoffPlan(0), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.debts).toHaveLength(1);
    expect(result.current.debts[0]).toMatchObject({
      id: 'cc1',
      name: 'Visa',
      balance: 1000,
      // API rates arrive as fractions; the payoff math wants percent.
      annualRatePercent: 20,
      minimumPayment: 50,
    });
  });

  it('computes a payoff plan under the selected strategy and extra payment', async () => {
    requestMock.mockResolvedValue({ liabilities: [liabilityDto()] });

    const { result } = renderHook(() => useDebtPayoffPlan(200), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const { plan } = result.current;
    expect(plan.strategy).toBe('AVALANCHE');
    expect(plan.debtFreeMonth).not.toBeNull();
    expect(plan.totalInterest).toBeGreaterThan(0);
    expect(plan.order).toEqual(['cc1']);
  });

  it('passes the user to the liabilities query', async () => {
    requestMock.mockResolvedValue({ liabilities: [] });

    const { result } = renderHook(() => useDebtPayoffPlan(0), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requestMock.mock.calls[0][1]).toEqual({ userId: 'u1' });
  });

  it('does not fetch without a user', () => {
    userState.userId = null;

    renderHook(() => useDebtPayoffPlan(0), { wrapper: createWrapper() });

    expect(requestMock).not.toHaveBeenCalled();
  });
});
