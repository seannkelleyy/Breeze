import { useMemo } from 'react';

import * as plannerConfig from '../../../lib/config';
import * as plannerConstants from '../../../lib/constants';
import {
  getAgeFromBirthday,
  getEmployeeMonthlyContribution,
  getEmployerMatchMonthly,
  getSuggestedAnnualLimit,
} from '../../../lib/plannerMath';
import type { IrsLimitConfig } from '../../../types/irs';
import type { PlannerAccount } from '../../../types/account';
import type { PlannerPerson } from '../../../types/person';
import type { Household } from './types';

const { accountTypeOptions } = plannerConfig;

export function useAccountBreakdown(
  accounts: PlannerAccount[],
  household: Household,
  people: PlannerPerson[],
  irsLimits: IrsLimitConfig,
  finalBalances: number[],
) {
  return useMemo(
    () =>
      accounts.map((account, index) => {
        const employeeMonthly = getEmployeeMonthlyContribution(account, household.people);
        const annualEmployee = employeeMonthly * 12;
        const ownerPersons = people.filter((p) => account.personIds.includes(p.id));
        const ownerAge =
          ownerPersons.length > 0
            ? Math.max(...ownerPersons.map((p) => getAgeFromBirthday(p.birthday)))
            : household.currentAge;
        const suggestedLimit = getSuggestedAnnualLimit(
          account.accountType,
          ownerAge,
          irsLimits,
          people.length > 1,
        );
        const matchMonthly = getEmployerMatchMonthly(account, household.people);
        const typeLabel =
          accountTypeOptions.find((o) => o.value === account.accountType)?.label ?? 'Other';
        const ownerLabel =
          ownerPersons.length > 0 ? ownerPersons.map((p) => p.name).join(', ') : 'Unassigned';

        return {
          id: account.id,
          name: account.name,
          ownerLabel,
          accountTypeLabel: typeLabel,
          employeeMonthly,
          matchMonthly,
          totalMonthly: employeeMonthly + matchMonthly,
          annualEmployee,
          suggestedLimit,
          exceedsLimit:
            suggestedLimit > 0 &&
            plannerConstants.isMoneyGreaterThanWithTolerance(annualEmployee, suggestedLimit),
          projectedValue: finalBalances[index] ?? 0,
        };
      }),
    [accounts, household.people, household.currentAge, people, irsLimits, finalBalances],
  );
}
