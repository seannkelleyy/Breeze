import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import {
  useCreateLinkToken,
  useDeletePlaidConnection,
  useExchangePlaidToken,
  usePlaidAccounts,
  usePlaidConnections,
  useSyncPlaidConnection,
} from '../usePlaid';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: QueryWrapper, invalidateSpy };
};

const operationName = (document: unknown) => print(document as never);

describe('usePlaid', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('creates a link token', async () => {
    requestMock.mockResolvedValue({ createPlaidLinkToken: { linkToken: 'link-1' } });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateLinkToken(), { wrapper });

    let token: unknown;
    await act(async () => {
      token = await result.current.mutateAsync();
    });

    expect(token).toEqual({ linkToken: 'link-1' });
    expect(requestMock).toHaveBeenCalledWith(expect.anything());
    expect(operationName(requestMock.mock.calls[0][0])).toContain('CreatePlaidLinkToken');
  });

  it('exchanges a public token and refreshes connections', async () => {
    requestMock.mockResolvedValue({ exchangePlaidPublicToken: { id: 'c1' } });
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useExchangePlaidToken(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ publicToken: 'public-1' });
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { publicToken: 'public-1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plaidConnections'] });
  });

  it('syncs a connection and refreshes its accounts', async () => {
    requestMock.mockResolvedValue({});
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useSyncPlaidConnection(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('c1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'c1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plaidAccounts'] });
  });

  it('deletes a connection and refreshes connections', async () => {
    requestMock.mockResolvedValue({});
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useDeletePlaidConnection(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('c1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'c1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plaidConnections'] });
  });

  it('loads connections only when a user id is present', async () => {
    requestMock.mockResolvedValue({ plaidConnections: [{ id: 'c1' }] });
    const { wrapper } = createWrapper();

    const disabled = renderHook(() => usePlaidConnections(null), { wrapper });
    expect(disabled.result.current.fetchStatus).toBe('idle');

    const enabled = renderHook(() => usePlaidConnections('u1'), { wrapper });
    await waitFor(() => expect(enabled.result.current.data).toEqual([{ id: 'c1' }]));
    expect(requestMock).toHaveBeenCalledWith(expect.anything());
  });

  it('loads accounts only when a connection id is present', async () => {
    requestMock.mockResolvedValue({ plaidAccounts: [{ id: 'pa1' }] });
    const { wrapper } = createWrapper();

    const disabled = renderHook(() => usePlaidAccounts(null), { wrapper });
    expect(disabled.result.current.fetchStatus).toBe('idle');

    const enabled = renderHook(() => usePlaidAccounts('c1'), { wrapper });
    await waitFor(() => expect(enabled.result.current.data).toEqual([{ id: 'pa1' }]));
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { connectionId: 'c1' });
  });
});
