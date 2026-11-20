import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Budget } from '@/features/budget/types';
import type { Category } from '@/features/categories/types';

const { postState, budgetState, userState } = vi.hoisted(() => ({
  postState: {
    mutateAsync: vi.fn(),
    lastProps: null as null | { onSettled?: () => void },
  },
  budgetState: {
    current: null as null | Record<string, unknown>,
  },
  userState: { userId: 'u1' as string | null },
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

vi.mock('@/features/budget/providers/index', () => ({
  useBudgetContext: () => budgetState.current,
}));

vi.mock('@/features/expenses/hooks/index', () => ({
  usePostExpense: (props: { onSettled?: () => void }) => {
    postState.lastProps = props;
    return { mutateAsync: postState.mutateAsync };
  },
}));

import { CreateExpenseDialog } from '../CreateExpenseDialog';

const budget: Budget = {
  id: 'b1',
  userId: 'u1',
  monthlyIncome: '5000.00',
  monthlyExpenses: '3500.00',
  date: '2026-03-01T00:00:00.000Z',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

const category = (overrides: Partial<Category> = {}): Category => ({
  id: 'c1',
  userId: 'u1',
  budgetId: 'b1',
  name: 'Groceries',
  allocation: '400.00',
  currentSpend: '0.00',
  sourceType: 'MANUAL',
  sourceTemplateId: null,
  generationMonth: null,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  ...overrides,
});

const refetchers = {
  refetchBudget: vi.fn(),
  refetchCategories: vi.fn(),
  refetchExpenses: vi.fn(),
  refetchIncomes: vi.fn(),
  getBudgetForDate: vi.fn(),
};

const setBudgetContext = (overrides: Record<string, unknown> = {}) => {
  budgetState.current = {
    budget,
    categories: [category()],
    expenses: [],
    incomes: [],
    ...refetchers,
    ...overrides,
  };
};

const openDialog = async () => {
  fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
  return screen.findByLabelText('Description');
};

describe('CreateExpenseDialog', () => {
  beforeEach(() => {
    postState.mutateAsync.mockReset().mockResolvedValue({ id: 'e1' });
    postState.lastProps = null;
    userState.userId = 'u1';
    Object.values(refetchers).forEach((mock) => mock.mockReset());
    setBudgetContext();
  });

  it('submits a new expense for the active budget and first category', async () => {
    render(<CreateExpenseDialog />);

    const description = await openDialog();
    fireEvent.change(description, { target: { value: 'Weekly groceries' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '42.50' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-15' } });

    const save = screen.getByRole('button', { name: /save expense/i });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);

    await waitFor(() =>
      expect(postState.mutateAsync).toHaveBeenCalledWith({
        budgetId: 'b1',
        expense: {
          amount: '42.50',
          date: '2026-03-15',
          description: 'Weekly groceries',
          splits: [{ categoryId: 'c1', amount: '42.50' }],
        },
      }),
    );
  });

  it('does nothing when there is no active budget', async () => {
    setBudgetContext({ budget: null });
    render(<CreateExpenseDialog />);

    const description = await openDialog();
    fireEvent.change(description, { target: { value: 'Weekly groceries' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '42.50' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-15' } });

    const save = screen.getByRole('button', { name: /save expense/i });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(postState.mutateAsync).not.toHaveBeenCalled();
  });

  it('refetches budget data after the mutation settles', () => {
    render(<CreateExpenseDialog />);

    postState.lastProps?.onSettled?.();

    expect(refetchers.refetchBudget).toHaveBeenCalledTimes(1);
    expect(refetchers.refetchCategories).toHaveBeenCalledTimes(1);
    expect(refetchers.refetchExpenses).toHaveBeenCalledTimes(1);
  });

  it('keeps Save disabled until the form is valid', async () => {
    render(<CreateExpenseDialog />);
    await openDialog();

    expect(screen.getByRole('button', { name: /save expense/i })).toBeDisabled();
  });
});
