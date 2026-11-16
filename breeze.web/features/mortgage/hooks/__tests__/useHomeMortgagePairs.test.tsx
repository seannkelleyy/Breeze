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

import { useHomeMortgagePairs } from '../useHomeMortgagePairs';

const assetDto = (overrides: Record<string, unknown> = {}) => ({
  id: 'home1',
  name: 'Primary Home',
  assetType: 'HOME',
  currentValue: '625000',
  linkedLiabilityId: 'mort1',
  homeGrowthProfile: 'high',
  ...overrides,
});

const liabilityDto = (overrides: Record<string, unknown> = {}) => ({
  id: 'mort1',
  name: 'Primary Mortgage',
  liabilityType: 'MORTGAGE',
  currentBalance: '410000',
  interestRate: '0.0625',
  minimumPayment: '2850',
  originalLoanAmount: '450000',
  ...overrides,
});

const mockResponses = ({
  assets,
  liabilities,
}: {
  assets: Array<Record<string, unknown>>;
  liabilities: Array<Record<string, unknown>>;
}) => {
  requestMock.mockImplementation((document) => {
    const text = print(document);
    if (text.includes('liabilities')) return Promise.resolve({ liabilities });
    return Promise.resolve({ assets });
  });
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('useHomeMortgagePairs', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('pairs a HOME asset with its linked MORTGAGE liability', async () => {
    mockResponses({ assets: [assetDto()], liabilities: [liabilityDto()] });

    const { result } = renderHook(() => useHomeMortgagePairs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const pairs = result.current.data ?? [];
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({
      id: 'home1',
      label: 'Primary Home',
      mortgageBalance: 410000,
      originalLoanAmount: 450000,
      // API rates arrive as fractions; the tools want percent.
      interestRate: 6.25,
      monthlyPayment: 2850,
      homeValue: 625000,
      homeAnnualGrowthRate: 6,
    });
    expect(pairs[0].remainingMonths).toBeGreaterThan(0);
  });

  it('skips HOME assets without a linked MORTGAGE and non-HOME assets', async () => {
    mockResponses({
      assets: [
        assetDto({ id: 'home2', name: 'Rental', linkedLiabilityId: null }),
        assetDto({ id: 'car', name: 'Car', assetType: 'VEHICLE', linkedLiabilityId: 'auto1' }),
        assetDto({ id: 'home3', name: 'Condo', linkedLiabilityId: 'auto1' }),
      ],
      liabilities: [
        liabilityDto({ id: 'auto1', liabilityType: 'AUTO_LOAN', currentBalance: '20000' }),
      ],
    });

    const { result } = renderHook(() => useHomeMortgagePairs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it('falls back to the medium growth profile for unknown values', async () => {
    mockResponses({
      assets: [assetDto({ homeGrowthProfile: 'unknown-profile' })],
      liabilities: [liabilityDto()],
    });

    const { result } = renderHook(() => useHomeMortgagePairs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.[0].homeAnnualGrowthRate).toBe(4);
  });

  it('does not fetch without a user', () => {
    userState.userId = null;

    renderHook(() => useHomeMortgagePairs(), { wrapper: createWrapper() });

    expect(requestMock).not.toHaveBeenCalled();
  });
});
