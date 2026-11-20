import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { print } from 'graphql';
import type { ReactNode } from 'react';

import type { PlannerPerson } from '@/features/planning/types/person';

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock('@/lib/services/useGraphql', () => ({
  default: () => ({ request: requestMock }),
}));

import { usePersonMutations } from '../usePersonMutations';

const person = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Alex',
  birthday: '1986-01-01',
  retirementAge: 65,
  annualSalary: 100000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual',
  annualBonus: 5000,
  incomeGrowthRate: 3,
  isPrimary: true,
  payType: 'salary',
  payDay: 1,
  payCadence: 'biweekly',
  hourlyRate: 0,
  expectedHoursPerWeek: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const operationName = (document: unknown) => print(document as never);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: QueryWrapper, invalidateSpy };
};

describe('usePersonMutations', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('upserts a person with stringified money fields', async () => {
    requestMock.mockResolvedValue({ upsertPlannerPerson: { id: 'p1' } });
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => usePersonMutations('u1'), { wrapper });

    await act(async () => {
      await result.current.upsertPersonMutation.mutateAsync(person());
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), {
      input: {
        id: 'p1',
        name: 'Alex',
        birthday: '1986-01-01',
        retirementAge: 65,
        annualSalary: '100000',
        bonusMode: 'dollars',
        bonusFrequency: 'annual',
        annualBonus: '5000',
        incomeGrowthRate: '3',
        payType: 'salary',
        payDay: 1,
        payCadence: 'biweekly',
        hourlyRate: '0',
        expectedHoursPerWeek: '0',
      },
    });
    expect(operationName(requestMock.mock.calls[0][0])).toContain('UpsertPlannerPerson');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plannerPeople', 'u1'] });
  });

  it('deletes a person and invalidates the household', async () => {
    requestMock.mockResolvedValue({});
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => usePersonMutations('u1'), { wrapper });

    await act(async () => {
      await result.current.deletePersonMutation.mutateAsync('p1');
    });

    expect(requestMock).toHaveBeenCalledWith(expect.anything(), { id: 'p1' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plannerPeople', 'u1'] });
  });

  it('exposes the upsert pending state as isSaving', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePersonMutations('u1'), { wrapper });

    expect(result.current.isSaving).toBe(false);
  });
});
