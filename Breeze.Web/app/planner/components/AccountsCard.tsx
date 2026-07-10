'use client';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
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
  const { currencyCode, userId, setPlannerAccounts } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);

  const [collapsedAccountIds, setCollapsedAccountIds] = useState<Record<string, boolean>>({});
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, options, typeGuards, helpers, actions } = usePlannerAccounts();
  const {
    plannerAccounts,
    assetFinanceDetailsByAccountId,
    people,
    hasSpouse,
    selfBirthday,
    selfAnnualIncome,
    spouseAnnualIncome,
    isIrsAccountsLoading,
    isIrsAccountsError,
    totalPlannedMonthlyEmployee,
    totalPlannedMonthlyMatch,
    totalPlannedMonthlyInvestment,
  } = data;
  const {
    accountOwnerOptions,
    accountRateProfileOptions,
    accountTypeOptions,
    contributionModeOptions,
    liabilityContributionModeOptions,
    liabilityTypeOptions,
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
    getEmployeeMonthlyContribution,
    getEmployerMatchMonthly,
    getSuggestedAnnualLimitForAccount,
    getDisplayedRateForAccount,
    getStoredAnnualRateForInput,
    getRateProfileFromAnnualRate,
    getAnnualRateFromProfile,
    getAssetFinanceSnapshot,
    getDefaultAssetFinanceDetailsForAccount,
    getHomeAnnualGrowthRate,
    getAgeFromBirthday,
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

  // Track per-account collapse
  useEffect(() => {
    setCollapsedAccountIds((prev) => {
      const next: Record<string, boolean> = {};
      for (const a of plannerAccounts) next[a.id] = prev[a.id] ?? false;
      return next;
    });
  }, [plannerAccounts]);

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
          (a) => getSuggestedAnnualLimitForAccount(a.accountType, 40, hasSpouse) > 0,
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
    hasSpouse,
  ]);

  const handleSave = async (account: PlannerAccount) => {
    setSaveError(null);
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      account.id,
    );
    const isLiability = isLiabilityAccountType(account.accountType);
    try {
      if (isLiability) {
        if (!isValidUuid) await mutations.createLiabilityMutation.mutateAsync(account);
        else await mutations.updateLiabilityMutation.mutateAsync(account);
      } else {
        if (!isValidUuid) await mutations.createAssetMutation.mutateAsync(account);
        else await mutations.updateAssetMutation.mutateAsync(account);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save account');
    }
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

  const isSaving =
    mutations.createAssetMutation.isPending ||
    mutations.updateAssetMutation.isPending ||
    mutations.createLiabilityMutation.isPending ||
    mutations.updateLiabilityMutation.isPending;

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
                selfBirthday={selfBirthday}
                selfAnnualIncome={selfAnnualIncome}
                spouseAnnualIncome={spouseAnnualIncome}
                hasSpouse={hasSpouse}
                assetFinanceDetails={assetFinanceDetailsByAccountId[account.id]}
                isAccountCollapsed={collapsedAccountIds[account.id] ?? false}
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
                accountOwnerOptions={accountOwnerOptions}
                accountRateProfileOptions={accountRateProfileOptions}
                accountTypeOptions={accountTypeOptions}
                contributionModeOptions={contributionModeOptions}
                liabilityContributionModeOptions={liabilityContributionModeOptions}
                liabilityTypeOptions={liabilityTypeOptions}
                homeGrowthProfileOptions={homeGrowthProfileOptions}
                vehicleDepreciationProfileOptions={vehicleDepreciationProfileOptions}
                defaultHomeGrowthProfile={defaultHomeGrowthProfile as HomeGrowthProfile}
                defaultVehicleDepreciationProfile={defaultVehicleDepreciationProfile}
                defaultHomeAppreciationRate={defaultHomeAppreciationRate}
                defaultVehicleDepreciationRate={defaultVehicleDepreciationRate}
                onToggleCollapse={toggleCollapse}
                onSave={handleSave}
                onDelete={handleDelete}
                isSaving={isSaving}
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

          {saveError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}

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
