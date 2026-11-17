import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import { useRetirementLadder } from '../useRetirementLadder';
import type { CalculateRetirementLadderInput } from '../useRetirementLadder';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

const input: CalculateRetirementLadderInput = {
  initialBalance: '500000',
  annualExpenses: '40000',
  currentAge: 40,
  firstWithdrawalAge: 65,
  isRoth: true,
  year: 2026,
  filingStatus: 'SINGLE' as CalculateRetirementLadderInput['filingStatus'],
};

describe('useRetirementLadder', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('does not call the API until explicitly enabled', () => {
    renderHook(() => useRetirementLadder(input), { wrapper: createWrapper() });

    expect(requestMock).not.toHaveBeenCalled();
  });

  it('does not call the API without input', () => {
    renderHook(() => useRetirementLadder(null, true), { wrapper: createWrapper() });

    expect(requestMock).not.toHaveBeenCalled();
  });

  it('passes the ladder input through and returns the projection', async () => {
    const projection = { years: [{ age: 40, balance: '500000' }] };
    requestMock.mockResolvedValue({ calculateRetirementLadder: projection });

    const { result } = renderHook(() => useRetirementLadder(input, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(projection));
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), input);
  });

  it('surfaces query errors', async () => {
    requestMock.mockRejectedValue(new Error('ladder failed'));

    const { result } = renderHook(() => useRetirementLadder(input, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe('ladder failed');
  });
});
