import { FormattedNumberInput } from '../../../../components/common/form/FormattedNumberInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlannerAccount, ContributionMode, AccountRateProfile } from '../../types/account';

type Option<T extends string> = { value: T; label: string };

interface InvestmentAccountFieldsProps {
  account: PlannerAccount;
  hidesContributionInputs: boolean;
  contributionInputLabel: string;
  modeOptions: ReadonlyArray<Option<ContributionMode>>;
  suggestedLimit: number;
  isUsingIrsMaxContribution: boolean;
  accountRateProfileOptions: ReadonlyArray<Option<AccountRateProfile>>;
  selectedRateProfile: AccountRateProfile;
  usesDepreciationInput: boolean;
  onUpdateAccount: (updater: (current: PlannerAccount) => PlannerAccount) => void;
  onRateProfileChange: (profile: AccountRateProfile) => void;
  onSetContributionToIrsMax: () => void;
  getDisplayedRateForAccount: (account: PlannerAccount) => number;
  getStoredAnnualRateForInput: (account: PlannerAccount, value: number) => number;
}

const InvestmentAccountFields = ({
  account,
  hidesContributionInputs,
  contributionInputLabel,
  modeOptions,
  suggestedLimit,
  isUsingIrsMaxContribution,
  accountRateProfileOptions,
  selectedRateProfile,
  usesDepreciationInput,
  onUpdateAccount,
  onRateProfileChange,
  onSetContributionToIrsMax,
  getDisplayedRateForAccount,
  getStoredAnnualRateForInput,
}: InvestmentAccountFieldsProps) => {
  return (
    <div className="space-y-3">
      {/* Balance & Return */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Starting Balance</Label>
          <FormattedNumberInput
            value={account.startingBalance}
            onValueChange={(value) =>
              onUpdateAccount((current) => ({ ...current, startingBalance: value }))
            }
            maxFractionDigits={0}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Return Profile</Label>
          <Select
            value={selectedRateProfile}
            onValueChange={(value) => onRateProfileChange(value as AccountRateProfile)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountRateProfileOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRateProfile === 'custom' && (
            <FormattedNumberInput
              value={getDisplayedRateForAccount(account)}
              onValueChange={(value) =>
                onUpdateAccount((current) => ({
                  ...current,
                  annualRate: getStoredAnnualRateForInput(current, value),
                }))
              }
              maxFractionDigits={2}
              placeholder={usesDepreciationInput ? 'Custom depreciation %' : 'Custom return %'}
            />
          )}
        </div>
      </div>

      {/* Contributions */}
      {!hidesContributionInputs && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Contribution Type</Label>
            <Select
              value={account.contributionMode}
              onValueChange={(value) =>
                onUpdateAccount((current) => ({
                  ...current,
                  contributionMode: value as ContributionMode,
                }))
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((modeOption) => (
                  <SelectItem key={modeOption.value} value={modeOption.value}>
                    {modeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">{contributionInputLabel}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onSetContributionToIrsMax}
                disabled={suggestedLimit <= 0}
              >
                Max It Out
              </Button>
            </div>
            <FormattedNumberInput
              value={account.contributionValue}
              onValueChange={(value) =>
                onUpdateAccount((current) => ({ ...current, contributionValue: value }))
              }
              maxFractionDigits={2}
            />
            {isUsingIrsMaxContribution && (
              <p className="text-success text-[11px]">Using IRS max contribution</p>
            )}
          </div>
        </div>
      )}

      {/* 401k Match */}
      {account.accountType === '401k' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Match % of Contribution</Label>
            <FormattedNumberInput
              value={account.employerMatchRate}
              onValueChange={(value) =>
                onUpdateAccount((current) => ({ ...current, employerMatchRate: value }))
              }
              maxFractionDigits={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Match Up To % of Salary</Label>
            <FormattedNumberInput
              value={account.employerMatchMaxPercentOfSalary}
              onValueChange={(value) =>
                onUpdateAccount((current) => ({
                  ...current,
                  employerMatchMaxPercentOfSalary: value,
                }))
              }
              maxFractionDigits={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentAccountFields;
