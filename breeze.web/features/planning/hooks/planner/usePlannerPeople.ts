import { useEffect, useMemo, useRef } from 'react';
import { usePlannerState } from '../../providers/PlannerStateProvider';
import { getAgeFromBirthday } from '../../lib/plannerMath';
import { PlannerPerson } from '../../types/person';

const PLANNER_DEFAULT_PERSON = {
  name: '',
  birthday: '1990-01-01',
  retirementAge: 60,
  annualSalary: 120000,
  bonusMode: 'dollars' as const,
  bonusFrequency: 'annual' as const,
  annualBonus: 0,
  incomeGrowthRate: 0,
  isPrimary: true,
  payType: 'salary' as const,
  payDay: 1,
  payCadence: 'biweekly' as const,
  hourlyRate: 0,
  expectedHoursPerWeek: 0,
};

const usePlannerPeople = () => {
  const { plannerPeople, setPlannerPeople } = usePlannerState();
  const hasHydrated = useRef(false);
  const people = plannerPeople;

  useEffect(() => {
    if (people.length > 0) {
      hasHydrated.current = true;
    }
  }, [people]);

  useEffect(() => {
    if (people.length === 0 && !hasHydrated.current) {
      const defaultPerson: PlannerPerson = {
        id: crypto.randomUUID(),
        ...PLANNER_DEFAULT_PERSON,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlannerPeople([defaultPerson]);
    }
  }, [people, setPlannerPeople]);

  const currentAge = useMemo(() => getAgeFromBirthday(people[0]?.birthday ?? ''), [people]);

  const updatePerson = (id: string, updater: (person: PlannerPerson) => PlannerPerson) => {
    setPlannerPeople((prev) => prev.map((person) => (person.id === id ? updater(person) : person)));
  };

  const addPerson = () => {
    setPlannerPeople((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...PLANNER_DEFAULT_PERSON,
        annualSalary: 0,
        isPrimary: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const removePerson = (id: string) => {
    setPlannerPeople((prev) => prev.filter((person) => person.id !== id));
  };

  return { people, currentAge, updatePerson, addPerson, removePerson };
};

export default usePlannerPeople;
