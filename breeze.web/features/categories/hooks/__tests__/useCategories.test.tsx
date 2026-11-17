import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

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

import useCategories from '../useCategories';

const category = {
  id: 'c1',
  userId: 'u1',
  budgetId: 'b1',
  name: 'Groceries',
  allocation: '400.00',
  currentSpend: '25.00',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

describe('useCategories', () => {
  beforeEach(() => {
    requestMock.mockReset();
    userState.userId = 'u1';
  });

  it('lists categories for a budget', async () => {
    requestMock.mockResolvedValue({ expenseCategories: [category] });
    const { result } = renderHook(() => useCategories());

    await expect(result.current.getCategories('b1')).resolves.toEqual([category]);
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { budgetId: 'b1' });
  });

  it('returns an empty list when the API omits categories', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderHook(() => useCategories());

    await expect(result.current.getCategories('b1')).resolves.toEqual([]);
  });

  it('creates a category with a zero starting spend', async () => {
    requestMock.mockResolvedValue({ createExpenseCategory: { id: 'new-id' } });
    const { result } = renderHook(() => useCategories());

    const created = await result.current.postCategory('b1', 'ignored', {
      name: 'Travel',
      allocation: '250.00',
    });

    expect(created).toBe('new-id');
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        userId: 'u1',
        budgetId: 'b1',
        name: 'Travel',
        allocation: '250.00',
        currentSpend: '0',
      },
    });
  });

  it('updates a category', async () => {
    requestMock.mockResolvedValue({ updateExpenseCategory: { id: 'c1' } });
    const { result } = renderHook(() => useCategories());

    const updated = await result.current.patchCategory(category as never);

    expect(updated).toBe('c1');
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        id: 'c1',
        name: 'Groceries',
        allocation: '400.00',
        currentSpend: '25.00',
      },
    });
  });

  it('deletes a category', async () => {
    requestMock.mockResolvedValue({});
    const { result } = renderHook(() => useCategories());

    await expect(result.current.deleteCategory('c1')).resolves.toBe(true);
    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'c1' });
  });
});
