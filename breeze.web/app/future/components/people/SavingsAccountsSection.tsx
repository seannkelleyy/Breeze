'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountListItem } from '../accounts/AccountListItem';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from '../../providers/PlannerStateProvider';
import { usePlannerAccounts } from '../../hooks/planner/index';
import { useAccountMutations } from '../../hooks/planner/useAccountMutations';
import type { PlannerAccount } from '../../types/account';
import type { PlannerPerson } from '../../types/person';
import type { HomeGrowthProfile } from '../../types/finance';

const SAVINGS_TYPES = new Set(['401k', '403b', '457', 'hsa']);

interface SavingsAccountsSectionProps {
  /** Person being edited — new accounts default to them as owner. */
  person: PlannerPerson;
  people: PlannerPerson[];
  currencyCode: string;
}

/**
 * Payroll-deducted savings (401(k), 403(b), 457, HSA) with the same
 * AccountListItem editor used on the Accounts page — contributions here feed
 * the paycheck waterfall as pre-tax/Roth deductions.
 */
export function SavingsAccountsSection({ person, people, currencyCode }: SavingsAccountsSectionProps) {
  const { userId } = useCurrentUser();
  const { plannerAccounts, setPlannerAccounts } = usePlannerState();
  // The row being edited stays mounted even if ownership changes mid-edit —
  // un-owning this person unlists the account only once the dialog closes.
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const {
    options: accountOptions,
    typeGuards,
    helpers: accountHelpers,
    actions: {
      updateAccount,
      removeAccount,
      updateAssetFinanceDetails,
      setPlannerAssetFinanceDetailsByAccountId,
    },
  } = usePlannerAccounts();
  const accountMutations = useAccountMutations({ userId, updateAccount, removeAccount });

  const savingsAccounts = plannerAccounts.filter(
    (a) =>
      SAVINGS_TYPES.has(a.accountType) &&
      (a.personIds.includes(person.id) || a.id === editingAccountId),
  );

  const handleSaveAccount = async (account: PlannerAccount) => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      account.id,
    );
    try {
      if (isValidUuid) await accountMutations.updateAssetMutation.mutateAsync(account);
      else await accountMutations.createAssetMutation.mutateAsync(account);
    } finally {
      accountMutations.invalidatePlanner();
    }
  };

  const handleDeleteAccount = async (account: PlannerAccount) => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      account.id,
    );
    if (isValidUuid) {
      try {
        await accountMutations.deleteAssetMutation.mutateAsync(account.id);
      } finally {
        accountMutations.invalidatePlanner();
      }
    } else {
      setPlannerAccounts((prev) => prev.filter((a) => a.id !== account.id));
    }
  };

  const handleAddSavingsAccount = () => {
    const newAccount: PlannerAccount = {
      id: `local-${crypto.randomUUID()}`,
      name: 'New 401(k)',
      accountType: '401k',
      personIds: [person.id],
      contributionMode: 'monthly',
      contributionValue: 0,
      employerMatchRate: 0,
      employerMatchMaxPercentOfSalary: 0,
      startingBalance: 0,
      annualRate: 7,
      returnProfile: null,
      taxTreatment: 'PRE_TAX',
      purchaseDate: null,
      purchasePrice: null,
      homeGrowthProfile: null,
      vehicleDepreciationProfile: null,
      linkedLiabilityId: null,
      plaidAccountId: null,
      lastValueUpdatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPlannerAccounts((prev) => [...prev, newAccount]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground border-b pb-1 text-xs font-medium tracking-wide uppercase">
          Savings Accounts — 401(k), HSA
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleAddSavingsAccount}>
          <Plus className="size-3.5" /> Add
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Payroll-deducted contributions reduce take-home; pre-tax ones also reduce taxes. Same
        editor as the Accounts page — owners decide whose list an account appears under.
      </p>
      {savingsAccounts.length === 0 && (
        <p className="text-muted-foreground text-xs">
          No savings accounts for {person.name || 'this person'} yet — add one here, or set them
          as an owner from the Accounts page.
        </p>
      )}
      <div className="space-y-2">
        {savingsAccounts.map((account) => (
          <AccountListItem
            key={account.id}
            account={account}
            accounts={plannerAccounts}
            currencyCode={currencyCode}
            people={people}
            assetFinanceDetails={undefined}
            isLastAccount={plannerAccounts.length === 1}
            isLiabilityAccountType={typeGuards.isLiabilityAccountType}
            isCombinedAssetType={typeGuards.isCombinedAssetType}
            isNonContributingAccountType={typeGuards.isNonContributingAccountType}
            isDepreciatingAssetType={typeGuards.isDepreciatingAssetType}
            getSuggestedAnnualLimitForAccount={accountHelpers.getSuggestedAnnualLimitForAccount}
            getDisplayedRateForAccount={accountHelpers.getDisplayedRateForAccount}
            getStoredAnnualRateForInput={accountHelpers.getStoredAnnualRateForInput}
            getRateProfileFromAnnualRate={accountHelpers.getRateProfileFromAnnualRate}
            getAnnualRateFromProfile={accountHelpers.getAnnualRateFromProfile}
            accountRateProfileOptions={accountOptions.accountRateProfileOptions}
            accountTypeOptions={accountOptions.accountTypeOptions}
            contributionModeOptions={accountOptions.contributionModeOptions}
            liabilityContributionModeOptions={accountOptions.liabilityContributionModeOptions}
            homeGrowthProfileOptions={accountOptions.homeGrowthProfileOptions}
            vehicleDepreciationProfileOptions={accountOptions.vehicleDepreciationProfileOptions}
            defaultHomeGrowthProfile={accountOptions.defaultHomeGrowthProfile as HomeGrowthProfile}
            defaultVehicleDepreciationProfile={accountOptions.defaultVehicleDepreciationProfile}
            defaultHomeAppreciationRate={accountOptions.defaultHomeAppreciationRate}
            defaultVehicleDepreciationRate={accountOptions.defaultVehicleDepreciationRate}
            onSave={handleSaveAccount}
            onDelete={handleDeleteAccount}
            onEditDialogChange={(open) => setEditingAccountId(open ? account.id : null)}
            onUpdateAccount={(u) => updateAccount(account.id, u)}
            onUpdateAssetFinanceDetails={(u) => updateAssetFinanceDetails(account.id, u)}
            setPlannerAssetFinanceDetailsByAccountId={setPlannerAssetFinanceDetailsByAccountId}
            getDefaultAssetFinanceDetailsForAccount={
              accountHelpers.getDefaultAssetFinanceDetailsForAccount
            }
            toIsoDate={accountHelpers.toIsoDate}
            getHomeAnnualGrowthRate={accountHelpers.getHomeAnnualGrowthRate}
          />
        ))}
      </div>
    </div>
  );
}

export default SavingsAccountsSection;
