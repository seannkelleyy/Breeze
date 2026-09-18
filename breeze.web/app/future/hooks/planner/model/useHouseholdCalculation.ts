import { useMemo } from 'react';

import { getPlannerHouseholdSnapshot } from '../../../lib/plannerMath';
import type { PlannerPerson } from '../../../types/person';
import type { Household } from './types';

export function useHouseholdCalculation(people: PlannerPerson[]): Household {
  return useMemo(() => {
    const { householdIncome, currentAge } = getPlannerHouseholdSnapshot(people);
    const targetAge =
      people.length > 0 ? Math.max(...people.map((p) => p.retirementAge)) : currentAge;
    const yearsToGoal = Math.max(0, targetAge - currentAge);

    return {
      people,
      currentAge,
      targetAge,
      yearsToGoal,
      annualHouseholdIncome: householdIncome,
    };
  }, [people]);
}
