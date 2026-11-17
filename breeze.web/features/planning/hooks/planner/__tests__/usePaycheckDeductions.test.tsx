import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
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

import { usePaycheckDeductions } from '../usePaycheckDeductions';

const deduction = {
  id: 'd1',
  userId: 'u1',
  personId: 'p1',
  name: '401k',
  amount: '500.00',
  pretax: true,
  kind: 'retirement',
  linkedAccountId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const operationName = (document: unknown) => print(document as never);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: QueryWrapper, queryClient, invalidateSpy };
};

describe('usePaycheckDeductions', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('loads one person’s deductions and normalizes amounts', async () => {
    requestMock.mockResolvedValue({ paycheckDeductions: [deduction] });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePaycheckDeductions('p1'), { wrapper });

    await waitFor(() => expect(result.current.deductions).toHaveLength(1));
    expect(result.current.deductions[0].amount).toBe(500);
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { personId: 'p1' });
  });

  it('loads household deductions when no person is selected', async () => {
    requestMock.mockResolvedValue({
      paycheckDeductionsByUser: [deduction, { ...deduction, id: 'd2', amount: 'not-a-number' }],
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePaycheckDeductions(null), { wrapper });

    await waitFor(() => expect(result.current.deductions).toHaveLength(2));
    expect(result.current.deductions[1].amount).toBe(0);
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { userId: 'u1' });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('PaycheckDeductionsByUser');
  });

  it('does not query until a user is available', () => {
    userState.userId = null;
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePaycheckDeductions(null), { wrapper });

    expect(result.current.deductions).toEqual([]);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('upserts a deduction into the cache and invalidates household data', async () => {
    let upserted = false;
    requestMock.mockImplementation((document) => {
      if (operationName(document).includes('UpsertPaycheckDeduction')) {
        upserted = true;
        return Promise.resolve({ upsertPaycheckDeduction: { ...deduction, amount: '650.00' } });
      }
      return Promise.resolve({
        paycheckDeductionsByUser: [upserted ? { ...deduction, amount: '650.00' } : deduction],
      });
    });
    const { wrapper, queryClient, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => usePaycheckDeductions(null), { wrapper });
    await waitFor(() => expect(result.current.deductions).toHaveLength(1));

    await act(async () => {
      await result.current.upsertDeduction.mutateAsync({
        id: 'd1',
        personId: 'p1',
        name: '401k',
        amount: 650,
        pretax: true,
        kind: 'retirement',
        linkedAccountId: null,
      });
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        id: 'd1',
        userId: 'u1',
        personId: 'p1',
        name: '401k',
        amount: '650',
        pretax: true,
        kind: 'retirement',
        linkedAccountId: null,
      },
    });
    expect(queryClient.getQueryData(['paycheckDeductions', 'all'])).toMatchObject([
      { id: 'd1', amount: 650 },
    ]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paycheckDeductions'] });
  });

  it('deletes a deduction and invalidates household data', async () => {
    let deleted = false;
    requestMock.mockImplementation((document) => {
      if (operationName(document).includes('DeletePaycheckDeduction')) {
        deleted = true;
        return Promise.resolve({});
      }
      return Promise.resolve({ paycheckDeductionsByUser: deleted ? [] : [deduction] });
    });
    const { wrapper, queryClient, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => usePaycheckDeductions(null), { wrapper });
    await waitFor(() => expect(result.current.deductions).toHaveLength(1));

    await act(async () => {
      await result.current.deleteDeduction.mutateAsync('d1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'd1' });
    expect(queryClient.getQueryData(['paycheckDeductions', 'all'])).toEqual([]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paycheckDeductions'] });
  });
});
