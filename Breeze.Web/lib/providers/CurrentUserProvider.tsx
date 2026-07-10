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

import useGraphql from '../services/useGraphql';

import {
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

const DEV_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CURRENT_USER_QUERY = `
  query CurrentUserPreferences {
    me {
      id
      identityProviderId
      email
      returnType
      safeWithdrawalRate
      currencyType
      inflationRate
      deductionType
      deductionAmount
      maxTaxBracketId
      filingStatus
      payoffStrategy
    }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUserPreferences($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
    }
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUserPreferences($input: CreateUserInput!) {
    createUser(input: $input) {
      id
    }
  }
`;

const getBackendUserID = (user: ReturnType<typeof useUser>['user']): string => {
  const metadataUserID = user?.publicMetadata?.userId;
  if (typeof metadataUserID === 'string' && UUID_V4_PATTERN.test(metadataUserID)) {
    return metadataUserID;
  }

  const clerkUserID = user?.id;
  if (typeof clerkUserID === 'string' && UUID_V4_PATTERN.test(clerkUserID)) {
    return clerkUserID;
  }

  return DEV_USER_ID;
};

export type PlannerRetirementMethod = 'target-amount' | 'fire' | 'income-replacement';

export interface CurrentUserContextValue {
  user: ReturnType<typeof useUser>['user'];
  userId: string;
  isLoaded: boolean;
  isSignedIn: boolean;
  currencyCode: string;
  setCurrencyCode: (nextCurrencyCode: string) => void;
  updateCurrencyCode: (nextCurrencyCode: string) => void;
  returnDisplayMode: 'real' | 'nominal';
  setReturnDisplayMode: (nextReturnDisplayMode: 'real' | 'nominal') => void;
  updateReturnDisplayMode: (nextReturnDisplayMode: 'real' | 'nominal') => void;
  inflationRate: number;
  setInflationRate: (nextInflationRate: number) => void;
  updateInflationRate: (nextInflationRate: number) => void;
  safeWithdrawalRate: number;
  setSafeWithdrawalRate: (nextSafeWithdrawalRate: number) => void;
  updateSafeWithdrawalRate: (nextSafeWithdrawalRate: number) => void;
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

export const CurrentUserProvider = ({ children }: CurrentUserProviderProps) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { request } = useGraphql();
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
  const [deductionType, setDeductionType] = useState<'STANDARD' | 'ITEMIZED'>('STANDARD');
  const [deductionAmount, setDeductionAmount] = useState<string | null>(null);
  const [maxTaxBracketId, setMaxTaxBracketId] = useState<string | null>(null);
  const [filingStatus, setFilingStatus] = useState<'SINGLE' | 'MFJ' | 'MFS' | 'HOH'>('SINGLE');
  const [payoffStrategy, setPayoffStrategy] = useState<'AVALANCHE' | 'SNOWBALL'>('AVALANCHE');
  const [plannerPeople, setPlannerPeople] = useState<PlannerPerson[]>([]);
  const [plannerAccounts, setPlannerAccounts] = useState<PlannerAccount[]>([]);
  const [plannerAssetFinanceDetailsByAccountId, setPlannerAssetFinanceDetailsByAccountId] =
    useState<Record<string, AssetFinanceDetails>>({});
  const [resolvedUserId, setResolvedUserId] = useState<string>('');
  const providerKey = isSignedIn ? (user?.id ?? 'signed-in') : 'signed-out';
  const backendUserID = useMemo(() => getBackendUserID(user), [user]);

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
        const input = {
          id: resolvedUserId,
          identityProviderId: user?.publicMetadata?.userId?.toString() ?? user?.id ?? '',
          email: user?.emailAddresses[0]?.emailAddress ?? '',
          returnType: nextReturnDisplayMode === 'real' ? 'REAL' : 'NOMINAL',
          safeWithdrawalRate: (nextSafeWithdrawalRate / 100).toFixed(4),
          currencyType: nextCurrencyCode,
          inflationRate: (nextInflationRate / 100).toFixed(4),
          deductionType,
          deductionAmount,
          maxTaxBracketId,
          filingStatus,
          payoffStrategy,
        };

        await request<{ updateUser: { id: string } }, { input: typeof input }>(
          UPDATE_USER_MUTATION,
          {
            input,
          },
        );
      } catch {
        // Keep optimistic UI state and allow future writes.
      }
    },
    [
      isLoaded,
      isSignedIn,
      resolvedUserId,
      user,
      request,
      deductionType,
      deductionAmount,
      maxTaxBracketId,
      filingStatus,
      payoffStrategy,
    ],
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
    [persistPreferences, returnDisplayMode, inflationRate, safeWithdrawalRate],
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
    [persistPreferences, currencyCode, inflationRate, safeWithdrawalRate],
  );
  const hydrateReturnDisplayMode = useCallback(
    (nextReturnDisplayMode: 'real' | 'nominal') => {
      setReturnDisplayMode(nextReturnDisplayMode);
    },
    [],
  );
  const hydrateCurrencyCode = useCallback((next: string) => setCurrencyCode(next), []);
  const hydrateInflationRate = useCallback((next: number) => setInflationRate(next), []);
  const hydrateSafeWithdrawalRate = useCallback((next: number) => setSafeWithdrawalRate(next), []);

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
    [persistPreferences, currencyCode, returnDisplayMode, safeWithdrawalRate],
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
    [persistPreferences, currencyCode, returnDisplayMode, inflationRate],
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      return;
    }

    const userId = backendUserID;
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
        const response = await request<{
          me: {
            id: string;
            identityProviderId: string;
            email: string;
            returnType: 'REAL' | 'NOMINAL';
            safeWithdrawalRate: string;
            currencyType: string;
            inflationRate: string;
            deductionType: 'STANDARD' | 'ITEMIZED';
            deductionAmount: string | null;
            maxTaxBracketId: string | null;
            filingStatus: 'SINGLE' | 'MFJ' | 'MFS' | 'HOH';
            payoffStrategy: 'AVALANCHE' | 'SNOWBALL';
          } | null;
        }>(CURRENT_USER_QUERY);

        if (isCancelled) {
          return;
        }

        if (response?.me) {
          setResolvedUserId(response.me.id);
          setCurrencyCode(response.me.currencyType ?? 'USD');
          setReturnDisplayMode(response.me.returnType === 'REAL' ? 'real' : 'nominal');
          setInflationRate(
            Number.parseFloat(response.me.inflationRate) * 100 || PLANNER_DEFAULT_INFLATION_RATE,
          );
          setSafeWithdrawalRate(
            Number.parseFloat(response.me.safeWithdrawalRate) * 100 ||
              PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE,
          );
          setDeductionType(response.me.deductionType ?? 'STANDARD');
          setDeductionAmount(response.me.deductionAmount ?? null);
          setMaxTaxBracketId(response.me.maxTaxBracketId ?? null);
          setFilingStatus(response.me.filingStatus ?? 'SINGLE');
          setPayoffStrategy(response.me.payoffStrategy ?? 'AVALANCHE');
          loadedPreferencesForUserRef.current = backendUserID;
          return;
        }

        const identityProviderId = user?.publicMetadata?.userId?.toString() ?? user?.id ?? '';
        const email = user?.emailAddresses[0]?.emailAddress ?? '';
        if (identityProviderId && email) {
          const createResp = await request<
            { createUser: { id: string } },
            { input: Record<string, unknown> }
          >(CREATE_USER_MUTATION, {
            input: {
              identityProviderId,
              email,
              returnType: returnDisplayMode === 'real' ? 'REAL' : 'NOMINAL',
              safeWithdrawalRate: (safeWithdrawalRate / 100).toFixed(4),
              currencyType: currencyCode,
              inflationRate: (inflationRate / 100).toFixed(4),
              deductionType,
              deductionAmount,
              maxTaxBracketId,
              filingStatus,
              payoffStrategy,
            },
          });
          if (createResp?.createUser?.id) setResolvedUserId(createResp.createUser.id);
        }
      } catch {
        if (isCancelled) {
          return;
        }

        loadedPreferencesForUserRef.current = null;
        setResolvedUserId(backendUserID);
        setCurrencyCode('USD');
        setReturnDisplayMode(PLANNER_DEFAULT_RETURN_DISPLAY_MODE);
        setInflationRate(PLANNER_DEFAULT_INFLATION_RATE);
        setSafeWithdrawalRate(PLANNER_DEFAULT_SAFE_WITHDRAWAL_RATE);
        setDeductionType('STANDARD');
        setDeductionAmount(null);
        setMaxTaxBracketId(null);
        setFilingStatus('SINGLE');
        setPayoffStrategy('AVALANCHE');
      }
    };

    void loadPreferences();

    return () => {
      isCancelled = true;
    };
  }, [
    backendUserID,
    currencyCode,
    deductionAmount,
    deductionType,
    filingStatus,
    inflationRate,
    isLoaded,
    isSignedIn,
    maxTaxBracketId,
    payoffStrategy,
    request,
    returnDisplayMode,
    safeWithdrawalRate,
    user?.emailAddresses,
    user?.id,
    user?.publicMetadata,
  ]);

  const value: CurrentUserContextValue = {
    user,
    userId: resolvedUserId,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    currencyCode,
    setCurrencyCode: hydrateCurrencyCode,
    updateCurrencyCode,
    returnDisplayMode,
    setReturnDisplayMode: hydrateReturnDisplayMode,
    updateReturnDisplayMode,
    inflationRate,
    setInflationRate: hydrateInflationRate,
    updateInflationRate,
    safeWithdrawalRate,
    setSafeWithdrawalRate: hydrateSafeWithdrawalRate,
    updateSafeWithdrawalRate,
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
  };

  return (
    <CurrentUserContext.Provider key={providerKey} value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

// Custom hook for consuming the CurrentUserContext
export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
};
