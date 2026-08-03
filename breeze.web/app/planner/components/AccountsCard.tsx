'use client';
import { type ReactNode, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { formatCurrencyWithCode } from '../lib/plannerMath';
import { usePlannerAccounts } from '../hooks/planner/index';
import { useAccountMutations } from '../hooks/planner/useAccountMutations';
import { AccountListItem } from './accounts/AccountListItem';
import { PlannerAccount } from '../types/account';
import { HomeGrowthProfile } from '../types/finance';

export interface AccountsCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
}

type AccountFilter = 'all' | 'assets' | 'liabilities' | 'tax-advantaged';

const AccountsCard = ({ collapsed, toggleControl }: AccountsCardProps) => {
  const { currencyCode, userId } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);

  const [collapsedAccountIds, setCollapsedAccountIds] = useState<Record<string, boolean>>({});
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');

  const { data, options, typeGuards, helpers, actions } = usePlannerAccounts();

  // Keep collapsed state in sync when accounts change
  const syncedCollapsedIds = useMemo(() => {
    const next: Record<string, boolean> = {};
    for (const a of data.plannerAccounts) next[a.id] = collapsedAccountIds[a.id] ?? false;
    return next;
  }, [data.plannerAccounts, collapsedAccountIds]);

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

  const toggleCollapse = (id: string) => setCollapsedAccountIds((p) => ({ ...p, [id]: !p[id] }));

  const filteredAccounts = useMemo(() => {
    switch (accountFilter) {
      case 'assets':
        return plannerAccounts.filter((a) => !isLiabilityAccountType(a.accountType));
      case 'liabilities':
        return plannerAccounts.filter((a) => {
          if (isLiabilityAccountType(a.accountType)) return true;
          if (isCombinedAssetType(a.accountType))
            return assetFinanceDetailsByAccountId[a.id]?.hasLoan ?? false;
          return false;
        });
      case 'tax-advantaged':
        return plannerAccounts.filter(
          (a) => getSuggestedAnnualLimitForAccount(a.accountType, 40) > 0,
        );
      default:
        return plannerAccounts;
    }
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

    if (isLiability) {
      if (!isValidUuid) mutations.createLiabilityMutation.mutate(account);
      else mutations.updateLiabilityMutation.mutate(account);
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
        try {
          const resp = await mutations.createLiabilityMutation.mutateAsync(loanAccount);
          const newLiabilityId = (resp as { createLiability: { id: string } }).createLiability.id;
          // Save asset with linked liability
          const assetWithLink = { ...account, linkedLiabilityId: newLiabilityId };
          if (!isValidUuid) mutations.createAssetMutation.mutate(assetWithLink);
          else mutations.updateAssetMutation.mutate(assetWithLink);
        } catch {
          // Liability creation failed, save asset without link
          if (!isValidUuid) mutations.createAssetMutation.mutate(account);
          else mutations.updateAssetMutation.mutate(account);
        }
        return;
      }

      // Linked liability exists: save asset + update liability
      if (!isValidUuid) mutations.createAssetMutation.mutate(account);
      else mutations.updateAssetMutation.mutate(account);

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
        originalLoanAmount: details.originalLoanAmount,
      };
      mutations.updateLiabilityMutation.mutate(linkedLiability);
      return;
    }

    // Combined asset without loan: unlink if needed
    if (
      isCombinedAssetType(account.accountType) &&
      account.linkedLiabilityId &&
      !assetFinanceDetailsByAccountId[account.id]?.hasLoan
    ) {
      const unlinked = { ...account, linkedLiabilityId: null };
      if (!isValidUuid) mutations.createAssetMutation.mutate(unlinked);
      else mutations.updateAssetMutation.mutate(unlinked);
      return;
    }

    if (!isValidUuid) mutations.createAssetMutation.mutate(account);
    else mutations.updateAssetMutation.mutate(account);
  };

  const handleDelete = (account: PlannerAccount) => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      account.id,
    );
    const isLiability = isLiabilityAccountType(account.accountType);
    if (isValidUuid) {
      if (isLiability) mutations.deleteLiabilityMutation.mutate(account.id);
      else mutations.deleteAssetMutation.mutate(account.id);
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Add investment and non-investment assets (home, vehicle, emergency fund, checking),
            contributions, and growth assumptions.
          </CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed && (
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              IRS limits apply only to tax-advantaged account types.
            </p>
            {isIrsAccountsLoading && (
              <p className="text-muted-foreground text-xs">Loading latest IRS limits...</p>
            )}
            {isIrsAccountsError && (
              <p className="text-destructive text-xs">
                Unable to load IRS limits. Using fallback defaults.
              </p>
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
                isAccountCollapsed={syncedCollapsedIds[account.id] ?? false}
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
                onToggleCollapse={toggleCollapse}
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
              <div className="text-muted-foreground rounded-md border p-4 text-sm xl:col-span-2">
                No accounts match this filter.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              <p>
                Planned employee contribution / payment:{' '}
                {formatCurrency(totalPlannedMonthlyEmployee)}/month
              </p>
              <p>Planned employer match: {formatCurrency(totalPlannedMonthlyMatch)}/month</p>
              <p>
                Total planned contribution: {formatCurrency(totalPlannedMonthlyInvestment)}/month
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

          <p className="text-muted-foreground text-xs">
            Annual limits are read from your IRS account configuration in the API.
          </p>
          <p className="text-muted-foreground text-xs">
            401(k) formula: Employer match = min(employee annual contribution, salary x match cap %)
            x match rate %.
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default AccountsCard;
