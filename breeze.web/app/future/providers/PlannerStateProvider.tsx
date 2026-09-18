'use client';
import {
  createContext,
  Dispatch,
  type ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT,
  PLANNER_DEFAULT_MONTHLY_EXPENSES,
  PLANNER_DEFAULT_RETIREMENT_METHOD,
  PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX,
} from '../lib/constants';
import { PlannerPerson } from '../types/person';
import { PlannerAccount } from '../types/account';
import { AssetFinanceDetails } from '../types/finance';
import { PlannerSummary } from '../types/planner';

export type PlannerRetirementMethod = 'target-amount' | 'fire' | 'income-replacement';

export interface PlannerStateContextValue {
  // Household data — hydrated from the API by usePlannerHydration
  plannerPeople: PlannerPerson[];
  setPlannerPeople: Dispatch<SetStateAction<PlannerPerson[]>>;
  plannerAccounts: PlannerAccount[];
  setPlannerAccounts: Dispatch<SetStateAction<PlannerAccount[]>>;
  plannerAssetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>;
  setPlannerAssetFinanceDetailsByAccountId: Dispatch<
    SetStateAction<Record<string, AssetFinanceDetails>>
  >;

  // Summary computed by usePlannerModel and shared with other pages (e.g. goals FOO)
  plannerSummary: PlannerSummary | null;
  setPlannerSummary: (summary: PlannerSummary) => void;

  // Retirement target inputs
  plannerDesiredInvestmentAmount: number;
  setPlannerDesiredInvestmentAmount: Dispatch<SetStateAction<number>>;
  plannerMonthlyExpenses: number;
  setPlannerMonthlyExpenses: Dispatch<SetStateAction<number>>;
  plannerRetirementMethod: PlannerRetirementMethod;
  setPlannerRetirementMethod: Dispatch<SetStateAction<PlannerRetirementMethod>>;
  plannerFireLifestyleIndex: number;
  setPlannerFireLifestyleIndex: Dispatch<SetStateAction<number>>;
}

const PlannerStateContext = createContext<PlannerStateContextValue | null>(null);

export const PlannerStateProvider = ({ children }: { children: ReactNode }) => {
  const [plannerPeople, setPlannerPeople] = useState<PlannerPerson[]>([]);
  const [plannerAccounts, setPlannerAccounts] = useState<PlannerAccount[]>([]);
  const [plannerAssetFinanceDetailsByAccountId, setPlannerAssetFinanceDetailsByAccountId] =
    useState<Record<string, AssetFinanceDetails>>({});
  const [plannerSummary, setPlannerSummary] = useState<PlannerSummary | null>(null);
  const [plannerDesiredInvestmentAmount, setPlannerDesiredInvestmentAmount] = useState(
    PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT,
  );
  const [plannerMonthlyExpenses, setPlannerMonthlyExpenses] = useState(
    PLANNER_DEFAULT_MONTHLY_EXPENSES,
  );
  const [plannerRetirementMethod, setPlannerRetirementMethod] = useState<PlannerRetirementMethod>(
    PLANNER_DEFAULT_RETIREMENT_METHOD,
  );
  const [plannerFireLifestyleIndex, setPlannerFireLifestyleIndex] = useState(
    PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX,
  );

  const value = useMemo<PlannerStateContextValue>(
    () => ({
      plannerPeople,
      setPlannerPeople,
      plannerAccounts,
      setPlannerAccounts,
      plannerAssetFinanceDetailsByAccountId,
      setPlannerAssetFinanceDetailsByAccountId,
      plannerSummary,
      setPlannerSummary,
      plannerDesiredInvestmentAmount,
      setPlannerDesiredInvestmentAmount,
      plannerMonthlyExpenses,
      setPlannerMonthlyExpenses,
      plannerRetirementMethod,
      setPlannerRetirementMethod,
      plannerFireLifestyleIndex,
      setPlannerFireLifestyleIndex,
    }),
    [
      plannerPeople,
      plannerAccounts,
      plannerAssetFinanceDetailsByAccountId,
      plannerSummary,
      plannerDesiredInvestmentAmount,
      plannerMonthlyExpenses,
      plannerRetirementMethod,
      plannerFireLifestyleIndex,
    ],
  );

  return <PlannerStateContext.Provider value={value}>{children}</PlannerStateContext.Provider>;
};

export const usePlannerState = () => {
  const context = useContext(PlannerStateContext);
  if (!context) {
    throw new Error('usePlannerState must be used within a PlannerStateProvider');
  }
  return context;
};
