import { useEffect, useMemo, useRef } from 'react';

import * as plannerConstants from '../../lib/constants';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { getAgeFromBirthday } from '../../lib/plannerMath';
import { PlannerPerson } from '../../types/person';

const usePlannerPeople = () => {
  const { plannerPeople, setPlannerPeople, setPlannerAccounts } = useCurrentUser();
  const hasHydrated = useRef(false);

  const people = plannerPeople;

  // Mark that API data has been loaded (called by page.tsx hydration effect)
  useEffect(() => {
    if (people.length > 0) {
      hasHydrated.current = true;
    }
  }, [people]);

  // Initialize self person only if API never returned any data
  useEffect(() => {
    if (people.length === 0 && !hasHydrated.current) {
      const selfPerson: PlannerPerson = {
        id: crypto.randomUUID(),
        ...plannerConstants.PLANNER_DEFAULT_SELF_PERSON,
      };
      setPlannerPeople([selfPerson]);
    }
  }, [people, setPlannerPeople]);

  const selfPerson = useMemo(
    () => people.find((person) => person.type === 'self') ?? people[0],
    [people],
  );
  const hasSpouse = useMemo(() => people.some((person) => person.type === 'spouse'), [people]);
  const currentAge = useMemo(
    () => getAgeFromBirthday(selfPerson?.birthday ?? ''),
    [selfPerson?.birthday],
  );

  const updatePerson = (id: string, updater: (person: PlannerPerson) => PlannerPerson) => {
    setPlannerPeople((prev) => prev.map((person) => (person.id === id ? updater(person) : person)));
  };

  const addSpouse = () => {
    if (people.some((person) => person.type === 'spouse')) {
      return;
    }

    setPlannerPeople((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...plannerConstants.PLANNER_DEFAULT_SPOUSE_PERSON,
      },
    ]);
  };

  const removeSpouse = () => {
    setPlannerPeople((prev) => prev.filter((person) => person.type !== 'spouse'));
    setPlannerAccounts((prev) =>
      prev.map((account) => (account.owner === 'spouse' ? { ...account, owner: 'self' } : account)),
    );
  };

  return {
    people,
    hasSpouse,
    currentAge,
    updatePerson,
    addSpouse,
    removeSpouse,
  };
};

export default usePlannerPeople;
