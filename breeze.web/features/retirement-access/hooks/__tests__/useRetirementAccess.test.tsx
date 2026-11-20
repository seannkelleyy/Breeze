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
  useCreateHsaReceipt,
  useCreateHsaReimbursement,
  useCreateRothConversion,
  useDeleteHsaReceipt,
  useDeleteHsaReimbursement,
  useDeleteRothConversion,
  useRetirementAccess,
} from '../useRetirementAccess';

const access = {
  hsaReceipts: [],
  hsaReimbursements: [],
  hsaSummary: { availableToReimburse: '0.00' },
  rothConversions: [],
  rothBuckets: [],
};

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

describe('useRetirementAccess', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('does not load until a user is available', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetirementAccess(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('loads retirement access for the user', async () => {
    requestMock.mockResolvedValue({ retirementAccess: access });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRetirementAccess('u1'), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(access));
    expect(requestMock).toHaveBeenCalledWith(expect.anything());
    expect(operationName(requestMock.mock.calls[0][0])).toContain('RetirementAccess');
  });

  it('creates and invalidates HSA receipts', async () => {
    requestMock.mockResolvedValue({ createHsaReceipt: { id: 'r1' } });
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCreateHsaReceipt(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        incurredOn: '2026-01-02',
        description: 'Prescription',
        amount: '40.00',
      });
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: { incurredOn: '2026-01-02', description: 'Prescription', amount: '40.00' },
    });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('CreateHsaReceipt');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['retirement-access'] });
  });

  it('deletes HSA receipts by id', async () => {
    requestMock.mockResolvedValue({});
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useDeleteHsaReceipt(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('r1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'r1' });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('DeleteHsaReceipt');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['retirement-access'] });
  });

  it('creates and deletes HSA reimbursements', async () => {
    requestMock.mockResolvedValue({ createHsaReimbursement: { id: 'hb1' } });
    const { wrapper } = createWrapper();
    const create = renderHook(() => useCreateHsaReimbursement(), { wrapper });

    await act(async () => {
      await create.result.current.mutateAsync({
        reimbursedOn: '2026-02-01',
        amount: '25.00',
        note: 'Copay',
      });
    });
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: { reimbursedOn: '2026-02-01', amount: '25.00', note: 'Copay' },
    });

    requestMock.mockResolvedValue({});
    const remove = renderHook(() => useDeleteHsaReimbursement(), { wrapper });
    await act(async () => {
      await remove.result.current.mutateAsync('hb1');
    });
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'hb1' });
  });

  it('creates and deletes Roth conversions', async () => {
    requestMock.mockResolvedValue({ createRothConversion: { id: 'rc1' } });
    const { wrapper } = createWrapper();
    const create = renderHook(() => useCreateRothConversion(), { wrapper });

    await act(async () => {
      await create.result.current.mutateAsync({
        convertedOn: '2026-03-01',
        amount: '5000.00',
        fromAssetId: 'a1',
        toAssetId: 'a2',
      });
    });
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: { convertedOn: '2026-03-01', amount: '5000.00', fromAssetId: 'a1', toAssetId: 'a2' },
    });

    requestMock.mockResolvedValue({});
    const remove = renderHook(() => useDeleteRothConversion(), { wrapper });
    await act(async () => {
      await remove.result.current.mutateAsync('rc1');
    });
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'rc1' });
  });
});
