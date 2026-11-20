import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { Category, CategoryInput } from '../../types';

const { service } = vi.hoisted(() => ({
  service: {
    postCategory: vi.fn(),
    patchCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

vi.mock('@/features/categories/hooks/useCategories', () => ({
  default: () => service,
}));

import usePostCategory from '../usePostCategory';
import usePatchCategory from '../usePatchCategory';
import useDeleteCategory from '../useDeleteCategory';

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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const input: CategoryInput = { name: 'Travel', allocation: '250.00' };

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return QueryWrapper;
};

describe('category mutation hooks', () => {
  beforeEach(() => {
    service.postCategory.mockReset().mockResolvedValue('new-id');
    service.patchCategory.mockReset().mockResolvedValue('c1');
    service.deleteCategory.mockReset().mockResolvedValue(true);
  });

  it('usePostCategory forwards the budget and input', async () => {
    const onSettled = vi.fn();
    const { result } = renderHook(() => usePostCategory({ onSettled }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ budgetId: 'b1', category: input });
    });

    expect(service.postCategory).toHaveBeenCalledWith('b1', input);
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
  });

  it('usePatchCategory forwards the edited category', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => usePatchCategory({ onSuccess }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ category: category({ allocation: '450.00' }) });
    });

    expect(service.patchCategory).toHaveBeenCalledWith(category({ allocation: '450.00' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('useDeleteCategory forwards only the category id', async () => {
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ category: category() });
    });

    expect(service.deleteCategory).toHaveBeenCalledWith('c1');
  });

  it('surfaces service errors through the mutation state', async () => {
    service.postCategory.mockRejectedValue(new Error('read-only budget'));

    const { result } = renderHook(() => usePostCategory(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.mutateAsync({ budgetId: 'b1', category: input })).rejects.toThrow(
        'read-only budget',
      );
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
