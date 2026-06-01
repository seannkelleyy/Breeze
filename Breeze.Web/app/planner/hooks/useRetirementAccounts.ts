'use client';
import {
    CREATE_RETIREMENT_ACCOUNT,
    DELETE_RETIREMENT_ACCOUNT,
    GET_RETIREMENT_ACCOUNTS,
    UPDATE_RETIREMENT_ACCOUNT,
} from '@/lib/services/queries/retirementAccounts'
import useGraphql from '@/lib/services/useGraphql'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface RetirementAccountData {
  id: string;
  userId: string;
  name: string;
  accountType: 'ACCOUNT_401K' | 'ACCOUNT_403B' | 'ACCOUNT_457' | 'ROTH_IRA' | 'TRADITIONAL_IRA' | 'HSA' | 'OTHER';
  owner: 'SELF' | 'SPOUSE';
  taxTreatment: 'PRE_TAX' | 'ROTH' | 'TAX_DEFERRED' | 'TAXABLE' | 'OTHER';
  currentBalance: string;
  annualContributionLimit: string;
  createdAt: string;
  updatedAt: string;
}

// GraphQL Response Types
interface GetRetirementAccountsPayload {
  retirementAccounts: RetirementAccountData[];
}

interface CreateRetirementAccountPayload {
  createRetirementAccount: RetirementAccountData;
}

interface UpdateRetirementAccountPayload {
  updateRetirementAccount: RetirementAccountData;
}

interface DeleteRetirementAccountPayload {
  deleteRetirementAccount: boolean;
}

interface QueryVariables {
  userId: string;
}

interface CreateAccountInput {
  input: Omit<RetirementAccountData, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { userId: string };
}

interface UpdateAccountInput {
  input: Partial<RetirementAccountData> & { id: string };
}

interface DeleteInput {
  id: string;
}

export function useRetirementAccounts(userId: string | null) {
  const { request } = useGraphql();
  const queryClient = useQueryClient();

  // Query: Get all accounts
  const accountsQuery = useQuery({
    queryKey: ['retirement-accounts', userId],
    queryFn: async () => {
      const result = await request<GetRetirementAccountsPayload, QueryVariables>(GET_RETIREMENT_ACCOUNTS, { userId: userId || '' });
      return result.retirementAccounts as RetirementAccountData[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation: Create account
  const createMutation = useMutation({
    mutationFn: async (input: Omit<RetirementAccountData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const result = await request<CreateRetirementAccountPayload, CreateAccountInput>(CREATE_RETIREMENT_ACCOUNT, {
        input: {
          ...input,
          userId: userId || '',
        },
      });
      return result.createRetirementAccount as RetirementAccountData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retirement-accounts', userId] });
    },
  });

  // Mutation: Update account
  const updateMutation = useMutation({
    mutationFn: async (input: Partial<RetirementAccountData> & { id: string }) => {
      const result = await request<UpdateRetirementAccountPayload, UpdateAccountInput>(UPDATE_RETIREMENT_ACCOUNT, { input });
      return result.updateRetirementAccount as RetirementAccountData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retirement-accounts', userId] });
    },
  });

  // Mutation: Delete account
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await request<DeleteRetirementAccountPayload, DeleteInput>(DELETE_RETIREMENT_ACCOUNT, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retirement-accounts', userId] });
    },
  });

  return {
    accounts: accountsQuery.data || [],
    isLoading: accountsQuery.isLoading,
    isError: accountsQuery.isError,
    error: accountsQuery.error,
    
    // CRUD operations
    createAccount: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    
    updateAccount: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    deleteAccount: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

export default useRetirementAccounts;
