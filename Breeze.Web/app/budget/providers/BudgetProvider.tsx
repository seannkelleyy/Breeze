'use client';
import React, { useCallback, useMemo, useState } from 'react';

import dayjs, { Dayjs } from 'dayjs';

import { BudgetContext } from './BudgetContext';
import { useFetchBudget } from '../hooks/budget/index';
import { Budget } from '../types/budget';
import { useFetchIncomes } from '../hooks/income/index';
import { useFetchCategories } from '../hooks/category/index';
import { useFetchExpensesForBudget } from '../hooks/expense/index';

interface BudgetProviderProps {
  children: React.ReactNode;
}

/**
 * BudgetDataProvider component to manage and provide budget-related data and state to the application.
 * Enables access to budget, incomes, categories, expenses, and refetch functions via context.
 * @param {React.ReactNode} children - Child components that will have access to the budget context.
 * @returns {JSX.Element} The BudgetDataProvider component wrapping its children with BudgetContext.
 */
const BudgetDataProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [budgetDate, setBudgetDate] = useState<Dayjs>(dayjs(new Date()));
  const { data: budget = {} as Budget, refetch: refetchBudget } = useFetchBudget({
    date: budgetDate,
  });
  const { data: incomes = [], refetch: refetchIncomes } = useFetchIncomes({
    budgetId: budget?.id,
    enabled: !!budget.id,
  });
  const { data: categories = [], refetch: refetchCategories } = useFetchCategories({
    budgetId: budget?.id,
    enabled: !!budget.id,
  });
  const { data: expenses = [], refetch: refetchExpenses } = useFetchExpensesForBudget({
    budgetId: budget?.id,
    enabled: !!budget.id,
  });

  const totalSpent = useMemo(
    () => categories.reduce((sum, category) => sum + (Number(category.currentSpend) || 0), 0),
    [categories],
  );

  const getBudgetForDate = useCallback(async (year: number, month: number) => {
    setBudgetDate(dayjs().year(year).month(month));
    return { status: 200 };
  }, []);

  return (
    <BudgetContext.Provider
      value={{
        budget,
        totalSpent,
        incomes,
        categories,
        expenses,
        getBudgetForDate,
        refetchBudget,
        refetchIncomes,
        refetchCategories,
        refetchExpenses,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export default BudgetDataProvider;
