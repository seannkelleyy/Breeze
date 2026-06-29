import {
  GET_ASSETS_BY_USER,
  GET_LIABILITIES_BY_USER,
  CREATE_ASSET,
  UPDATE_ASSET,
  CREATE_LIABILITY,
  UPDATE_LIABILITY,
} from '@/lib/services/queries/assets';
import { ESTIMATE_TAXES_FOR_YEAR } from '@/lib/services/queries/taxPlanning';
import { CALCULATE_RETIREMENT_LADDER } from '@/lib/services/queries/retirementLadder';
import {
  GET_BUDGET_BY_DATE,
  GET_EXPENSES_BY_BUDGET,
  GET_INCOMES_BY_BUDGET,
  GET_CATEGORIES,
  CREATE_EXPENSE_CATEGORY,
  UPDATE_EXPENSE_CATEGORY,
  DELETE_EXPENSE_CATEGORY,
  CREATE_EXPENSE,
  UPDATE_EXPENSE,
  DELETE_EXPENSE,
  CREATE_INCOME,
  UPDATE_INCOME,
  DELETE_INCOME,
  GET_GOALS,
  CREATE_GOAL,
  UPDATE_GOAL,
  DELETE_GOAL,
} from '@/lib/services/queries/budget';

export interface CreateAssetInput {
  userId: string;
  name: string;
  assetType: string;
  currentValue: string;
}

export interface UpdateAssetInput {
  id: string;
  name: string;
  currentValue?: string;
}

export interface CreateLiabilityInput {
  userId: string;
  name: string;
  liabilityType: string;
  currentBalance: string;
  interestRate?: number;
  minimumPayment?: string;
}

export interface UpdateLiabilityInput {
  id: string;
  name?: string;
  currentBalance?: string;
  interestRate?: number;
}

export interface EstimateTaxesInput {
  year: number;
  filingStatus: string;
  income: string;
  deduction?: string;
}

export interface RetirementLadderInput {
  initialBalance: string;
  annualExpenses: string;
  currentAge: number;
  firstWithdrawalAge: number;
  isRoth: boolean;
  year: number;
  filingStatus: string;
  yearsToProject?: number;
}

export interface BudgetInput {
  userId: string;
  date: string;
  monthlyIncome: string;
  monthlyExpenses: string;
}

export interface CreateExpenseCategoryInput {
  budgetId: string;
  name: string;
  allocation: string;
}

export interface UpdateExpenseCategoryInput {
  id: string;
  name?: string;
  allocation?: string;
}

export interface CreateExpenseInput {
  budgetId: string;
  userId: string;
  amount: string;
  date: string;
  description: string;
}

export interface UpdateExpenseInput {
  id: string;
  amount?: string;
  description?: string;
}

export interface CreateIncomeInput {
  budgetId: string;
  userId: string;
  name: string;
  amount: string;
  date: string;
  sourceType: string;
}

export interface UpdateIncomeInput {
  id: string;
  amount?: string;
  name?: string;
}

export interface CreateGoalInput {
  userId: string;
  description: string;
}

export interface UpdateGoalInput {
  id: string;
  description?: string;
  isCompleted?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RequestFn = (query: string, variables?: Record<string, unknown>) => Promise<any>;

export const createPlannerApi = (requestFn: RequestFn) => ({
  // Assets
  getAssets: (userId: string) => requestFn(GET_ASSETS_BY_USER, { userId }),

  createAsset: (input: CreateAssetInput) => requestFn(CREATE_ASSET, { input }),

  updateAsset: (input: UpdateAssetInput) => requestFn(UPDATE_ASSET, { input }),

  // Liabilities
  getLiabilities: (userId: string) => requestFn(GET_LIABILITIES_BY_USER, { userId }),

  createLiability: (input: CreateLiabilityInput) => requestFn(CREATE_LIABILITY, { input }),

  updateLiability: (input: UpdateLiabilityInput) => requestFn(UPDATE_LIABILITY, { input }),

  // Tax planning
  estimateTaxes: (input: EstimateTaxesInput) =>
    requestFn(ESTIMATE_TAXES_FOR_YEAR, input as unknown as Record<string, unknown>),

  calculateRetirementLadder: (input: RetirementLadderInput) =>
    requestFn(CALCULATE_RETIREMENT_LADDER, input as unknown as Record<string, unknown>),

  // Budget operations
  getBudgetByDate: (userId: string, date: string) =>
    requestFn(GET_BUDGET_BY_DATE, { userId, date }),

  getExpensesByBudget: (budgetId: string) => requestFn(GET_EXPENSES_BY_BUDGET, { budgetId }),

  getIncomesByBudget: (budgetId: string) => requestFn(GET_INCOMES_BY_BUDGET, { budgetId }),

  getCategories: (budgetId: string) => requestFn(GET_CATEGORIES, { budgetId }),

  createExpenseCategory: (input: CreateExpenseCategoryInput) =>
    requestFn(CREATE_EXPENSE_CATEGORY, { input }),

  updateExpenseCategory: (input: UpdateExpenseCategoryInput) =>
    requestFn(UPDATE_EXPENSE_CATEGORY, { input }),

  deleteExpenseCategory: (id: string) => requestFn(DELETE_EXPENSE_CATEGORY, { id }),

  createExpense: (input: CreateExpenseInput) => requestFn(CREATE_EXPENSE, { input }),

  updateExpense: (input: UpdateExpenseInput) => requestFn(UPDATE_EXPENSE, { input }),

  deleteExpense: (id: string) => requestFn(DELETE_EXPENSE, { id }),

  createIncome: (input: CreateIncomeInput) => requestFn(CREATE_INCOME, { input }),

  updateIncome: (input: UpdateIncomeInput) => requestFn(UPDATE_INCOME, { input }),

  deleteIncome: (id: string) => requestFn(DELETE_INCOME, { id }),

  getGoals: (userId: string) => requestFn(GET_GOALS, { userId }),

  createGoal: (input: CreateGoalInput) => requestFn(CREATE_GOAL, { input }),

  updateGoal: (input: UpdateGoalInput) => requestFn(UPDATE_GOAL, { input }),

  deleteGoal: (id: string) => requestFn(DELETE_GOAL, { id }),
});

export type PlannerApi = ReturnType<typeof createPlannerApi>;
