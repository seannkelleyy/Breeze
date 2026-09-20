import { useMemo } from 'react';

import { getFinancialMathSnapshot } from '../../../lib/tax';
import { computeHouseholdWaterfall } from '../../../lib/paycheck';
import type { PaycheckWithholding } from '../../../lib/paycheck';
import type { PlannerAccount } from '../../../types/account';
import type { PlannerPerson } from '../../../types/person';
import type { TaxYearTables } from '../../../types/tax';
import type { Household, Portfolio } from './types';

export function useFinancialMathSnapshot(
  monthlyExpenses: number,
  household: Household,
  safeWithdrawalRate: number,
  portfolio: Portfolio,
  taxTables: TaxYearTables | null,
  deductionType: string,
  people: PlannerPerson[],
  accounts: PlannerAccount[],
  withholdings: PaycheckWithholding[],
) {
  return useMemo(
    () =>
      getFinancialMathSnapshot(
        {
          monthlyExpenses,
          selfSalary: household.annualHouseholdIncome,
          spouseSalary: 0,
          safeWithdrawalRate,
          currentPortfolio: portfolio.totalStartingBalance,
          emergencyFundBalance: portfolio.emergencyFundBalance,
          deductionType,
        },
        taxTables,
        computeHouseholdWaterfall(people, accounts, withholdings, taxTables, deductionType),
      ),
    [
      monthlyExpenses,
      household.annualHouseholdIncome,
      safeWithdrawalRate,
      portfolio.totalStartingBalance,
      portfolio.emergencyFundBalance,
      taxTables,
      deductionType,
      people,
      accounts,
      withholdings,
    ],
  );
}
