'use client';
import {
    CREATE_ASSET,
    CREATE_LIABILITY,
    DELETE_ASSET,
    DELETE_LIABILITY,
    UPDATE_ASSET,
    UPDATE_LIABILITY,
} from '@/lib/services/queries/assets'
import useGraphql from '@/lib/services/useGraphql'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { PlannerAccount } from '../types/account'

interface AssetPayload {
  createAsset?: { id: string; name: string };
  updateAsset?: { id: string; name: string };
  createLiability?: { id: string; name: string };
  updateLiability?: { id: string; name: string };
}

interface AssetInput {
  input: {
    userId: string;
    id?: string;
    name: string;
    assetType?: string;
    currentValue?: string;
    liabilityType?: string;
    currentBalance?: string;
    interestRate?: string;
    minimumPayment?: string;
    targetExtraPayment?: string;
    payoffPriority?: number;
  };
}

const isLiability = (account: PlannerAccount): boolean => {
  return account.accountType.includes('loan') || account.accountType.includes('mortgage') || account.accountType.includes('credit');
};

export function useAccountsPersist(userId: string | null, accounts: PlannerAccount[], savedAccountIds: Set<string>) {
  const { request } = useGraphql();
  const queryClient = useQueryClient();
  const previousAccountsRef = useRef<Map<string, PlannerAccount>>(new Map());
  const pendingOperationsRef = useRef<string[]>([]);

  const createAssetMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      await request<AssetPayload, AssetInput>(CREATE_ASSET, {
        input: {
          userId: userId || '',
          name: account.name,
          assetType: account.accountType,
          currentValue: account.startingBalance.toString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      await request<AssetPayload, AssetInput>(UPDATE_ASSET, {
        input: {
          userId: userId || '',
          id: account.id,
          name: account.name,
          assetType: account.accountType,
          currentValue: account.startingBalance.toString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] });
    },
  });

  const createLiabilityMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      await request<AssetPayload, AssetInput>(CREATE_LIABILITY, {
        input: {
          userId: userId || '',
          name: account.name,
          liabilityType: account.accountType,
          currentBalance: account.startingBalance.toString(),
          interestRate: (account.annualRate / 100).toFixed(4),
          minimumPayment: account.contributionValue?.toString() || '0',
          targetExtraPayment: '0',
          payoffPriority: 0,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities', userId] });
    },
  });

  const updateLiabilityMutation = useMutation({
    mutationFn: async (account: PlannerAccount) => {
      await request<AssetPayload, AssetInput>(UPDATE_LIABILITY, {
        input: {
          userId: userId || '',
          id: account.id,
          name: account.name,
          liabilityType: account.accountType,
          currentBalance: account.startingBalance.toString(),
          interestRate: (account.annualRate / 100).toFixed(4),
          minimumPayment: account.contributionValue?.toString() || '0',
          targetExtraPayment: '0',
          payoffPriority: 0,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities', userId] });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await request(DELETE_ASSET, { id: accountId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] });
    },
  });

  const deleteLiabilityMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await request(DELETE_LIABILITY, { id: accountId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities', userId] });
    },
  });

  // Monitor account changes and persist
  useEffect(() => {
    if (!userId) return;

    const previousAccounts = previousAccountsRef.current;
    const currentAccountsMap = new Map(accounts.map((a) => [a.id, a]));

    // Check for deleted accounts
    previousAccounts.forEach((prevAccount, accountId) => {
      if (!currentAccountsMap.has(accountId) && savedAccountIds.has(accountId)) {
        // Account was deleted
        if (isLiability(prevAccount)) {
          deleteLiabilityMutation.mutate(accountId);
        } else {
          deleteAssetMutation.mutate(accountId);
        }
      }
    });

    // Check for new or modified accounts
    currentAccountsMap.forEach((currentAccount, accountId) => {
      const prevAccount = previousAccounts.get(accountId);
      const isNew = !savedAccountIds.has(accountId);
      const isModified = prevAccount && JSON.stringify(prevAccount) !== JSON.stringify(currentAccount);

      if (isNew) {
        // New account - create it
        if (isLiability(currentAccount)) {
          createLiabilityMutation.mutate(currentAccount);
        } else {
          createAssetMutation.mutate(currentAccount);
        }
      } else if (isModified && pendingOperationsRef.current.indexOf(accountId) === -1) {
        // Modified account - update it (debounce by not updating immediately)
        pendingOperationsRef.current.push(accountId);
        const timeoutId = setTimeout(() => {
          if (isLiability(currentAccount)) {
            updateLiabilityMutation.mutate(currentAccount);
          } else {
            updateAssetMutation.mutate(currentAccount);
          }
          pendingOperationsRef.current = pendingOperationsRef.current.filter((id) => id !== accountId);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    });

    // Update previous accounts reference
    previousAccountsRef.current = currentAccountsMap;
  }, [userId, accounts, savedAccountIds, createAssetMutation, updateAssetMutation, deleteAssetMutation, createLiabilityMutation, updateLiabilityMutation, deleteLiabilityMutation]);
}

export default useAccountsPersist;
