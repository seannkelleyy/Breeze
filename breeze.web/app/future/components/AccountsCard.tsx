'use client';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { getEmployeeMonthlyContribution } from '../lib/plannerMath';
import { formatCurrencyWithCode } from '@/lib/utils';
import { AccountListItem } from './accounts/AccountListItem';
import { AccountEditorProvider, useAccountEditor } from './accounts/AccountEditorContext';
import type { PlannerAccount, AccountType } from '../types/account';

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
  return (
    <AccountEditorProvider>
      <AccountsCardInner collapsed={collapsed} />
    </AccountEditorProvider>
  );
};

const AccountsCardInner = ({ collapsed }: { collapsed: boolean }) => {
  const { currencyCode } = useCurrentUser();
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');

  const editor = useAccountEditor();
  const {
    accounts: plannerAccounts,
    people,
    isIrsAccountsLoading,
    isIrsAccountsError,
    totalPlannedMonthlyEmployee,
    totalPlannedMonthlyMatch,
    totalPlannedMonthlyInvestment,
  } = editor.data;
  const { assetFinanceDetailsByAccountId } = editor;
  const { typeGuards, helpers } = editor;
  const { isLiabilityAccountType, isCombinedAssetType } = typeGuards;

  // Calculate debt payments from liability accounts
  const totalPlannedMonthlyDebtPayments = useMemo(
    () =>
      plannerAccounts
        .filter((a) => isLiabilityAccountType(a.accountType))
        .reduce((sum, a) => sum + getEmployeeMonthlyContribution(a, people), 0),
    [plannerAccounts, people, isLiabilityAccountType],
  );
  const { getSuggestedAnnualLimitForAccount } = helpers;
  const { addAccount, addLiability } = editor;

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
                isLastAccount={plannerAccounts.length === 1}
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
