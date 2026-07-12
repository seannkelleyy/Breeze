'use client';
import { ChevronDown, ChevronUp, Loader2, Save, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as plannerConstants from '../../lib/constants';
import {
  formatCurrencyWithCode,
  getAssetFinanceSnapshot,
  getEmployeeMonthlyContribution,
  getEmployerMatchMonthly,
  getAgeFromBirthday,
} from '../../lib/plannerMath';
import {
  AccountOwner,
  AccountType,
  ContributionMode,
  AccountRateProfile,
  PlannerAccount,
} from '../../types/account';
import { AssetFinanceDetails, HomeGrowthProfile } from '../../types/finance';
import { PlannerPerson } from '../../types/person';
import CombinedAssetLoanFields from './CombinedAssetLoanFields';
import HomeAccountFields from './HomeAccountFields';
import InvestmentAccountFields from './InvestmentAccountFields';
import LiabilityAccountFields from './LiabilityAccountFields';
import VehicleAccountFields from './VehicleAccountFields';

interface AccountListItemProps {
  account: PlannerAccount;
  currencyCode: string;
  people: PlannerPerson[];
  selfBirthday: string;
  selfAnnualIncome: number;
  spouseAnnualIncome: number;
  hasSpouse: boolean;
  assetFinanceDetails: AssetFinanceDetails | undefined;
  isAccountCollapsed: boolean;
  isLastAccount: boolean;
  // Config functions
  isLiabilityAccountType: (type: AccountType) => boolean;
  isCombinedAssetType: (type: AccountType) => boolean;
  isNonContributingAccountType: (type: AccountType) => boolean;
  isDepreciatingAssetType: (type: AccountType) => boolean;
  getSuggestedAnnualLimitForAccount: (
    type: AccountType,
    age: number,
    includeSpouse: boolean,
  ) => number;
  getDisplayedRateForAccount: (account: PlannerAccount) => number;
  getStoredAnnualRateForInput: (account: PlannerAccount, value: number) => number;
  getRateProfileFromAnnualRate: (annualRate: number) => AccountRateProfile;
  getAnnualRateFromProfile: (profile: AccountRateProfile, currentAnnualRate: number) => number;
  // Options
  accountOwnerOptions: ReadonlyArray<{ value: string; label: string }>;
  accountRateProfileOptions: ReadonlyArray<{ value: AccountRateProfile; label: string }>;
  accountTypeOptions: ReadonlyArray<{ value: string; label: string }>;
  contributionModeOptions: ReadonlyArray<{ value: ContributionMode; label: string }>;
  liabilityContributionModeOptions: ReadonlyArray<{ value: ContributionMode; label: string }>;
  homeGrowthProfileOptions: ReadonlyArray<{ value: HomeGrowthProfile; label: string }>;
  vehicleDepreciationProfileOptions: ReadonlyArray<{ value: string; label: string }>;
  defaultHomeGrowthProfile: HomeGrowthProfile;
  defaultVehicleDepreciationProfile: string;
  defaultHomeAppreciationRate: number;
  defaultVehicleDepreciationRate: number;
  // Actions
  onToggleCollapse: (id: string) => void;
  onSave: (account: PlannerAccount) => void;
  onDelete: (account: PlannerAccount) => void;
  isSaving: boolean;
  onUpdateAccount: (updater: (current: PlannerAccount) => PlannerAccount) => void;
  onUpdateAssetFinanceDetails: (
    updater: (current: AssetFinanceDetails) => AssetFinanceDetails,
  ) => void;
  setPlannerAssetFinanceDetailsByAccountId: (
    updater: (prev: Record<string, AssetFinanceDetails>) => Record<string, AssetFinanceDetails>,
  ) => void;
  getDefaultAssetFinanceDetailsForAccount: (account: PlannerAccount) => AssetFinanceDetails;
  toIsoDate: (date: Date) => string;
  getHomeAnnualGrowthRate: (
    profile: HomeGrowthProfile | string | undefined,
    customRate: number,
  ) => number;
}

export function AccountListItem({
  account,
  currencyCode,
  people,
  selfBirthday,
  selfAnnualIncome,
  spouseAnnualIncome,
  hasSpouse,
  assetFinanceDetails,
  isAccountCollapsed,
  isLastAccount,
  isLiabilityAccountType,
  isCombinedAssetType,
  isNonContributingAccountType,
  isDepreciatingAssetType,
  getSuggestedAnnualLimitForAccount,
  getDisplayedRateForAccount,
  getStoredAnnualRateForInput,
  getRateProfileFromAnnualRate,
  getAnnualRateFromProfile,
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
  onToggleCollapse,
  onSave,
  onDelete,
  isSaving,
  onUpdateAccount,
  onUpdateAssetFinanceDetails,
  setPlannerAssetFinanceDetailsByAccountId,
  getDefaultAssetFinanceDetailsForAccount,
  toIsoDate,
  getHomeAnnualGrowthRate,
}: AccountListItemProps) {
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);
  const isLiability = isLiabilityAccountType(account.accountType);
  const isCombinedAsset = isCombinedAssetType(account.accountType);
  const hidesContributionInputs = !isLiability && isNonContributingAccountType(account.accountType);
  const usesDepreciationInput = isDepreciatingAssetType(account.accountType);

  const assetFinanceSnapshot =
    isCombinedAsset && assetFinanceDetails
      ? getAssetFinanceSnapshot(assetFinanceDetails, new Date())
      : null;

  const derivedRateProfile = getRateProfileFromAnnualRate(getDisplayedRateForAccount(account));
  const selectedRateProfile = account.returnProfile ?? derivedRateProfile;

  const handleRateProfileChange = (value: AccountRateProfile) => {
    onUpdateAccount((current) => ({
      ...current,
      returnProfile: value,
      annualRate: getAnnualRateFromProfile(value, getDisplayedRateForAccount(current)),
    }));
  };

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
    (people.find((p) => p.type === account.owner)?.birthday ?? selfBirthday) || '',
  );
  const suggestedLimit = getSuggestedAnnualLimitForAccount(
    account.accountType,
    ownerAge,
    hasSpouse,
  );
  const isUsingIrsMaxContribution =
    suggestedLimit > 0 &&
    plannerConstants.isMoneyEqualWithinTolerance(employeeAnnual, suggestedLimit);

  const modeOptions = isLiability ? liabilityContributionModeOptions : contributionModeOptions;
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

  const onSetContributionToIrsMax = () => {
    onUpdateAccount((current) => ({
      ...current,
      contributionMode: 'monthly',
      contributionValue:
        suggestedLimit > 0 ? Number((suggestedLimit / 12).toFixed(2)) : current.contributionValue,
    }));
  };

  const handleAccountTypeChange = (value: string) => {
    const selectedType = value as AccountType;
    const selectedIsNonContributing = isNonContributingAccountType(selectedType);
    const selectedIsCombined = isCombinedAssetType(selectedType);
    onUpdateAccount((current) => ({
      ...current,
      accountType: selectedType,
      returnProfile: null,
      annualRate:
        selectedType === 'vehicle'
          ? current.accountType !== 'vehicle'
            ? -12
            : -Math.abs(current.annualRate)
          : selectedType === 'home' && current.annualRate <= 0
            ? 4
            : current.annualRate,
      contributionMode: selectedIsNonContributing ? 'monthly' : current.contributionMode,
      contributionValue: selectedIsNonContributing ? 0 : current.contributionValue,
      employerMatchRate: selectedType === '401k' ? current.employerMatchRate : 0,
      employerMatchMaxPercentOfSalary:
        selectedType === '401k' ? current.employerMatchMaxPercentOfSalary : 0,
    }));

    setPlannerAssetFinanceDetailsByAccountId((prev) => {
      const next = { ...prev } as Record<string, AssetFinanceDetails>;
      if (selectedIsCombined) {
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
  };

  return (
    <div className="h-fit space-y-3 rounded-md border p-3">
      {/* Header */}
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
            onClick={() => onToggleCollapse(account.id)}
          >
            {isAccountCollapsed ? <ChevronDown /> : <ChevronUp />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => onSave(account)} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(account)}
            disabled={isLastAccount}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* Expandable form */}
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
            onChange={(e) => onUpdateAccount((c) => ({ ...c, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Owner</Label>
          <Select
            value={account.owner}
            onValueChange={(value) =>
              onUpdateAccount((c) => ({ ...c, owner: value as AccountOwner }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              {accountOwnerOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Account Type</Label>
          <Select value={account.accountType} onValueChange={handleAccountTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {accountTypeOptions
                .filter((o) => isLiabilityAccountType(o.value as AccountType) === isLiability)
                .map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {!isCombinedAsset ? (
          isLiability ? (
            <LiabilityAccountFields account={account} onUpdateAccount={onUpdateAccount} />
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
              onRateProfileChange={handleRateProfileChange}
              onSetContributionToIrsMax={onSetContributionToIrsMax}
              getDisplayedRateForAccount={getDisplayedRateForAccount}
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

      {/* Summary footer */}
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
                  plannerConstants.isMoneyGreaterThanWithTolerance(employeeAnnual, suggestedLimit)
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
            Vehicle depreciation uses a tapered curve by age (faster early years, slower later
            years), unless Custom is selected.
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
}

export default AccountListItem;
