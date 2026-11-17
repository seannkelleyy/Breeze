import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import { useNetWorthSnapshots } from '../useNetWorthSnapshots';

const snapshotDto = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  userId: 'u1',
  snapshotDate: '2026-01-31',
  totalAssets: '100000.00',
  totalLiabilities: '25000.00',
  netWorth: '75000.00',
  items: [
    {
      id: 'i1',
      snapshotId: 's1',
      accountId: 'a1',
      label: 'Checking',
      amount: '100000.00',
      kind: 'ASSET',
    },
  ],
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
  ...overrides,
});

const operationName = (document: unknown) => print(document as never);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: QueryWrapper, queryClient };
};

describe('useNetWorthSnapshots', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('does not load without a user', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useNetWorthSnapshots(null), { wrapper });

    expect(result.current.snapshots).toEqual([]);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('maps numeric fields and defaults liability kinds', async () => {
    requestMock.mockResolvedValue({
      netWorthSnapshots: [
        snapshotDto({
          items: [
            {
              id: 'i2',
              snapshotId: 's1',
              accountId: null,
              label: 'Mortgage',
              amount: '25000.00',
              kind: 'LIABILITY',
            },
            {
              id: 'i3',
              snapshotId: 's1',
              accountId: null,
              label: 'Unknown',
              amount: 'oops',
              kind: 'OTHER',
            },
          ],
        }),
      ],
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNetWorthSnapshots('u1'), { wrapper });

    await waitFor(() => expect(result.current.snapshots).toHaveLength(1));
    const [snapshot] = result.current.snapshots;
    expect(snapshot.totalAssets).toBe(100000);
    expect(snapshot.totalLiabilities).toBe(25000);
    expect(snapshot.netWorth).toBe(75000);
    expect(snapshot.items[0]).toMatchObject({ kind: 'LIABILITY', amount: 25000 });
    expect(snapshot.items[1]).toMatchObject({ kind: 'ASSET', amount: 0 });
  });

  it('creates a snapshot, stringifies money, and keeps dates sorted', async () => {
    requestMock.mockImplementation((document) => {
      if (operationName(document).includes('CreateNetWorthSnapshot')) {
        return Promise.resolve({
          createNetWorthSnapshot: snapshotDto({ id: 's2', snapshotDate: '2026-02-28' }),
        });
      }
      return Promise.resolve({
        netWorthSnapshots: [snapshotDto({ id: 's3', snapshotDate: '2026-03-31' })],
      });
    });
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useNetWorthSnapshots('u1'), { wrapper });
    await waitFor(() => expect(result.current.snapshots).toHaveLength(1));

    await act(async () => {
      await result.current.createSnapshot.mutateAsync({
        snapshotDate: '2026-02-28',
        totalAssets: 120000,
        totalLiabilities: 20000,
        netWorth: 100000,
        items: [{ label: 'Checking', amount: 120000, kind: 'ASSET' }],
      });
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        userId: 'u1',
        snapshotDate: '2026-02-28',
        totalAssets: '120000',
        totalLiabilities: '20000',
        netWorth: '100000',
        items: [{ accountId: null, label: 'Checking', amount: '120000', kind: 'ASSET' }],
      },
    });
    const cached = queryClient.getQueryData<Array<{ snapshotDate: string }>>([
      'netWorthSnapshots',
      'u1',
    ]);
    expect(cached?.map((s) => s.snapshotDate)).toEqual(['2026-02-28', '2026-03-31']);
  });

  it('replaces a snapshot for the same date instead of duplicating it', async () => {
    requestMock.mockImplementation((document) => {
      if (operationName(document).includes('CreateNetWorthSnapshot')) {
        return Promise.resolve({
          createNetWorthSnapshot: snapshotDto({ id: 's2', netWorth: '99000.00' }),
        });
      }
      return Promise.resolve({ netWorthSnapshots: [snapshotDto()] });
    });
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useNetWorthSnapshots('u1'), { wrapper });
    await waitFor(() => expect(result.current.snapshots).toHaveLength(1));

    await act(async () => {
      await result.current.createSnapshot.mutateAsync({
        snapshotDate: '2026-01-31',
        totalAssets: 100000,
        totalLiabilities: 1000,
        netWorth: 99000,
      });
    });

    const cached = queryClient.getQueryData<Array<{ id: string }>>(['netWorthSnapshots', 'u1']);
    expect(cached).toHaveLength(1);
    expect(cached?.[0].id).toBe('s2');
  });

  it('deletes a snapshot from the cache', async () => {
    requestMock.mockImplementation((document) => {
      if (operationName(document).includes('DeleteNetWorthSnapshot')) return Promise.resolve({});
      return Promise.resolve({ netWorthSnapshots: [snapshotDto()] });
    });
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useNetWorthSnapshots('u1'), { wrapper });
    await waitFor(() => expect(result.current.snapshots).toHaveLength(1));

    await act(async () => {
      await result.current.deleteSnapshot.mutateAsync('s1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 's1' });
    expect(queryClient.getQueryData(['netWorthSnapshots', 'u1'])).toEqual([]);
  });
});
