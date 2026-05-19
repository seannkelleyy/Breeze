import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import useIncomes from '@/app/budget/hooks/income/useIncomes';

const mockRequest = jest.fn((query: string) => {
  if (query.includes('GetIncomesByBudget')) {
    return Promise.resolve({
      incomes: [
        {
          id: '1',
          userId: 'user-123',
          budgetId: 'budget-456',
          name: 'Test Income',
          amount: '1000.00',
          date: '2024-05-01',
          sourceType: 'MANUAL',
          createdAt: '2024-05-01T00:00:00Z',
          updatedAt: '2024-05-01T00:00:00Z',
        },
      ],
    });
  }
  return Promise.resolve({});
});

jest.mock('@/lib/services/useGraphql', () => ({
  __esModule: true,
  default: () => ({ request: mockRequest }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useIncomes', () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it('should fetch incomes successfully', async () => {
    mockRequest.mockImplementationOnce((query: string) => {
      if (query.includes('GetIncomesByBudget')) {
        return Promise.resolve({
          incomes: [
            {
              id: '1',
              userId: 'user-123',
              budgetId: 'budget-456',
              name: 'Test Income',
              amount: '1000.00',
              date: '2024-05-01',
              sourceType: 'MANUAL',
              createdAt: '2024-05-01T00:00:00Z',
              updatedAt: '2024-05-01T00:00:00Z',
            },
          ],
        });
      }
      return Promise.resolve({});
    });

    const { result } = renderHook(() => useIncomes(), { wrapper });

    const incomes = await waitFor(() => result.current.getIncomes('budget-456'));

    expect(incomes).toHaveLength(1);
    expect(incomes[0].name).toBe('Test Income');
    expect(incomes[0].amount).toBe('1000.00');
  });

  it('should handle empty incomes', async () => {
    mockRequest.mockImplementationOnce(() => Promise.resolve({ incomes: [] }));

    const { result } = renderHook(() => useIncomes(), { wrapper });

    const incomes = await waitFor(() => result.current.getIncomes('budget-456'));

    expect(incomes).toEqual([]);
  });
});
