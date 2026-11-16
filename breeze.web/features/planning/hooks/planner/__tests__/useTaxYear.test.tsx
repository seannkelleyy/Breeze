import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import useTaxYear from '../useTaxYear';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

const taxYearDto = {
  year: 2026,
  brackets: [
    { minimumAmount: '0', maximumAmount: '11600', rate: '0.10' },
    { minimumAmount: '11600', maximumAmount: null, rate: '0.12' },
  ],
  standardDeduction: '15000',
  ssWageBase: '176100',
};

describe('useTaxYear', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('maps API tax tables into numeric rows for the filing status', async () => {
    requestMock.mockResolvedValue({ taxYearData: taxYearDto });

    const { result } = renderHook(() => useTaxYear('SINGLE'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current).toEqual({
      year: 2026,
      brackets: [
        { minimum: 0, maximum: 11600, rate: 0.1 },
        { minimum: 11600, maximum: null, rate: 0.12 },
      ],
      standardDeduction: 15000,
      ssWageBase: 176100,
    });
    expect(requestMock.mock.calls[0][1]).toEqual({ filingStatus: 'SINGLE' });
  });

  it('returns null while the reference data is missing', async () => {
    requestMock.mockResolvedValue({ taxYearData: null });

    const { result } = renderHook(() => useTaxYear('MFJ'), { wrapper: createWrapper() });

    await waitFor(() => expect(requestMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current).toBeNull());
    expect(requestMock.mock.calls[0][1]).toEqual({ filingStatus: 'MFJ' });
  });
});
