'use client';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { formatCurrencyWithCode } from '../lib/plannerMath';
import * as plannerConstants from '../lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlannerAccounts } from '../hooks/planner/index';
import { AccountOwner, AccountType, PlannerAccount } from '../types/account';
import { AssetFinanceDetails } from '../types/finance';
import CombinedAssetLoanFields from './accounts/CombinedAssetLoanFields';
import HomeAccountFields from './accounts/HomeAccountFields';
import InvestmentAccountFields from './accounts/InvestmentAccountFields';
import LiabilityAccountFields from './accounts/LiabilityAccountFields';
import VehicleAccountFields from './accounts/VehicleAccountFields';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { PlannerPerson } from '../types/person';

export interface AccountsCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
}

const AccountsCard = ({ collapsed, toggleControl }: AccountsCardProps) => {
  const { currencyCode } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);
  type AccountFilter = 'all' | 'assets' | 'liabilities' | 'tax-advantaged';
  const [collapsedAccountIds, setCollapsedAccountIds] = useState<Record<string, boolean>>({});
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
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
    accountOwnerOptions,
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
    isLiabilityAccountType,
    isCombinedAssetType,
    isNonContributingAccountType,
    isDepreciatingAssetType,
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
    updateAccount,
    updateAssetFinanceDetails,
    removeAccount,
    addAccount,
    addLiability,
    setPlannerAssetFinanceDetailsByAccountId,
  } = usePlannerAccounts();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsedAccountIds((previous) => {
      const next: Record<string, boolean> = {};
      for (const account of plannerAccounts) {
        next[account.id] = previous[account.id] ?? false;
      }
      return next;
    });
  }, [plannerAccounts]);

  const toggleAccountCollapsed = (accountId: string) => {
    setCollapsedAccountIds((previous) => ({
      ...previous,
      [accountId]: !previous[accountId],
    }));
  };

  const filteredAccounts = useMemo(() => {
    switch (accountFilter) {
      case 'assets':
        return plannerAccounts.filter(
          (account: PlannerAccount) => !isLiabilityAccountType(account.accountType),
        );
      case 'liabilities':
        return plannerAccounts.filter((account: PlannerAccount) => {
          if (isLiabilityAccountType(account.accountType)) {
            return true;
          }

          if (!isCombinedAssetType(account.accountType)) {
            return false;
          }

          return assetFinanceDetailsByAccountId[account.id]?.hasLoan ?? false;
        });
      case 'tax-advantaged':
        return plannerAccounts.filter(
          (account: PlannerAccount) =>
            getSuggestedAnnualLimitForAccount(account.accountType, 40, hasSpouse) > 0,
        );
      case 'all':
      default:
        return plannerAccounts;
    }
  }, [
    accountFilter,
    plannerAccounts,
    assetFinanceDetailsByAccountId,
    getSuggestedAnnualLimitForAccount,
    hasSpouse,
    isCombinedAssetType,
    isLiabilityAccountType,
  ]);

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
      {!collapsed ? (
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              IRS limits apply only to tax-advantaged account types.
            </p>
            {isIrsAccountsLoading ? (
              <p className="text-muted-foreground text-xs">Loading latest IRS limits...</p>
            ) : null}
            {isIrsAccountsError ? (
              <p className="text-destructive text-xs">
                Unable to load IRS limits. Using fallback defaults.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={accountFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAccountFilter('all')}
            >
              All
            </Button>
            <Button
              type="button"
              variant={accountFilter === 'assets' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAccountFilter('assets')}
            >
              Assets
            </Button>
            <Button
              type="button"
              variant={accountFilter === 'liabilities' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAccountFilter('liabilities')}
            >
              Liabilities + Loans
            </Button>
            <Button
              type="button"
              variant={accountFilter === 'tax-advantaged' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAccountFilter('tax-advantaged')}
            >
              Tax-Advantaged
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredAccounts.map((account: PlannerAccount) => {
              const isLiability = isLiabilityAccountType(account.accountType);
              const isCombinedAsset = isCombinedAssetType(account.accountType);
              const isAccountCollapsed = collapsedAccountIds[account.id] ?? false;
              const assetFinanceDetails = assetFinanceDetailsByAccountId[account.id];
              const assetFinanceSnapshot =
                isCombinedAsset && assetFinanceDetails
                  ? getAssetFinanceSnapshot(assetFinanceDetails, new Date())
                  : null;
              const hidesContributionInputs =
                !isLiability && isNonContributingAccountType(account.accountType);
              const usesDepreciationInput = isDepreciatingAssetType(account.accountType);
              const selectedRateProfile = getRateProfileFromAnnualRate(
                getDisplayedRateForAccount(account),
              );
              const employeeMonthly = getEmployeeMonthlyContribution(
                account,
                selfAnnualIncome,
                spouseAnnualIncome,
              );
              const employerMatchMonthly = getEmployerMatchMonthly(
                account,
                selfAnnualIncome,
                spouseAnnualIncome,
              );
              const employeeAnnual = employeeMonthly * 12;
              const ownerAge = getAgeFromBirthday(
                (people.find((person: PlannerPerson) => person.type === account.owner)?.birthday ??
                  selfBirthday) ||
                  '',
              );
              const suggestedLimit = getSuggestedAnnualLimitForAccount(
                account.accountType,
                ownerAge,
                hasSpouse,
              );
              const isUsingIrsMaxContribution =
                suggestedLimit > 0 &&
                plannerConstants.isMoneyEqualWithinTolerance(employeeAnnual, suggestedLimit);
              const modeOptions = isLiability
                ? liabilityContributionModeOptions
                : contributionModeOptions;
              const contributionInputLabel =
                account.contributionMode === 'monthly'
                  ? isLiability
                    ? 'Monthly Payment'
                    : 'Monthly Contribution'
                  : account.contributionMode === 'yearly'
                    ? isLiability
                      ? 'Yearly Payment'
                      : 'Yearly Contribution'
                    : isLiability
                      ? 'Payment % of Salary'
                      : 'Contribution % of Salary';
              const onUpdateAccount = (updater: (current: typeof account) => typeof account) =>
                updateAccount(account.id, updater);
              const onUpdateAssetFinanceDetails = (
                updater: (current: AssetFinanceDetails) => AssetFinanceDetails,
              ) => updateAssetFinanceDetails(account.id, updater);
              const onSetContributionToIrsMax = () => {
                onUpdateAccount((current) => ({
                  ...current,
                  contributionMode: 'monthly',
                  contributionValue:
                    suggestedLimit > 0
                      ? Number((suggestedLimit / 12).toFixed(2))
                      : current.contributionValue,
                }));
              };

              return (
                <div key={account.id} className="h-fit space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{account.name}</p>
                      <Badge variant={isLiability ? 'destructive' : 'secondary'}>
                        {isLiability ? 'Liability' : 'Asset'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAccountCollapsed(account.id)}
                      >
                        {isAccountCollapsed ? <ChevronDown /> : <ChevronUp />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeAccount(account.id)}
                        disabled={plannerAccounts.length === 1}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div
                    className={`grid grid-cols-1 items-end gap-3 overflow-hidden transition-all duration-300 md:grid-cols-2 ${
                      isAccountCollapsed
                        ? 'pointer-events-none max-h-0 opacity-0'
                        : 'max-h-[2400px] opacity-100'
                    }`}
                  >
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        value={account.name}
                        onChange={(event) =>
                          onUpdateAccount((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner</Label>
                      <Select
                        value={account.owner}
                        onValueChange={(value) =>
                          onUpdateAccount((current) => ({
                            ...current,
                            owner: value as AccountOwner,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountOwnerOptions.map((ownerOption) => (
                            <SelectItem key={ownerOption.value} value={ownerOption.value}>
                              {ownerOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Select
                        value={account.accountType}
                        onValueChange={(value) => {
                          const selectedType = value as AccountType;
                          const selectedTypeIsNonContributing =
                            isNonContributingAccountType(selectedType);
                          const selectedTypeIsCombinedAsset = isCombinedAssetType(selectedType);
                          onUpdateAccount((current) => ({
                            ...current,
                            accountType: selectedType,
                            annualRate:
                              selectedType === 'vehicle'
                                ? current.accountType !== 'vehicle'
                                  ? -12
                                  : -Math.abs(current.annualRate)
                                : selectedType === 'home' && current.annualRate <= 0
                                  ? 4
                                  : current.annualRate,
                            contributionMode: selectedTypeIsNonContributing
                              ? 'monthly'
                              : current.contributionMode,
                            contributionValue: selectedTypeIsNonContributing
                              ? 0
                              : current.contributionValue,
                            employerMatchRate:
                              selectedType === '401k' ? current.employerMatchRate : 0,
                            employerMatchMaxPercentOfSalary:
                              selectedType === '401k' ? current.employerMatchMaxPercentOfSalary : 0,
                          }));

                          setPlannerAssetFinanceDetailsByAccountId((prev) => {
                            const next = { ...prev } as Record<string, AssetFinanceDetails>;
                            if (selectedTypeIsCombinedAsset) {
                              if (!next[account.id]) {
                                next[account.id] = getDefaultAssetFinanceDetailsForAccount({
                                  ...account,
                                  accountType: selectedType,
                                });
                              }
                            } else if (next[account.id]) {
                              delete next[account.id];
                            }
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!isCombinedAsset ? (
                      isLiability ? (
                        <LiabilityAccountFields
                          account={account}
                          contributionInputLabel={contributionInputLabel}
                          modeOptions={modeOptions}
                          accountRateProfileOptions={accountRateProfileOptions}
                          selectedRateProfile={selectedRateProfile}
                          usesDepreciationInput={usesDepreciationInput}
                          onUpdateAccount={onUpdateAccount}
                          onSetContributionToIrsMax={onSetContributionToIrsMax}
                          getDisplayedRateForAccount={getDisplayedRateForAccount}
                          getAnnualRateFromProfile={getAnnualRateFromProfile}
                          getStoredAnnualRateForInput={getStoredAnnualRateForInput}
                        />
                      ) : (
                        <InvestmentAccountFields
                          account={account}
                          hidesContributionInputs={hidesContributionInputs}
                          contributionInputLabel={contributionInputLabel}
                          modeOptions={modeOptions}
                          suggestedLimit={suggestedLimit}
                          isUsingIrsMaxContribution={isUsingIrsMaxContribution}
                          accountRateProfileOptions={accountRateProfileOptions}
                          selectedRateProfile={selectedRateProfile}
                          usesDepreciationInput={usesDepreciationInput}
                          onUpdateAccount={onUpdateAccount}
                          onSetContributionToIrsMax={onSetContributionToIrsMax}
                          getDisplayedRateForAccount={getDisplayedRateForAccount}
                          getAnnualRateFromProfile={getAnnualRateFromProfile}
                          getStoredAnnualRateForInput={getStoredAnnualRateForInput}
                        />
                      )
                    ) : (
                      <>
                        {account.accountType === 'home' ? (
                          <HomeAccountFields
                            assetFinanceDetails={assetFinanceDetails}
                            defaultHomeGrowthProfile={defaultHomeGrowthProfile}
                            defaultHomeAppreciationRate={defaultHomeAppreciationRate}
                            homeGrowthProfileOptions={homeGrowthProfileOptions}
                            onUpdateAssetFinanceDetails={onUpdateAssetFinanceDetails}
                            toIsoDate={toIsoDate}
                            getHomeAnnualGrowthRate={getHomeAnnualGrowthRate}
                          />
                        ) : (
                          <VehicleAccountFields
                            assetFinanceDetails={assetFinanceDetails}
                            defaultVehicleDepreciationProfile={defaultVehicleDepreciationProfile}
                            defaultVehicleDepreciationRate={defaultVehicleDepreciationRate}
                            vehicleDepreciationProfileOptions={vehicleDepreciationProfileOptions}
                            onUpdateAssetFinanceDetails={onUpdateAssetFinanceDetails}
                            toIsoDate={toIsoDate}
                          />
                        )}
                        <CombinedAssetLoanFields
                          assetFinanceDetails={assetFinanceDetails}
                          onUpdateAssetFinanceDetails={onUpdateAssetFinanceDetails}
                          formatCurrency={formatCurrency}
                        />
                      </>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {isAccountCollapsed ? (
                      <p>
                        {isLiability ? 'Payment' : 'Employee'}: {formatCurrency(employeeMonthly)}/mo
                        {account.accountType === '401k'
                          ? `, Match: ${formatCurrency(employerMatchMonthly)}/mo`
                          : ''}
                        {assetFinanceSnapshot
                          ? `, Equity: ${formatCurrency(assetFinanceSnapshot.equity)}`
                          : `, Balance: ${formatCurrency(account.startingBalance)}`}
                      </p>
                    ) : null}
                    {hidesContributionInputs ? (
                      <p>
                        {isCombinedAsset
                          ? 'This account combines asset value and optional loan in one place.'
                          : 'This account type tracks value/depreciation only. Contribution inputs are hidden.'}
                      </p>
                    ) : isLiability ? (
                      <p>Liability payments are not IRS-limited.</p>
                    ) : (
                      <>
                        <p>
                          IRS annual limit for age {ownerAge}: {formatCurrency(suggestedLimit)}
                        </p>
                        {suggestedLimit > 0 ? (
                          <span
                            className={
                              plannerConstants.isMoneyGreaterThanWithTolerance(
                                employeeAnnual,
                                suggestedLimit,
                              )
                                ? 'text-destructive font-medium'
                                : ''
                            }
                          >
                            Annual contribution {formatCurrency(employeeAnnual)} / limit{' '}
                            {formatCurrency(suggestedLimit)}
                          </span>
                        ) : (
                          <span>No annual limit set for this account.</span>
                        )}
                      </>
                    )}
                    {!hidesContributionInputs ? (
                      <span className="ml-2">
                        {isLiability ? 'Monthly payment' : 'Employee monthly equivalent'}:{' '}
                        {formatCurrency(employeeMonthly)}
                      </span>
                    ) : null}

                    {assetFinanceSnapshot ? (
                      <span className="ml-2">
                        Estimated equity now: {formatCurrency(assetFinanceSnapshot.equity)} (
                        {formatCurrency(assetFinanceSnapshot.assetValue)} - Loan{' '}
                        {formatCurrency(assetFinanceSnapshot.loanBalance)})
                      </span>
                    ) : null}
                    {usesDepreciationInput ? (
                      <span className="ml-2">
                        Vehicle depreciation uses a tapered curve by age (faster early years, slower
                        later years), unless Custom is selected.
                      </span>
                    ) : null}
                    {account.accountType === '401k' ? (
                      <span className="ml-2">
                        Employer match applied monthly: {formatCurrency(employerMatchMonthly)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {filteredAccounts.length === 0 ? (
              <div className="text-muted-foreground rounded-md border p-4 text-sm xl:col-span-2">
                No accounts match this filter.
              </div>
            ) : null}
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
      ) : null}
    </Card>
  );
};

export default AccountsCard;
