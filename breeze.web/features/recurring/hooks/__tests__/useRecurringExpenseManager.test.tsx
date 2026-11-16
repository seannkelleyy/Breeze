import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { RecurringExpenseTemplate } from '../recurringTemplateServices';

const { serviceMock, budgetMock, userState } = vi.hoisted(() => ({
  serviceMock: {
    getRecurringExpenseTemplates: vi.fn(),
    postRecurringExpenseTemplate: vi.fn(),
    patchRecurringExpenseTemplate: vi.fn(),
    deleteRecurringExpenseTemplate: vi.fn(),
  },
  budgetMock: { regenerateBudgetMonth: vi.fn() },
  userState: { userId: 'u1' as string | null, isLoaded: true },
}));

vi.mock('@/features/recurring/hooks/recurringTemplateServices', () => ({
  useRecurringTemplates: () => serviceMock,
}));

vi.mock('@/features/budget/hooks/useRegenerateBudget', () => ({
  useRegenerateBudget: () => budgetMock,
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

import { useRecurringExpenseManager } from '../useRecurringExpenseManager';

const template = (overrides: Partial<RecurringExpenseTemplate> = {}): RecurringExpenseTemplate => ({
  id: 't1',
  userId: 'u1',
  name: 'Rent',
  amount: '1500.00',
  recurrenceInterval: 'MONTHLY',
  startDate: '2026-01-01',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
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

describe('useRecurringExpenseManager', () => {
  beforeEach(() => {
    Object.values(serviceMock).forEach((mock) => mock.mockReset());
    budgetMock.regenerateBudgetMonth.mockReset().mockResolvedValue(undefined);
    userState.userId = 'u1';
    userState.isLoaded = true;
  });

  it('loads templates once the user is ready', async () => {
    serviceMock.getRecurringExpenseTemplates.mockResolvedValue([template()]);

    const { result } = renderHook(() => useRecurringExpenseManager(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].id).toBe('t1');
  });

  it('does not load before the user is loaded', async () => {
    userState.isLoaded = false;
    userState.userId = null;

    const { result } = renderHook(() => useRecurringExpenseManager(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(serviceMock.getRecurringExpenseTemplates).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it('prepends a created template and regenerates the current month', async () => {
    serviceMock.getRecurringExpenseTemplates.mockResolvedValue([]);
    serviceMock.postRecurringExpenseTemplate.mockResolvedValue(template({ id: 't2' }));

    const { result } = renderHook(() => useRecurringExpenseManager(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTemplate({
        name: 'Rent',
        amount: '1500.00',
        recurrenceInterval: 'MONTHLY',
        startDate: '2026-01-01',
      });
    });

    expect(result.current.templates.map((t) => t.id)).toEqual(['t2']);
    expect(budgetMock.regenerateBudgetMonth).toHaveBeenCalledTimes(1);
    const now = new Date();
    expect(budgetMock.regenerateBudgetMonth).toHaveBeenCalledWith(
      now.getFullYear(),
      now.getMonth() + 1,
    );
  });

  it('replaces an updated template in place', async () => {
    serviceMock.getRecurringExpenseTemplates.mockResolvedValue([
      template(),
      template({ id: 't2', name: 'Internet' }),
    ]);
    serviceMock.patchRecurringExpenseTemplate.mockResolvedValue(
      template({ name: 'Rent (raised)' }),
    );

    const { result } = renderHook(() => useRecurringExpenseManager(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.templates).toHaveLength(2));

    await act(async () => {
      await result.current.updateTemplate(template({ name: 'Rent (raised)' }));
    });

    expect(result.current.templates).toHaveLength(2);
    expect(result.current.templates[0].name).toBe('Rent (raised)');
    expect(result.current.templates[1].id).toBe('t2');
  });

  it('removes a deleted template and syncs the budget', async () => {
    serviceMock.getRecurringExpenseTemplates.mockResolvedValue([template()]);
    serviceMock.deleteRecurringExpenseTemplate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRecurringExpenseManager(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.templates).toHaveLength(1));

    await act(async () => {
      await result.current.deleteTemplate('t1');
    });

    expect(result.current.templates).toEqual([]);
    expect(budgetMock.regenerateBudgetMonth).toHaveBeenCalledTimes(1);
  });
});
