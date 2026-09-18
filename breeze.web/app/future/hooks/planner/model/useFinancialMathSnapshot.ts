import { useMemo } from 'react';

import { getFinancialMathSnapshot } from '../../../lib/tax';
import type { TaxYearTables } from '../../../types/tax';
import type { Household, Portfolio } from './types';

export function useFinancialMathSnapshot(
  monthlyExpenses: number,
  household: Household,
  safeWithdrawalRate: number,
  portfolio: Portfolio,
  taxTables: TaxYearTables | null,
  deductionType: string,
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
      ),
    [
      monthlyExpenses,
      household.annualHouseholdIncome,
      safeWithdrawalRate,
      portfolio.totalStartingBalance,
      portfolio.emergencyFundBalance,
      taxTables,
      deductionType,
    ],
  );
}
