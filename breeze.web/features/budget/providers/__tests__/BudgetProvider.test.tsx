import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

const { budgetHook, incomesHook, categoriesHook, expensesHook } = vi.hoisted(() => ({
  budgetHook: vi.fn(),
  incomesHook: vi.fn(),
  categoriesHook: vi.fn(),
  expensesHook: vi.fn(),
}));

vi.mock('@/features/budget/hooks', () => ({ useFetchBudget: budgetHook }));
vi.mock('@/features/income/hooks', () => ({ useFetchIncomes: incomesHook }));
vi.mock('@/features/categories/hooks', () => ({ useFetchCategories: categoriesHook }));
vi.mock('@/features/expenses/hooks', () => ({ useFetchExpensesForBudget: expensesHook }));

import BudgetDataProvider from '../BudgetProvider';
import useBudgetContext from '../useBudgetContext';

const refetch = () => vi.fn();

const renderBudget = () =>
  renderHook(() => useBudgetContext(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <BudgetDataProvider>{children}</BudgetDataProvider>
    ),
  });

describe('BudgetDataProvider', () => {
  beforeEach(() => {
    budgetHook.mockReset();
    incomesHook.mockReset();
    categoriesHook.mockReset();
    expensesHook.mockReset();
  });

  it('provides empty defaults while the budget is loading', () => {
    budgetHook.mockReturnValue({ data: undefined, refetch: refetch() });
    incomesHook.mockReturnValue({ data: undefined, refetch: refetch() });
    categoriesHook.mockReturnValue({ data: undefined, refetch: refetch() });
    expensesHook.mockReturnValue({ data: undefined, refetch: refetch() });

    const { result } = renderBudget();

    expect(result.current.budget).toBeNull();
    expect(result.current.incomes).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.expenses).toEqual([]);
  });

  it('passes the loaded budget and child collections to the context', () => {
    const budget = { id: 'b1', month: 4, year: 2026 };
    const incomes = [{ id: 'i1' }];
    const categories = [{ id: 'c1' }];
    const expenses = [{ id: 'e1' }];
    budgetHook.mockReturnValue({ data: budget, refetch: refetch() });
    incomesHook.mockReturnValue({ data: incomes, refetch: refetch() });
    categoriesHook.mockReturnValue({ data: categories, refetch: refetch() });
    expensesHook.mockReturnValue({ data: expenses, refetch: refetch() });

    const { result } = renderBudget();

    expect(result.current.budget).toEqual(budget);
    expect(result.current.incomes).toEqual(incomes);
    expect(result.current.categories).toEqual(categories);
    expect(result.current.expenses).toEqual(expenses);
  });

  it('only enables child queries once the budget id exists', () => {
    budgetHook.mockReturnValue({ data: undefined, refetch: refetch() });
    incomesHook.mockReturnValue({ data: [], refetch: refetch() });
    categoriesHook.mockReturnValue({ data: [], refetch: refetch() });
    expensesHook.mockReturnValue({ data: [], refetch: refetch() });

    renderBudget();

    expect(incomesHook).toHaveBeenCalledWith({ budgetId: '', enabled: false });
    expect(categoriesHook).toHaveBeenCalledWith({ budgetId: '', enabled: false });
    expect(expensesHook).toHaveBeenCalledWith({ budgetId: '', enabled: false });
  });

  it('switches the selected month and reports success', async () => {
    budgetHook.mockReturnValue({ data: { id: 'b1' }, refetch: refetch() });
    incomesHook.mockReturnValue({ data: [], refetch: refetch() });
    categoriesHook.mockReturnValue({ data: [], refetch: refetch() });
    expensesHook.mockReturnValue({ data: [], refetch: refetch() });

    const { result } = renderBudget();
    let response: { status: number } | undefined;

    await act(async () => {
      response = await result.current.getBudgetForDate(2026, 1);
    });

    expect(response).toEqual({ status: 200 });
    const lastCall = budgetHook.mock.calls.at(-1)?.[0] as {
      date: { year(): number; month(): number };
    };
    expect(lastCall.date.year()).toBe(2026);
    expect(lastCall.date.month()).toBe(1);
  });
});
