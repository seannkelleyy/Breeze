'use client';
import { useState } from 'react';

import {
  CREATE_ASSET,
  CREATE_LIABILITY,
  DELETE_ASSET,
  DELETE_LIABILITY,
  UPDATE_ASSET,
  UPDATE_LIABILITY,
} from '@/lib/services/queries/assets';
import { CREATE_USER_MUTATION, ME_QUERY } from '@/lib/services/queries/users';
import useGraphql from '@/lib/services/useGraphql';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountTypeToApiAssetType } from '../../lib/typeMapping';
import { AccountType, PlannerAccount } from '../../types/account';

interface UseAccountMutationsParams {
  userId: string;
  user: { id: string; emailAddresses?: Array<{ emailAddress: string }> } | null;
  updateAccount: (id: string, updater: (current: PlannerAccount) => PlannerAccount) => void;
  removeAccount: (id: string) => void;
}

function mapAccountTypeToApiType(accountType: string): string {
  return accountTypeToApiAssetType(accountType as AccountType) ?? 'OTHER';
}

function mapAccountTypeToLiabilityType(accountType: string): string {
  switch (accountType) {
    case 'student-loan':
      return 'STUDENT_LOAN';
    case 'credit-card':
      return 'CREDIT_CARD';
    case 'personal-loan':
      return 'PERSONAL_LOAN';
    case 'auto-loan':
      return 'AUTO_LOAN';
    case 'mortgage':
      return 'MORTGAGE';
    default:
      return 'OTHER';
  }
}

function buildLiabilityInput(account: PlannerAccount, liabilityUserId: string) {
  return {
    userId: liabilityUserId,
    name: account.name,
    liabilityType: mapAccountTypeToLiabilityType(account.accountType),
    currentBalance: account.startingBalance.toString(),
    interestRate: (account.annualRate / 100).toFixed(4),
    minimumPayment: account.contributionValue?.toString() || '0',
    targetExtraPayment: '0',
    payoffPriority: 0,
    owner: account.owner,
    contributionMode: account.contributionMode,
    contributionValue: account.contributionValue?.toString() || '0',
  };
}

export function useAccountMutations({
  userId,
  user,
  updateAccount,
  removeAccount,
}: UseAccountMutationsParams) {
  const { request } = useGraphql();
  const queryClient = useQueryClient();
  const [backendUserId, setBackendUserId] = useState<string | null>(null);

  // Ensure user exists in backend before creating assets
  const ensureUserExists = useMutation({
    mutationFn: async (): Promise<string> => {
      if (backendUserId) return backendUserId;
      try {
        const response = await request(ME_QUERY);
        const uid = (response as { me: { id: string } }).me.id;
        setBackendUserId(uid);
        return uid;
      } catch {
        const response = await request(CREATE_USER_MUTATION, {
          input: {
            identityProviderId: user?.id || '',
            email: user?.emailAddresses?.[0]?.emailAddress || '',
            returnType: 'REAL',
            safeWithdrawalRate: '0.04',
            currencyType: 'USD',
            inflationRate: '0.03',
            deductionType: 'STANDARD',
            filingStatus: 'SINGLE',
            payoffStrategy: 'AVALANCHE',
          },
        });
        const uid = (response as { createUser: { id: string } }).createUser.id;
        setBackendUserId(uid);
        return uid;
      }
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      const buid = await ensureUserExists.mutateAsync();
      const response = await request(CREATE_ASSET, {
        input: {
          userId: buid,
          name: account.name,
          assetType: mapAccountTypeToApiType(account.accountType),
          currentValue: account.startingBalance.toString(),
          owner: account.owner,
          contributionMode: account.contributionMode,
          contributionValue: account.contributionValue.toString(),
          employerMatchRate: account.employerMatchRate.toString(),
          employerMatchMaxPercentOfSalary: account.employerMatchMaxPercentOfSalary.toString(),
          annualRate: account.annualRate.toString(),
        },
      });
      updateAccount(account.id, (current) => ({
        ...current,
        id: (response as { createAsset: { id: string } }).createAsset.id,
      }));
      return response;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets', userId] }),
  });

  const updateAssetMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      await request(UPDATE_ASSET, {
        input: {
          id: account.id,
          name: account.name,
          assetType: mapAccountTypeToApiType(account.accountType),
          currentValue: account.startingBalance.toString(),
          owner: account.owner,
          contributionMode: account.contributionMode,
          contributionValue: account.contributionValue.toString(),
          employerMatchRate: account.employerMatchRate.toString(),
          employerMatchMaxPercentOfSalary: account.employerMatchMaxPercentOfSalary.toString(),
          annualRate: account.annualRate.toString(),
        },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets', userId] }),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await request(DELETE_ASSET, { id: accountId });
    },
    onSuccess: (_, accountId) => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] });
      removeAccount(accountId);
    },
  });

  const createLiabilityMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      const buid = await ensureUserExists.mutateAsync();
      const response = await request(CREATE_LIABILITY, {
        input: buildLiabilityInput(account, buid),
      });
      updateAccount(account.id, (current) => ({
        ...current,
        id: (response as { createLiability: { id: string } }).createLiability.id,
      }));
      return response;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liabilities', userId] }),
  });

  const updateLiabilityMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      const { userId: _uid, ...fields } = buildLiabilityInput(account, userId);
      await request(UPDATE_LIABILITY, { input: { id: account.id, ...fields } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liabilities', userId] }),
  });

  const deleteLiabilityMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await request(DELETE_LIABILITY, { id: accountId });
    },
    onSuccess: (_, accountId) => {
      queryClient.invalidateQueries({ queryKey: ['liabilities', userId] });
      removeAccount(accountId);
    },
  });

  return {
    backendUserId,
    ensureUserExists,
    createAssetMutation,
    updateAssetMutation,
    deleteAssetMutation,
    createLiabilityMutation,
    updateLiabilityMutation,
    deleteLiabilityMutation,
  };
}

export default useAccountMutations;
