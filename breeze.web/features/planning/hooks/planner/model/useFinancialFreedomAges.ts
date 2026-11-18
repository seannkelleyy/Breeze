import type { ProjectionRow } from '../../../types/projection';

export function useFinancialFreedomAge(
  projectionRows: ProjectionRow[],
  financialFreedomTarget: number,
) {
  const hit = projectionRows.find((r) => r.totalBalance >= financialFreedomTarget);
  return hit?.age ?? null;
}

export function useFireAchievementAges(
  projectionRows: ProjectionRow[],
  fireTargets: Array<{ label: string; target: number }>,
  currentAge: number,
) {
  return fireTargets.map((ft) => {
    const hit = projectionRows.find((r) => r.totalBalance >= ft.target);
    const achievementAge = hit?.age ?? null;
    const yearsToAchieve = achievementAge !== null ? achievementAge - currentAge : null;
    return {
      label: ft.label,
      target: ft.target,
      achievementAge,
      yearsToAchieve,
    };
  });
}
