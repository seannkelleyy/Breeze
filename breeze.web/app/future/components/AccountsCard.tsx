'use client';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { getEmployeeMonthlyContribution } from '../lib/plannerMath';
import { formatCurrencyWithCode } from '@/lib/utils';
import { usePlannerAccounts } from '../hooks/planner/index';
import { useAccountMutations } from '../hooks/planner/useAccountMutations';
import { AccountListItem } from './accounts/AccountListItem';
import { PlannerAccount, AccountType } from '../types/account';
import { HomeGrowthProfile } from '../types/finance';

export interface AccountsCardProps {
  collapsed: boolean;
}

type AccountFilter = 'all' | 'assets' | 'liabilities' | 'tax-advantaged';

const ACCOUNT_TYPE_ORDER: Record<AccountType, number> = {
  checking: 0,
  'emergency-fund': 1,
  brokerage: 2,
  '401k': 3,
  '403b': 4,
  '457': 5,
  'roth-ira': 6,
  'traditional-ira': 7,
  hsa: 8,
  home: 9,
  vehicle: 10,
  other: 11,
  'student-loan': 12,
  'credit-card': 13,
  'personal-loan': 14,
  'auto-loan': 15,
  mortgage: 16,
};

const AccountsCard = ({ collapsed }: AccountsCardProps) => {
  const { currencyCode, userId } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);

  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');

  const { data, options, typeGuards, helpers, actions } = usePlannerAccounts();

  const {
    plannerAccounts,
    assetFinanceDetailsByAccountId,
    people,
    isIrsAccountsLoading,
    isIrsAccountsError,
    totalPlannedMonthlyEmployee,
    totalPlannedMonthlyMatch,
    totalPlannedMonthlyInvestment,
  } = data;
  const {
    accountRateProfileOptions,
    accountTypeOptions,
    contributionModeOptions,
    liabilityContributionModeOptions,
    homeGrowthProfileOptions,
    vehicleDepreciationProfileOptions,
    defaultHomeGrowthProfile,
    defaultVehicleDepreciationProfile,
    defaultHomeAppreciationRate,
    defaultVehicleDepreciationRate,
  } = options;
  const {
    isLiabilityAccountType,
    isCombinedAssetType,
    isNonContributingAccountType,
    isDepreciatingAssetType,
  } = typeGuards;

  // Calculate debt payments from liability accounts
  const totalPlannedMonthlyDebtPayments = useMemo(() => {
    return plannerAccounts
      .filter((a) => isLiabilityAccountType(a.accountType))
      .reduce((sum, a) => sum + getEmployeeMonthlyContribution(a, people), 0);
  }, [plannerAccounts, people, isLiabilityAccountType]);
  const {
    getSuggestedAnnualLimitForAccount,
    getDisplayedRateForAccount,
    getStoredAnnualRateForInput,
    getRateProfileFromAnnualRate,
    getAnnualRateFromProfile,
    getDefaultAssetFinanceDetailsForAccount,
    getHomeAnnualGrowthRate,
    toIsoDate,
  } = helpers;
  const {
    updateAccount,
    updateAssetFinanceDetails,
    removeAccount,
    addAccount,
    addLiability,
    setPlannerAssetFinanceDetailsByAccountId,
  } = actions;

  const mutations = useAccountMutations({
    userId,
    updateAccount,
    removeAccount,
  });

  const filteredAccounts = useMemo(() => {
    let accounts: PlannerAccount[];
    switch (accountFilter) {
      case 'assets':
        accounts = plannerAccounts.filter((a) => !isLiabilityAccountType(a.accountType));
        break;
      case 'liabilities':
        accounts = plannerAccounts.filter((a) => {
          if (isLiabilityAccountType(a.accountType)) return true;
          if (isCombinedAssetType(a.accountType))
            return assetFinanceDetailsByAccountId[a.id]?.hasLoan ?? false;
          return false;
        });
        break;
      case 'tax-advantaged':
        accounts = plannerAccounts.filter(
          (a) => getSuggestedAnnualLimitForAccount(a.accountType, 40) > 0,
        );
        break;
      default:
        accounts = plannerAccounts;
    }

    return accounts.sort((a, b) => {
      const typeA = ACCOUNT_TYPE_ORDER[a.accountType] ?? 99;
      const typeB = ACCOUNT_TYPE_ORDER[b.accountType] ?? 99;
      return typeA - typeB;
    });
  }, [
    accountFilter,
    plannerAccounts,
    assetFinanceDetailsByAccountId,
    isLiabilityAccountType,
    isCombinedAssetType,
    getSuggestedAnnualLimitForAccount,
  ]);

  const handleSave = async (account: PlannerAccount) => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      account.id,
    );
    const isLiability = isLiabilityAccountType(account.accountType);

    try {
      if (isLiability) {
        if (!isValidUuid) await mutations.createLiabilityMutation.mutateAsync(account);
        else await mutations.updateLiabilityMutation.mutateAsync(account);
        return;
      }

      // Combined asset with loan: ensure linked liability exists
      if (
        isCombinedAssetType(account.accountType) &&
        assetFinanceDetailsByAccountId[account.id]?.hasLoan
      ) {
        const details = assetFinanceDetailsByAccountId[account.id];
        if (!account.linkedLiabilityId) {
          // Create a liability for the loan
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
          const resp = await mutations.createLiabilityMutation.mutateAsync(loanAccount);
          const newLiabilityId = (resp as { createLiability: { id: string } }).createLiability.id;
          // Save asset with linked liability
          const assetWithLink = { ...account, linkedLiabilityId: newLiabilityId };
          if (!isValidUuid) await mutations.createAssetMutation.mutateAsync(assetWithLink);
          else await mutations.updateAssetMutation.mutateAsync(assetWithLink);
          return;
        }

        // Linked liability exists: save asset + update liability
        const saveAssetPromise = !isValidUuid
          ? mutations.createAssetMutation.mutateAsync(account)
          : mutations.updateAssetMutation.mutateAsync(account);

        // Update the linked liability with loan details
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
          saveAssetPromise,
          mutations.updateLiabilityMutation.mutateAsync(linkedLiability),
        ]);
        return;
      }

      // Combined asset without loan: unlink if needed
      if (
        isCombinedAssetType(account.accountType) &&
        account.linkedLiabilityId &&
        !assetFinanceDetailsByAccountId[account.id]?.hasLoan
      ) {
        const unlinked = { ...account, linkedLiabilityId: null };
        if (!isValidUuid) await mutations.createAssetMutation.mutateAsync(unlinked);
        else await mutations.updateAssetMutation.mutateAsync(unlinked);
        return;
      }

      if (!isValidUuid) await mutations.createAssetMutation.mutateAsync(account);
      else await mutations.updateAssetMutation.mutateAsync(account);
    } finally {
      mutations.invalidatePlanner();
    }
  };

  const handleDelete = async (account: PlannerAccount) => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      account.id,
    );
    const isLiability = isLiabilityAccountType(account.accountType);
    if (isValidUuid) {
      try {
        if (isLiability) await mutations.deleteLiabilityMutation.mutateAsync(account.id);
        else await mutations.deleteAssetMutation.mutateAsync(account.id);
      } finally {
        mutations.invalidatePlanner();
      }
    } else {
      removeAccount(account.id);
    }
  };

  const filterButtons: { key: AccountFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'assets', label: 'Assets' },
    { key: 'liabilities', label: 'Liabilities + Loans' },
    { key: 'tax-advantaged', label: 'Tax-Advantaged' },
  ];

  return (
    <>
      {!collapsed && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {isIrsAccountsLoading && (
              <p className="text-muted-foreground text-xs">Loading IRS limits...</p>
            )}
            {isIrsAccountsError && (
              <p className="text-destructive text-xs">Unable to load IRS limits.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={accountFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAccountFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredAccounts.map((account) => (
              <AccountListItem
                key={account.id}
                account={account}
                currencyCode={currencyCode}
                people={people}
                assetFinanceDetails={assetFinanceDetailsByAccountId[account.id]}
                isLastAccount={plannerAccounts.length === 1}
                isLiabilityAccountType={isLiabilityAccountType}
                isCombinedAssetType={isCombinedAssetType}
                isNonContributingAccountType={isNonContributingAccountType}
                isDepreciatingAssetType={isDepreciatingAssetType}
                getSuggestedAnnualLimitForAccount={getSuggestedAnnualLimitForAccount}
                getDisplayedRateForAccount={getDisplayedRateForAccount}
                getStoredAnnualRateForInput={getStoredAnnualRateForInput}
                getRateProfileFromAnnualRate={getRateProfileFromAnnualRate}
                getAnnualRateFromProfile={getAnnualRateFromProfile}
                accountRateProfileOptions={accountRateProfileOptions}
                accountTypeOptions={accountTypeOptions}
                contributionModeOptions={contributionModeOptions}
                liabilityContributionModeOptions={liabilityContributionModeOptions}
                homeGrowthProfileOptions={homeGrowthProfileOptions}
                vehicleDepreciationProfileOptions={vehicleDepreciationProfileOptions}
                defaultHomeGrowthProfile={defaultHomeGrowthProfile as HomeGrowthProfile}
                defaultVehicleDepreciationProfile={defaultVehicleDepreciationProfile}
                defaultHomeAppreciationRate={defaultHomeAppreciationRate}
                defaultVehicleDepreciationRate={defaultVehicleDepreciationRate}
                onSave={handleSave}
                onDelete={handleDelete}
                onUpdateAccount={(u) => updateAccount(account.id, u)}
                onUpdateAssetFinanceDetails={(u) => updateAssetFinanceDetails(account.id, u)}
                setPlannerAssetFinanceDetailsByAccountId={setPlannerAssetFinanceDetailsByAccountId}
                getDefaultAssetFinanceDetailsForAccount={getDefaultAssetFinanceDetailsForAccount}
                toIsoDate={toIsoDate}
                getHomeAnnualGrowthRate={getHomeAnnualGrowthRate}
              />
            ))}
            {filteredAccounts.length === 0 && (
              <div className="text-muted-foreground rounded-md border p-4 text-sm">
                No accounts match this filter.
              </div>
            )}
          </div>

          <div className="bg-background sticky bottom-0 flex items-center justify-between gap-4 border-t pt-3">
            <div className="text-muted-foreground text-sm">
              <p>
                Personal contributions: {formatCurrency(totalPlannedMonthlyEmployee)}/mo (
                {formatCurrency(totalPlannedMonthlyEmployee * 12)}/yr)
              </p>
              <p>
                Employer match: {formatCurrency(totalPlannedMonthlyMatch)}/mo (
                {formatCurrency(totalPlannedMonthlyMatch * 12)}/yr)
              </p>
              <p>
                Debt payments: {formatCurrency(totalPlannedMonthlyDebtPayments)}/mo (
                {formatCurrency(totalPlannedMonthlyDebtPayments * 12)}/yr)
              </p>
              <p className="text-foreground font-medium">
                Total: {formatCurrency(totalPlannedMonthlyInvestment)}/mo (
                {formatCurrency(totalPlannedMonthlyInvestment * 12)}/yr)
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={addAccount} variant="outline">
                <Plus /> Add Asset
              </Button>
              <Button onClick={addLiability} variant="outline">
                <Plus /> Add Liability
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountsCard;
