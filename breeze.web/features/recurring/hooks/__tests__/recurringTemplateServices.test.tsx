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

import {
  getRecurringExpensesMonthlyTotal,
  useRecurringExpenseTemplates,
  useRecurringTemplates,
  type RecurringExpenseTemplate,
  type RecurringIncomeTemplate,
} from '../recurringTemplateServices';

const expenseTemplate = (
  overrides: Partial<RecurringExpenseTemplate> = {},
): RecurringExpenseTemplate => ({
  id: 'e1',
  userId: 'u1',
  name: 'Rent',
  amount: '1500.00',
  recurrenceInterval: 'MONTHLY',
  startDate: '2026-01-01',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const incomeTemplate = (
  overrides: Partial<RecurringIncomeTemplate> = {},
): RecurringIncomeTemplate => ({
  id: 'i1',
  userId: 'u1',
  name: 'Paycheck',
  amount: '2500.00',
  recurrenceInterval: 'BIWEEKLY',
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

describe('getRecurringExpensesMonthlyTotal', () => {
  it('normalizes each recurrence interval to a monthly amount', () => {
    const total = getRecurringExpensesMonthlyTotal([
      { amount: '1200', recurrenceInterval: 'MONTHLY' },
      { amount: '120', recurrenceInterval: 'WEEKLY' },
      { amount: '260', recurrenceInterval: 'BIWEEKLY' },
      { amount: '300', recurrenceInterval: 'QUARTERLY' },
      { amount: '1200', recurrenceInterval: 'YEARLY' },
      { amount: '0', recurrenceInterval: 'NONE' },
    ]);

    expect(total).toBeCloseTo(1200 + 520 + 563.333 + 100 + 100, 3);
  });

  it('treats unparseable amounts as zero', () => {
    expect(getRecurringExpensesMonthlyTotal([{ amount: 'abc', recurrenceInterval: 'MONTHLY' }])).toBe(
      0,
    );
  });
});

describe('useRecurringExpenseTemplates', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('loads the shared list for the current user', async () => {
    requestMock.mockResolvedValue({ recurringExpenses: [expenseTemplate()] });

    const { result } = renderHook(() => useRecurringExpenseTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([expenseTemplate()]);
    expect(requestMock.mock.calls[0][1]).toEqual({ userId: 'u1' });
  });

  it('does not fetch without a user', async () => {
    userState.userId = null;

    const { result } = renderHook(() => useRecurringExpenseTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(requestMock).not.toHaveBeenCalled();
  });
});

describe('useRecurringTemplates', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('reads recurring incomes and expenses', async () => {
    requestMock.mockImplementation((document) => {
      const text = print(document);
      if (text.includes('recurringIncomes')) {
        return Promise.resolve({ recurringIncomes: [incomeTemplate()] });
      }
      return Promise.resolve({ recurringExpenses: [expenseTemplate()] });
    });

    const { result } = renderHook(() => useRecurringTemplates());

    await expect(result.current.getRecurringIncomeTemplates()).resolves.toEqual([
      incomeTemplate(),
    ]);
    await expect(result.current.getRecurringExpenseTemplates()).resolves.toEqual([
      expenseTemplate(),
    ]);
  });

  it('creates an income template scoped to the current user', async () => {
    requestMock.mockResolvedValue({ createRecurringIncome: incomeTemplate({ id: 'i2' }) });

    const { result } = renderHook(() => useRecurringTemplates());
    const created = await result.current.postRecurringIncomeTemplate({
      name: 'Paycheck',
      amount: '2500.00',
      recurrenceInterval: 'BIWEEKLY',
      paydayDayOfMonth: 15,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(created.id).toBe('i2');
    expect(requestMock.mock.calls[0][1]).toEqual({
      input: {
        userId: 'u1',
        name: 'Paycheck',
        amount: '2500.00',
        recurrenceInterval: 'BIWEEKLY',
        paydayDayOfMonth: 15,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
    });
  });

  it('updates an income template by id', async () => {
    requestMock.mockResolvedValue({
      updateRecurringIncome: incomeTemplate({ name: 'Raise' }),
    });

    const { result } = renderHook(() => useRecurringTemplates());
    const updated = await result.current.patchRecurringIncomeTemplate(
      incomeTemplate({ name: 'Raise' }),
    );

    expect(updated.name).toBe('Raise');
    expect(requestMock.mock.calls[0][1]).toEqual({
      input: {
        id: 'i1',
        name: 'Raise',
        amount: '2500.00',
        recurrenceInterval: 'BIWEEKLY',
        paydayDayOfMonth: undefined,
        startDate: '2026-01-01',
        endDate: undefined,
      },
    });
  });

  it('creates an expense template scoped to the current user', async () => {
    requestMock.mockResolvedValue({ createRecurringExpense: expenseTemplate({ id: 'e2' }) });

    const { result } = renderHook(() => useRecurringTemplates());
    const created = await result.current.postRecurringExpenseTemplate({
      name: 'Gym',
      amount: '45.00',
      recurrenceInterval: 'MONTHLY',
      startDate: '2026-02-01',
    });

    expect(created.id).toBe('e2');
    expect(requestMock.mock.calls[0][1]).toEqual({
      input: {
        userId: 'u1',
        name: 'Gym',
        amount: '45.00',
        recurrenceInterval: 'MONTHLY',
        paydayDayOfMonth: undefined,
        startDate: '2026-02-01',
        endDate: undefined,
      },
    });
  });

  it('updates an expense template by id', async () => {
    requestMock.mockResolvedValue({
      updateRecurringExpense: expenseTemplate({ amount: '1600.00' }),
    });

    const { result } = renderHook(() => useRecurringTemplates());
    const updated = await result.current.patchRecurringExpenseTemplate(
      expenseTemplate({ amount: '1600.00' }),
    );

    expect(updated.amount).toBe('1600.00');
    expect(requestMock.mock.calls[0][1]).toMatchObject({ input: { id: 'e1', amount: '1600.00' } });
  });

  it('deletes income and expense templates by id', async () => {
    requestMock.mockResolvedValue({});

    const { result } = renderHook(() => useRecurringTemplates());

    await expect(result.current.deleteRecurringIncomeTemplate('i1')).resolves.toBeUndefined();
    expect(requestMock.mock.calls[0][1]).toEqual({ id: 'i1' });

    await expect(result.current.deleteRecurringExpenseTemplate('e1')).resolves.toBeUndefined();
    expect(requestMock.mock.calls[1][1]).toEqual({ id: 'e1' });
  });
});
