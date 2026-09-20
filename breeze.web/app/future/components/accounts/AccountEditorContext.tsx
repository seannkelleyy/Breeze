'use client';
import { useCallback, useContext, type ReactNode } from 'react';
import { createContext } from 'react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import type { HomeGrowthProfile } from '../../types/finance';
import { usePlannerAccounts } from '../../hooks/planner/index';
import { useAccountMutations } from '../../hooks/planner/useAccountMutations';
import { usePlannerState } from '../../providers/PlannerStateProvider';
import type { PlannerAccount } from '../../types/account';

/**
 * Everything `AccountListItem` needs, assembled once: planner options, type
 * guards, pure helpers, mutations, and the canonical save/delete (including
 * combined asset + loan handling). Mount `AccountEditorProvider` above any
 * tree rendering `AccountListItem`s; items read the editor from context, so
 * call sites pass only the account itself.
 */

type AccountEditor = ReturnType<typeof useAccountEditorState>;

const AccountEditorContext = createContext<AccountEditor | null>(null);

export function AccountEditorProvider({ children }: { children: ReactNode }) {
  const editor = useAccountEditorState();
  return <AccountEditorContext.Provider value={editor}>{children}</AccountEditorContext.Provider>;
}

export function useAccountEditor(): AccountEditor {
  const editor = useContext(AccountEditorContext);
  if (!editor) {
    throw new Error('useAccountEditor must be used within an AccountEditorProvider');
  }
  return editor;
}

function useAccountEditorState() {
  const { userId, currencyCode } = useCurrentUser();
  const { plannerPeople, plannerAccounts, plannerAssetFinanceDetailsByAccountId, setPlannerAssetFinanceDetailsByAccountId } =
    usePlannerState();
  const {
    options,
    typeGuards,
    helpers,
    data,
    actions: { updateAccount, removeAccount, updateAssetFinanceDetails, addAccount, addLiability },
  } = usePlannerAccounts();
  const {
    isIrsAccountsLoading,
    isIrsAccountsError,
    totalPlannedMonthlyEmployee,
    totalPlannedMonthlyMatch,
    totalPlannedMonthlyInvestment,
  } = data;
  const accountMutations = useAccountMutations({ userId, updateAccount, removeAccount });

  const saveAccount = useCallback(
    async (account: PlannerAccount) => {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        account.id,
      );
      const isLiability = typeGuards.isLiabilityAccountType(account.accountType);
      const details = plannerAssetFinanceDetailsByAccountId[account.id];

      try {
        if (isLiability) {
          if (!isValidUuid) await accountMutations.createLiabilityMutation.mutateAsync(account);
          else await accountMutations.updateLiabilityMutation.mutateAsync(account);
          return;
        }

        // Combined asset with loan: ensure the linked liability exists and
        // stays in sync with the loan details.
        if (
          typeGuards.isCombinedAssetType(account.accountType) &&
          details?.hasLoan
        ) {
          if (!account.linkedLiabilityId) {
            const loanAccount: PlannerAccount = {
              ...account,
              id: `local-${crypto.randomUUID()}`,
              name: `${account.name} Loan`,
              accountType: account.accountType === 'home' ? 'mortgage' : 'auto-loan',
              startingBalance: details.currentLoanBalance,
              annualRate: details.loanInterestRate,
              contributionMode: 'monthly',
              contributionValue: details.loanMonthlyPayment,
              originalLoanAmount: details.originalLoanAmount,
            };
            const resp = await accountMutations.createLiabilityMutation.mutateAsync(loanAccount);
            const newLiabilityId = (resp as { createLiability: { id: string } }).createLiability.id;
            const assetWithLink = { ...account, linkedLiabilityId: newLiabilityId };
            if (!isValidUuid) await accountMutations.createAssetMutation.mutateAsync(assetWithLink);
            else await accountMutations.updateAssetMutation.mutateAsync(assetWithLink);
            return;
          }

          const linkedLiability: PlannerAccount = {
            id: account.linkedLiabilityId,
            name: `${account.name} Loan`,
            personIds: account.personIds,
            accountType: account.accountType === 'home' ? 'mortgage' : 'auto-loan',
            contributionMode: 'monthly',
            contributionValue: details.loanMonthlyPayment,
            employerMatchRate: 0,
            employerMatchMaxPercentOfSalary: 0,
            startingBalance: details.currentLoanBalance,
            annualRate: details.loanInterestRate,
            returnProfile: null,
            purchaseDate: null,
            purchasePrice: null,
            homeGrowthProfile: null,
            vehicleDepreciationProfile: null,
            linkedLiabilityId: null,
            plaidAccountId: null,
            lastValueUpdatedAt: null,
            originalLoanAmount: details.originalLoanAmount,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          };
          await Promise.all([
            isValidUuid
              ? accountMutations.updateAssetMutation.mutateAsync(account)
              : accountMutations.createAssetMutation.mutateAsync(account),
            accountMutations.updateLiabilityMutation.mutateAsync(linkedLiability),
          ]);
          return;
        }

        // Combined asset without loan: unlink the stale liability if needed.
        if (
          typeGuards.isCombinedAssetType(account.accountType) &&
          account.linkedLiabilityId &&
          !details?.hasLoan
        ) {
          const unlinked = { ...account, linkedLiabilityId: null };
          if (!isValidUuid) await accountMutations.createAssetMutation.mutateAsync(unlinked);
          else await accountMutations.updateAssetMutation.mutateAsync(unlinked);
          return;
        }

        if (!isValidUuid) await accountMutations.createAssetMutation.mutateAsync(account);
        else await accountMutations.updateAssetMutation.mutateAsync(account);
      } finally {
        accountMutations.invalidatePlanner();
      }
    },
    [accountMutations, plannerAssetFinanceDetailsByAccountId, typeGuards],
  );

  const deleteAccount = useCallback(
    async (account: PlannerAccount) => {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        account.id,
      );
      const isLiability = typeGuards.isLiabilityAccountType(account.accountType);
      if (isValidUuid) {
        try {
          if (isLiability) await accountMutations.deleteLiabilityMutation.mutateAsync(account.id);
          else await accountMutations.deleteAssetMutation.mutateAsync(account.id);
        } finally {
          accountMutations.invalidatePlanner();
        }
      } else {
        removeAccount(account.id);
      }
    },
    [accountMutations, removeAccount, typeGuards],
  );

  return {
    // data
    data: {
      accounts: plannerAccounts,
      people: plannerPeople,
      isIrsAccountsLoading,
      isIrsAccountsError,
      totalPlannedMonthlyEmployee,
      totalPlannedMonthlyMatch,
      totalPlannedMonthlyInvestment,
    },
    accounts: plannerAccounts,
    people: plannerPeople,
    currencyCode,
    assetFinanceDetailsByAccountId: plannerAssetFinanceDetailsByAccountId,
    // options / guards / helpers
    options: {
      ...options,
      defaultHomeGrowthProfile: options.defaultHomeGrowthProfile as HomeGrowthProfile,
    },
    typeGuards,
    helpers,
    // actions & mutations
    updateAccount,
    removeAccount,
    updateAssetFinanceDetails,
    addAccount,
    addLiability,
    setPlannerAssetFinanceDetailsByAccountId,
    accountMutations,
    saveAccount,
    deleteAccount,
  };
}
