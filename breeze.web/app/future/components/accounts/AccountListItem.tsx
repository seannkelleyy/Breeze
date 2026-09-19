'use client';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  PiggyBank,
  CreditCard,
  Home,
  Car,
  Briefcase,
  Wallet,
  Shield,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatCurrencyWithCode, formatTimeAgo } from '@/lib/utils';
import * as plannerConstants from '../../lib/constants';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { getEmployeeMonthlyContribution, getAgeFromBirthday } from '../../lib/plannerMath';
import {
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
import { PlaidAccountLinker } from './PlaidAccountLinker';

const ACCOUNT_ICONS: Record<string, typeof PiggyBank> = {
  checking: Wallet,
  'emergency-fund': Shield,
  brokerage: TrendingUp,
  '401k': Briefcase,
  '403b': Briefcase,
  '457': Briefcase,
  'roth-ira': Briefcase,
  'traditional-ira': Briefcase,
  hsa: Briefcase,
  home: Home,
  vehicle: Car,
  'student-loan': CreditCard,
  'credit-card': CreditCard,
  'personal-loan': CreditCard,
  'auto-loan': CreditCard,
  mortgage: CreditCard,
};

interface AccountListItemProps {
  account: PlannerAccount;
  currencyCode: string;
  people: PlannerPerson[];
  assetFinanceDetails: AssetFinanceDetails | undefined;
  isLastAccount: boolean;
  isLiabilityAccountType: (type: AccountType) => boolean;
  isCombinedAssetType: (type: AccountType) => boolean;
  isNonContributingAccountType: (type: AccountType) => boolean;
  isDepreciatingAssetType: (type: AccountType) => boolean;
  getSuggestedAnnualLimitForAccount: (type: AccountType, age: number) => number;
  getDisplayedRateForAccount: (account: PlannerAccount) => number;
  getStoredAnnualRateForInput: (account: PlannerAccount, value: number) => number;
  getRateProfileFromAnnualRate: (annualRate: number) => AccountRateProfile;
  getAnnualRateFromProfile: (profile: AccountRateProfile, currentAnnualRate: number) => number;
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
  onSave: (account: PlannerAccount) => void;
  onDelete: (account: PlannerAccount) => void;
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
  assetFinanceDetails,
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
  onSave,
  onDelete,
  onUpdateAccount,
  onUpdateAssetFinanceDetails,
  setPlannerAssetFinanceDetailsByAccountId,
  getDefaultAssetFinanceDetailsForAccount,
  toIsoDate,
  getHomeAnnualGrowthRate,
}: AccountListItemProps) {
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useAutoSave(
    () => onSave(account),
    [
      account.name,
      account.personIds,
      account.accountType,
      account.contributionMode,
      account.contributionValue,
      account.employerMatchRate,
      account.employerMatchMaxPercentOfSalary,
      account.startingBalance,
      account.annualRate,
      account.returnProfile,
      account.linkedLiabilityId,
      account.purchaseDate,
      account.purchasePrice,
      account.homeGrowthProfile,
      account.vehicleDepreciationProfile,
    ],
  );

  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);
  const isLiability = isLiabilityAccountType(account.accountType);
  const isCombinedAsset = isCombinedAssetType(account.accountType);
  const hidesContributionInputs = !isLiability && isNonContributingAccountType(account.accountType);
  const usesDepreciationInput = isDepreciatingAssetType(account.accountType);

  useAutoSave(() => {
    if (isCombinedAsset && assetFinanceDetails) {
      onSave(account);
    }
  }, [
    assetFinanceDetails?.hasLoan,
    assetFinanceDetails?.loanInterestRate,
    assetFinanceDetails?.originalLoanAmount,
    assetFinanceDetails?.loanMonthlyPayment,
    assetFinanceDetails?.loanTermYears,
    assetFinanceDetails?.loanStartDate,
    assetFinanceDetails?.currentLoanBalance,
    isCombinedAsset,
    assetFinanceDetails,
  ]);

  const derivedRateProfile = getRateProfileFromAnnualRate(getDisplayedRateForAccount(account));
  const selectedRateProfile = account.returnProfile ?? derivedRateProfile;

  const handleRateProfileChange = (value: AccountRateProfile) => {
    onUpdateAccount((current) => ({
      ...current,
      returnProfile: value,
      annualRate: getAnnualRateFromProfile(value, getDisplayedRateForAccount(current)),
    }));
  };

  const employeeMonthly = getEmployeeMonthlyContribution(account, people);
  const employeeAnnual = employeeMonthly * 12;

  const ownerPersons = people.filter((p) => account.personIds?.includes(p.id));
  const ownerPerson =
    ownerPersons.length > 0
      ? ownerPersons.reduce((oldest, p) =>
          getAgeFromBirthday(p.birthday) > getAgeFromBirthday(oldest.birthday) ? p : oldest,
        )
      : people[0];
  const ownerAge = getAgeFromBirthday(ownerPerson?.birthday ?? '');
  const suggestedLimit = getSuggestedAnnualLimitForAccount(account.accountType, ownerAge);
  const isUsingIrsMaxContribution =
    suggestedLimit > 0 &&
    plannerConstants.isMoneyEqualWithinTolerance(employeeAnnual, suggestedLimit);

  const modeOptions = isLiability ? liabilityContributionModeOptions : contributionModeOptions;
  const contributionInputLabel =
    account.contributionMode === 'monthly'
      ? isLiability
        ? 'Monthly Payment'
        : 'Monthly Contribution'
      : account.contributionMode === 'biweekly'
        ? isLiability
          ? 'Biweekly Payment'
          : 'Biweekly Contribution'
        : account.contributionMode === 'weekly'
          ? isLiability
            ? 'Weekly Payment'
            : 'Weekly Contribution'
          : account.contributionMode === 'yearly'
            ? isLiability
              ? 'Yearly Payment'
              : 'Yearly Contribution'
            : isLiability
              ? 'Payment % of Salary'
              : 'Contribution % of Salary';

  const onSetContributionToIrsMax = () => {
    const mode = account.contributionMode;
    let value: number;
    if (mode === 'yearly') {
      value = suggestedLimit;
    } else if (mode === 'biweekly') {
      value = suggestedLimit / 26;
    } else if (mode === 'weekly') {
      value = suggestedLimit / 52;
    } else if (mode === 'salary-percent') {
      // Keep current value for salary percent mode
      value = account.contributionValue;
    } else {
      // monthly
      value = suggestedLimit / 12;
    }
    onUpdateAccount((current) => ({
      ...current,
      contributionValue: suggestedLimit > 0 ? Number(value.toFixed(2)) : current.contributionValue,
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

  const Icon = ACCOUNT_ICONS[account.accountType] || PiggyBank;
  const typeLabel =
    accountTypeOptions.find((o) => o.value === account.accountType)?.label ?? account.accountType;
  const isOverIrsLimit =
    suggestedLimit > 0 &&
    plannerConstants.isMoneyGreaterThanWithTolerance(employeeAnnual, suggestedLimit);
  const displayedRate = getDisplayedRateForAccount(account).toFixed(2);

  let infoLine: string;
  if (isLiability) {
    infoLine = `${formatCurrency(employeeMonthly)}/mo (${formatCurrency(employeeAnnual)}/yr) payment · ${displayedRate}% APR`;
  } else if (hidesContributionInputs) {
    infoLine = `${displayedRate}% /yr`;
  } else {
    infoLine = `${formatCurrency(employeeMonthly)}/mo (${formatCurrency(employeeAnnual)}/yr) · ${displayedRate}% return`;
  }

  return (
    <>
      <div className="group hover:border-primary/30 rounded-lg border transition-colors">
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-md ${isLiability ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            {/* Row 1: name · value */}
            <div className="flex items-baseline gap-2">
              <span className="truncate text-sm font-medium">
                {account.name || 'Unnamed Account'}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm font-semibold">{formatCurrency(account.startingBalance)}</span>
            </div>
            {/* Row 2: badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge
                variant={isLiability ? 'destructive' : 'secondary'}
                className="shrink-0 text-[10px]"
              >
                {isLiability ? 'Liability' : 'Asset'}
              </Badge>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {typeLabel}
              </Badge>
              {isUsingIrsMaxContribution && (
                <Badge
                  variant="default"
                  className="bg-success text-success-foreground shrink-0 text-[10px]"
                >
                  Maxed Out
                </Badge>
              )}
              {isOverIrsLimit && (
                <Badge variant="destructive" className="shrink-0 text-[10px]">
                  Over Limit
                </Badge>
              )}
            </div>
            {/* Row 3: contributions, payments, rate */}
            <p className="text-muted-foreground mt-0.5 text-xs">{infoLine}</p>
            {account.updatedAt && (
              <p className="text-muted-foreground mt-0.5 text-[10px]">
                Updated {formatTimeAgo(account.updatedAt)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="size-8 cursor-pointer"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLastAccount}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editing} onOpenChange={(open) => !open && setEditing(false)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {account.name || 'Account'}</DialogTitle>
            <DialogDescription>Update the account details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Identity row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Name</Label>
                <Input
                  value={account.name}
                  onChange={(e) => onUpdateAccount((c) => ({ ...c, name: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={account.accountType} onValueChange={handleAccountTypeChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypeOptions
                      .filter(
                        (o) => isLiabilityAccountType(o.value as AccountType) === isLiability,
                      )
                      .map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type-specific fields */}
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

            {/* IRS limit hint */}
            {!hidesContributionInputs && suggestedLimit > 0 && (
              <div
                className={`rounded-md px-3 py-2 text-xs ${isUsingIrsMaxContribution ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
              >
                <span className="font-medium">
                  {formatCurrency(employeeAnnual)} / {formatCurrency(suggestedLimit)}
                </span>
                <span className="ml-1">IRS limit (age {ownerAge})</span>
                {plannerConstants.isMoneyGreaterThanWithTolerance(
                  employeeAnnual,
                  suggestedLimit,
                ) && (
                  <span className="text-destructive ml-2 font-medium">
                    Over by {formatCurrency(employeeAnnual - suggestedLimit)}
                  </span>
                )}
              </div>
            )}

            {/* Contribution summary */}
            {!hidesContributionInputs && (
              <div className="bg-muted/50 rounded-md px-3 py-2 text-xs">
                <span className="font-medium">{formatCurrency(employeeMonthly)}/mo</span>
                <span className="text-muted-foreground ml-1">
                  ({formatCurrency(employeeAnnual)}/yr)
                </span>
              </div>
            )}

            {/* Owners */}
            <div className="space-y-1.5">
              <Label className="text-xs">Owners</Label>
              <div className="flex flex-wrap gap-1">
                {people.map((p) => (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                      account.personIds?.includes(p.id)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={account.personIds?.includes(p.id) ?? false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onUpdateAccount((c) => ({
                            ...c,
                            personIds: [...(c.personIds ?? []), p.id],
                          }));
                        } else {
                          onUpdateAccount((c) => ({
                            ...c,
                            personIds: (c.personIds ?? []).filter((id) => id !== p.id),
                          }));
                        }
                      }}
                    />
                    {p.name || 'Unnamed'}
                  </label>
                ))}
                {people.length === 0 && (
                  <span className="text-muted-foreground text-xs">No people configured</span>
                )}
              </div>
            </div>

            {/* Plaid Link */}
            <PlaidAccountLinker
              accountId={account.id}
              isLiability={isLiability}
              plaidAccountId={account.plaidAccountId}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Account"
        description={`Are you sure you want to delete "${account.name || 'Unnamed Account'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => onDelete(account)}
      />
    </>
  );
}

export default AccountListItem;
