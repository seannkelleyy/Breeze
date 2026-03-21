'use client';
import { createContext } from 'react';
import { Budget } from '../types/budget';
import { Category } from '../types/category';
import { Expense } from '../types/expense';
import { Income } from '../types/income';

export interface BudgetContextType {
  budget: Budget;
  totalSpent: number;
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
