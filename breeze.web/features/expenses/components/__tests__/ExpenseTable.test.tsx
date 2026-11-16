import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';

import type { Expense } from '@/features/expenses/types';
import type { Category } from '@/features/categories/types';

const { budgetState } = vi.hoisted(() => ({
  budgetState: { current: null as null | Record<string, unknown> },
}));

vi.mock('@/features/budget/providers', () => ({
  useBudgetContext: () => budgetState.current,
}));

vi.mock('@/features/expenses/components/dialogs/EditExpenseDialog', () => ({
  EditExpenseDialog: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { ExpensesTable } from '../ExpenseTable';

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

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'e1',
  userId: 'u1',
  budgetId: 'b1',
  amount: '42.50',
  date: '2026-03-15',
  description: 'Weekly groceries',
  sourceType: 'MANUAL',
  sourceTemplateId: null,
  generationMonth: null,
  personId: null,
  createdAt: '2026-03-15T00:00:00Z',
  updatedAt: '2026-03-15T00:00:00Z',
  splits: [{ id: 's1', categoryId: 'c1', amount: '42.50', description: null }],
  ...overrides,
});

const tableBody = () => within(screen.getByTitle('Expenses Table'));

describe('ExpensesTable', () => {
  beforeEach(() => {
    budgetState.current = {
      budget: null,
      incomes: [],
      categories: [category(), category({ id: 'c2', name: 'Rent' })],
      expenses: [],
    };
  });

  it('renders amount, date, category names, and one-time status', () => {
    budgetState.current = {
      ...budgetState.current,
      expenses: [expense()],
    };

    render(<ExpensesTable />);

    const table = tableBody();
    expect(table.getByText('Weekly groceries')).toBeInTheDocument();
    expect(table.getByText('$42.50')).toBeInTheDocument();
    expect(table.getByText('March 15, 2026')).toBeInTheDocument();
    expect(table.getByText('Groceries')).toBeInTheDocument();
    expect(table.getByText('One-time')).toBeInTheDocument();
  });

  it('labels recurring templates as upcoming or recurring by date', () => {
    const upcoming = dayjs().add(3, 'day').format('YYYY-MM-DD');
    const past = dayjs().subtract(3, 'day').format('YYYY-MM-DD');
    budgetState.current = {
      ...budgetState.current,
      expenses: [
        expense({
          id: 'e2',
          description: 'Next rent',
          date: upcoming,
          sourceType: 'RECURRING_TEMPLATE',
          splits: [{ id: 's2', categoryId: 'c2', amount: '1500.00', description: null }],
        }),
        expense({
          id: 'e3',
          description: 'Last rent',
          date: past,
          sourceType: 'RECURRING_TEMPLATE',
          splits: [{ id: 's3', categoryId: 'c2', amount: '1500.00', description: null }],
        }),
      ],
    };

    render(<ExpensesTable />);

    const table = tableBody();
    expect(table.getByText('Upcoming')).toBeInTheDocument();
    expect(table.getByText('Recurring')).toBeInTheDocument();
  });

  it('shows fallbacks for missing and unknown categories', () => {
    budgetState.current = {
      ...budgetState.current,
      expenses: [
        expense({
          id: 'e4',
          description: 'No split',
          splits: [],
        }),
        expense({
          id: 'e5',
          description: 'Unknown split',
          splits: [{ id: 's5', categoryId: 'gone', amount: '10.00', description: null }],
        }),
      ],
    };

    render(<ExpensesTable />);

    const table = tableBody();
    expect(table.getByText('None')).toBeInTheDocument();
    expect(table.getByText('Unknown')).toBeInTheDocument();
  });

  it('filters rows by category button', () => {
    budgetState.current = {
      ...budgetState.current,
      expenses: [
        expense(),
        expense({
          id: 'e2',
          description: 'Monthly rent',
          amount: '1500.00',
          splits: [{ id: 's2', categoryId: 'c2', amount: '1500.00', description: null }],
        }),
      ],
    };

    render(<ExpensesTable />);

    fireEvent.click(screen.getByRole('button', { name: 'Rent' }));

    const table = tableBody();
    expect(table.getByText('Monthly rent')).toBeInTheDocument();
    expect(table.queryByText('Weekly groceries')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(tableBody().getByText('Weekly groceries')).toBeInTheDocument();
  });

  it('filters rows by the name input', () => {
    budgetState.current = {
      ...budgetState.current,
      expenses: [
        expense(),
        expense({
          id: 'e2',
          description: 'Monthly rent',
          amount: '1500.00',
          splits: [{ id: 's2', categoryId: 'c2', amount: '1500.00', description: null }],
        }),
      ],
    };

    render(<ExpensesTable />);

    fireEvent.change(screen.getByPlaceholderText('Filter names...'), {
      target: { value: 'rent' },
    });

    const table = tableBody();
    expect(table.getByText('Monthly rent')).toBeInTheDocument();
    expect(table.queryByText('Weekly groceries')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no expenses', () => {
    render(<ExpensesTable />);

    expect(tableBody().getByText('No results found.')).toBeInTheDocument();
  });
});
