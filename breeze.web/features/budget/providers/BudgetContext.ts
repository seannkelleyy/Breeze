'use client';
import { createContext } from 'react';
import { Budget } from '../../../features/budget/types';
import { Category } from '../../categories/types';
import { Expense } from '@/features/expenses/types';
import { Income } from '../../income/types';

export interface BudgetContextType {
  budget: Budget | null;
  incomes: Income[];
  categories: Category[];
  expenses: Expense[];
  getBudgetForDate: (
    year: number,
    month: number,
  ) => Promise<{ status: number; budget?: Budget; error?: string }>;
  refetchBudget: () => void;
  refetchIncomes: () => void;
  refetchCategories: () => void;
  refetchExpenses: () => void;
}

export const BudgetContext = createContext<BudgetContextType>({} as BudgetContextType);
