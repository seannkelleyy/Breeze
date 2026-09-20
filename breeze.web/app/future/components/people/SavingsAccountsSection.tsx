'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountListItem } from '../accounts/AccountListItem';
import { AccountEditorProvider } from '../accounts/AccountEditorContext';
import { usePlannerState } from '../../providers/PlannerStateProvider';
import { PAYROLL_SAVINGS_ACCOUNT_TYPES } from '../../lib/config';
import type { PlannerAccount } from '../../types/account';
import type { PlannerPerson } from '../../types/person';

interface SavingsAccountsSectionProps {
  /** Person being edited — new accounts default to them as owner. */
  person: PlannerPerson;
  people: PlannerPerson[];
  currencyCode: string;
}

/**
 * Payroll-deducted savings (401(k), 403(b), 457, HSA) owned by the person,
 * edited with the same AccountListItem editor as the Accounts page —
 * contributions here feed the paycheck waterfall as pre-tax/Roth deductions.
 */
export function SavingsAccountsSection({ person, people, currencyCode }: SavingsAccountsSectionProps) {
  return (
    <AccountEditorProvider>
      <SavingsAccountsSectionInner
        person={person}
        people={people}
        currencyCode={currencyCode}
      />
    </AccountEditorProvider>
  );
}

function SavingsAccountsSectionInner({ person }: SavingsAccountsSectionProps) {
  const { plannerAccounts, setPlannerAccounts } = usePlannerState();
  // The row being edited stays mounted even if ownership changes mid-edit —
  // un-owning this person unlists the account only once the dialog closes.
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const savingsAccounts = plannerAccounts.filter(
    (a) =>
      PAYROLL_SAVINGS_ACCOUNT_TYPES.has(a.accountType) &&
      (a.personIds.includes(person.id) || a.id === editingAccountId),
  );

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
        Payroll-deducted contributions reduce take-home; pre-tax ones also reduce taxes. Owners
        decide whose list an account appears under.
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
            isLastAccount={plannerAccounts.length === 1}
            onEditDialogChange={(open) => setEditingAccountId(open ? account.id : null)}
          />
        ))}
      </div>
    </div>
  );
}

export default SavingsAccountsSection;
