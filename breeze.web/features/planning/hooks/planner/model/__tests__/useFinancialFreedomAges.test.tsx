import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { ProjectionRow } from '@/features/planning/types/projection';
import {
  useFinancialFreedomAge,
  useFireAchievementAges,
} from '../useFinancialFreedomAges';

const row = (age: number, totalBalance: number): ProjectionRow => ({
  age,
  totalBalance,
  totalContributions: 0,
});

const rows = [row(40, 100_000), row(50, 800_000), row(60, 1_400_000), row(65, 1_800_000)];

describe('useFinancialFreedomAge', () => {
  it('returns the first age whose balance reaches the target', () => {
    const { result } = renderHook(() => useFinancialFreedomAge(rows, 1_000_000));

    expect(result.current).toBe(60);
  });

  it('returns null when the target is never reached', () => {
    const { result } = renderHook(() => useFinancialFreedomAge(rows, 5_000_000));

    expect(result.current).toBeNull();
  });

  it('matches the target exactly', () => {
    const { result } = renderHook(() => useFinancialFreedomAge(rows, 800_000));

    expect(result.current).toBe(50);
  });
});

describe('useFireAchievementAges', () => {
  it('reports an achievement age and years-to-go per lifestyle target', () => {
    const fireTargets = [
      { label: 'Lean FIRE', target: 500_000 },
      { label: 'Standard FIRE', target: 1_500_000 },
      { label: 'Fat FIRE', target: 10_000_000 },
    ];

    const { result } = renderHook(() => useFireAchievementAges(rows, fireTargets, 40));

    expect(result.current).toEqual([
      { label: 'Lean FIRE', target: 500_000, achievementAge: 50, yearsToAchieve: 10 },
      { label: 'Standard FIRE', target: 1_500_000, achievementAge: 65, yearsToAchieve: 25 },
      { label: 'Fat FIRE', target: 10_000_000, achievementAge: null, yearsToAchieve: null },
    ]);
  });

  it('handles already-achieved targets at the current age', () => {
    const { result } = renderHook(() =>
      useFireAchievementAges(rows, [{ label: 'Lean FIRE', target: 50_000 }], 40),
    );

    expect(result.current[0]).toMatchObject({ achievementAge: 40, yearsToAchieve: 0 });
  });

  it('returns an empty list with no targets', () => {
    const { result } = renderHook(() => useFireAchievementAges(rows, [], 40));

    expect(result.current).toEqual([]);
  });
});
