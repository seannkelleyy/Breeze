import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import {
  useLinkAssetToPlaidAccount,
  useLinkLiabilityToPlaidAccount,
  useUnlinkAssetFromPlaidAccount,
  useUnlinkLiabilityFromPlaidAccount,
} from '../usePlaidLinking';

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

const operationName = (document: unknown) => print(document as never);

describe('usePlaidLinking', () => {
  beforeEach(() => {
    requestMock.mockReset().mockResolvedValue({});
  });

  it('links an asset to a Plaid account', async () => {
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useLinkAssetToPlaidAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ assetId: 'a1', plaidAccountId: 'pa1' });
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      assetId: 'a1',
      plaidAccountId: 'pa1',
    });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('LinkAssetToPlaidAccount');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['planner'] });
  });

  it('unlinks an asset from a Plaid account', async () => {
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useUnlinkAssetFromPlaidAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('a1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { assetId: 'a1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['planner'] });
  });

  it('links a liability to a Plaid account', async () => {
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useLinkLiabilityToPlaidAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ liabilityId: 'l1', plaidAccountId: 'pa1' });
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      liabilityId: 'l1',
      plaidAccountId: 'pa1',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['planner'] });
  });

  it('unlinks a liability from a Plaid account', async () => {
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useUnlinkLiabilityFromPlaidAccount(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('l1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { liabilityId: 'l1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['planner'] });
  });
});
