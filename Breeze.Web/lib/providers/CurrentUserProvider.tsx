'use client';
import {
  createContext,
  Dispatch,
  type ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import useHttp from '../services/useHttp';

import {
  PLANNER_DEFAULT_PRIMARY_401K_ACCOUNT,
  PLANNER_DEFAULT_PRIMARY_ROTH_ACCOUNT,
  PLANNER_DEFAULT_SELF_PERSON,
  PLANNER_DEFAULT_RETURN_DISPLAY_MODE,
  PLANNER_DEFAULT_INFLATION_RATE,
  PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE,
  PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT,
  PLANNER_DEFAULT_MONTHLY_EXPENSES,
  PLANNER_DEFAULT_RETIREMENT_METHOD,
  PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX,
} from '@/app/planner/lib/constants';
import { PlannerPerson } from '@/app/planner/types/person';
import { PlannerAccount } from '@/app/planner/types/account';
import { AssetFinanceDetails } from '@/app/planner/types/finance';
import { PlannerSummary } from '@/app/planner/types/planner';
import { useUser } from '@clerk/nextjs';

export type PlannerRetirementMethod = 'target-amount' | 'fire' | 'income-replacement';

export interface CurrentUserContextValue {
  user: ReturnType<typeof useUser>['user'];
  userId: string;
  isLoaded: boolean;
  isSignedIn: boolean;
  currencyCode: string;
  setCurrencyCode: (nextCurrencyCode: string) => void;
  returnDisplayMode: 'real' | 'nominal';
  setReturnDisplayMode: (nextReturnDisplayMode: 'real' | 'nominal') => void;
  inflationRate: number;
  setInflationRate: (nextInflationRate: number) => void;
  safeWithdrawalRate: number;
  setSafeWithdrawalRate: (nextSafeWithdrawalRate: number) => void;
  plannerDesiredInvestmentAmount: number;
  setPlannerDesiredInvestmentAmount: Dispatch<SetStateAction<number>>;
  plannerMonthlyExpenses: number;
  setPlannerMonthlyExpenses: Dispatch<SetStateAction<number>>;
  plannerRetirementMethod: PlannerRetirementMethod;
  setPlannerRetirementMethod: Dispatch<SetStateAction<PlannerRetirementMethod>>;
  plannerFireLifestyleIndex: number;
  setPlannerFireLifestyleIndex: Dispatch<SetStateAction<number>>;
  plannerSummary: PlannerSummary | null;
  setPlannerSummary: (summary: PlannerSummary) => void;
  plannerPeople: PlannerPerson[];
  setPlannerPeople: Dispatch<SetStateAction<PlannerPerson[]>>;
  plannerAccounts: PlannerAccount[];
  setPlannerAccounts: Dispatch<SetStateAction<PlannerAccount[]>>;
  plannerAssetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>;
  setPlannerAssetFinanceDetailsByAccountId: Dispatch<
    SetStateAction<Record<string, AssetFinanceDetails>>
  >;
}

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  children: ReactNode;
};

const createDefaultPlannerAccounts = (): PlannerAccount[] => [
  {
    id: crypto.randomUUID(),
    ...PLANNER_DEFAULT_PRIMARY_401K_ACCOUNT,
  },
  {
    id: crypto.randomUUID(),
    ...PLANNER_DEFAULT_PRIMARY_ROTH_ACCOUNT,
  },
];

const createDefaultPlannerPeople = (): PlannerPerson[] => [
  {
    id: crypto.randomUUID(),
    ...PLANNER_DEFAULT_SELF_PERSON,
  },
];

export const CurrentUserProvider = ({ children }: CurrentUserProviderProps) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getOne, put } = useHttp();
  const loadedPreferencesForUserRef = useRef<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [returnDisplayMode, setReturnDisplayMode] = useState<'real' | 'nominal'>(
    PLANNER_DEFAULT_RETURN_DISPLAY_MODE,
  );
  const [inflationRate, setInflationRate] = useState(PLANNER_DEFAULT_INFLATION_RATE);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(
    PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE,
  );
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
  const [plannerSummary, setPlannerSummary] = useState<PlannerSummary | null>(null);
  const [plannerPeople, setPlannerPeople] = useState<PlannerPerson[]>(() =>
    createDefaultPlannerPeople(),
  );
  const [plannerAccounts, setPlannerAccounts] = useState<PlannerAccount[]>(() =>
    createDefaultPlannerAccounts(),
  );
  const [plannerAssetFinanceDetailsByAccountId, setPlannerAssetFinanceDetailsByAccountId] =
    useState<Record<string, AssetFinanceDetails>>({});

  const persistPreferences = useCallback(
    async (
      nextCurrencyCode: string,
      nextReturnDisplayMode: 'real' | 'nominal',
      nextInflationRate: number,
      nextSafeWithdrawalRate: number,
    ) => {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
        await put('/user-preferences', {
          currencyCode: nextCurrencyCode,
          returnDisplayMode: nextReturnDisplayMode,
          inflationRate: nextInflationRate,
          safeWithdrawalRate: nextSafeWithdrawalRate,
        });
      } catch {
        // Keep optimistic UI state and allow future writes.
      }
    },
    [isLoaded, isSignedIn, put],
  );

  const updateCurrencyCode = useCallback(
    (nextCurrencyCode: string) => {
      setCurrencyCode(nextCurrencyCode);
      void persistPreferences(
        nextCurrencyCode,
        returnDisplayMode,
        inflationRate,
        safeWithdrawalRate,
      );
    },
    [inflationRate, persistPreferences, returnDisplayMode, safeWithdrawalRate],
  );

  const updateReturnDisplayMode = useCallback(
    (nextReturnDisplayMode: 'real' | 'nominal') => {
      setReturnDisplayMode(nextReturnDisplayMode);
      void persistPreferences(
        currencyCode,
        nextReturnDisplayMode,
        inflationRate,
        safeWithdrawalRate,
      );
    },
    [currencyCode, inflationRate, persistPreferences, safeWithdrawalRate],
  );

  const updateInflationRate = useCallback(
    (nextInflationRate: number) => {
      setInflationRate(nextInflationRate);
      void persistPreferences(
        currencyCode,
        returnDisplayMode,
        nextInflationRate,
        safeWithdrawalRate,
      );
    },
    [currencyCode, persistPreferences, returnDisplayMode, safeWithdrawalRate],
  );

  const updateSafeWithdrawalRate = useCallback(
    (nextSafeWithdrawalRate: number) => {
      setSafeWithdrawalRate(nextSafeWithdrawalRate);
      void persistPreferences(
        currencyCode,
        returnDisplayMode,
        inflationRate,
        nextSafeWithdrawalRate,
      );
    },
    [currencyCode, inflationRate, persistPreferences, returnDisplayMode],
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      loadedPreferencesForUserRef.current = null;
      setCurrencyCode('USD');
      setReturnDisplayMode(PLANNER_DEFAULT_RETURN_DISPLAY_MODE);
      setInflationRate(PLANNER_DEFAULT_INFLATION_RATE);
      setSafeWithdrawalRate(PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE);
      setPlannerDesiredInvestmentAmount(PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT);
      setPlannerMonthlyExpenses(PLANNER_DEFAULT_MONTHLY_EXPENSES);
      setPlannerRetirementMethod(PLANNER_DEFAULT_RETIREMENT_METHOD);
      setPlannerFireLifestyleIndex(PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX);
      setPlannerSummary(null);
      setPlannerPeople(createDefaultPlannerPeople());
      setPlannerAccounts(createDefaultPlannerAccounts());
      setPlannerAssetFinanceDetailsByAccountId({});
      return;
    }

    const userId = user?.id ?? '';
    if (!userId) {
      return;
    }

    if (loadedPreferencesForUserRef.current === userId) {
      return;
    }

    loadedPreferencesForUserRef.current = userId;

    let isCancelled = false;

    const loadPreferences = async () => {
      try {
        const response = await getOne<{
          currencyCode?: string;
          returnDisplayMode?: 'real' | 'nominal';
          inflationRate?: number;
          safeWithdrawalRate?: number;
        }>('/user-preferences');
        if (isCancelled) {
          return;
        }

        if (response?.currencyCode) {
          setCurrencyCode(response.currencyCode);
        }
        setReturnDisplayMode(response?.returnDisplayMode ?? PLANNER_DEFAULT_RETURN_DISPLAY_MODE);
        setInflationRate(response?.inflationRate ?? PLANNER_DEFAULT_INFLATION_RATE);
        setSafeWithdrawalRate(response?.safeWithdrawalRate ?? PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE);
      } catch {
        if (isCancelled) {
          return;
        }

        loadedPreferencesForUserRef.current = null;
        setCurrencyCode('USD');
        setReturnDisplayMode(PLANNER_DEFAULT_RETURN_DISPLAY_MODE);
        setInflationRate(PLANNER_DEFAULT_INFLATION_RATE);
        setSafeWithdrawalRate(PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE);
      }
    };

    void loadPreferences();

    return () => {
      isCancelled = true;
    };
  }, [getOne, isLoaded, isSignedIn, user?.id]);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      user,
      userId: user?.id ?? '',
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      currencyCode,
      setCurrencyCode: updateCurrencyCode,
      returnDisplayMode,
      setReturnDisplayMode: updateReturnDisplayMode,
      inflationRate,
      setInflationRate: updateInflationRate,
      safeWithdrawalRate,
      setSafeWithdrawalRate: updateSafeWithdrawalRate,
      plannerDesiredInvestmentAmount,
      setPlannerDesiredInvestmentAmount,
      plannerMonthlyExpenses,
      setPlannerMonthlyExpenses,
      plannerRetirementMethod,
      setPlannerRetirementMethod,
      plannerFireLifestyleIndex,
      setPlannerFireLifestyleIndex,
      plannerSummary,
      setPlannerSummary,
      plannerPeople,
      setPlannerPeople,
      plannerAccounts,
      setPlannerAccounts,
      plannerAssetFinanceDetailsByAccountId,
      setPlannerAssetFinanceDetailsByAccountId,
    }),
    [
      user,
      isLoaded,
      isSignedIn,
      currencyCode,
      updateCurrencyCode,
      returnDisplayMode,
      updateReturnDisplayMode,
      inflationRate,
      updateInflationRate,
      safeWithdrawalRate,
      updateSafeWithdrawalRate,
      plannerDesiredInvestmentAmount,
      plannerMonthlyExpenses,
      plannerRetirementMethod,
      plannerFireLifestyleIndex,
      plannerSummary,
      plannerPeople,
      plannerAccounts,
      plannerAssetFinanceDetailsByAccountId,
    ],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
};

// Custom hook for consuming the CurrentUserContext
export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
};
