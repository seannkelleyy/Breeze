import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import { useTaxEstimate } from '../useTaxEstimate';
import type { CalculateTaxEstimateInput } from '../useTaxEstimate';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

const input: CalculateTaxEstimateInput = {
  year: 2026,
  filingStatus: 'SINGLE' as CalculateTaxEstimateInput['filingStatus'],
  income: '120000',
  deduction: '15000',
};

describe('useTaxEstimate', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('does not call the API until explicitly enabled', () => {
    renderHook(() => useTaxEstimate(input), { wrapper: createWrapper() });

    expect(requestMock).not.toHaveBeenCalled();
  });

  it('does not call the API without input', () => {
    renderHook(() => useTaxEstimate(null, true), { wrapper: createWrapper() });

    expect(requestMock).not.toHaveBeenCalled();
  });

  it('passes the estimate input through and returns the result', async () => {
    const estimate = { taxableIncome: '105000', tax: '18000' };
    requestMock.mockResolvedValue({ estimateTaxesForYear: estimate });

    const { result } = renderHook(() => useTaxEstimate(input, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(estimate));
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), input);
  });
});
