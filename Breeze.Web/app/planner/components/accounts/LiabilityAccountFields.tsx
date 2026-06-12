import { FormattedNumberInput } from '../../../../components/common/form/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlannerAccount, LiabilityType } from '../../types/account';

type Option<T extends string> = { value: T; label: string };

interface LiabilityAccountFieldsProps {
  account: PlannerAccount;
  liabilityTypeOptions: ReadonlyArray<Option<LiabilityType>>;
  onUpdateAccount: (updater: (current: PlannerAccount) => PlannerAccount) => void;
}

const LiabilityAccountFields = ({
  account,
  liabilityTypeOptions,
  onUpdateAccount,
}: LiabilityAccountFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Liability Type</Label>
        <Select
          value={account.accountType}
          onValueChange={(value) =>
            onUpdateAccount((current) => ({
              ...current,
              accountType: value as LiabilityType,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select liability type" />
          </SelectTrigger>
          <SelectContent>
            {liabilityTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Current Balance Owed</Label>
        <FormattedNumberInput
          value={account.startingBalance}
          onValueChange={(value) =>
            onUpdateAccount((current) => ({
              ...current,
              startingBalance: value,
            }))
          }
          maxFractionDigits={0}
        />
      </div>
      <div className="space-y-2">
        <Label>Interest Rate (%)</Label>
        <FormattedNumberInput
          value={account.annualRate}
          onValueChange={(value) =>
            onUpdateAccount((current) => ({
              ...current,
              annualRate: value,
            }))
          }
          maxFractionDigits={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Minimum Payment</Label>
        <FormattedNumberInput
          value={account.contributionValue}
          onValueChange={(value) =>
            onUpdateAccount((current) => ({
              ...current,
              contributionValue: value,
            }))
          }
          maxFractionDigits={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Target Extra Payment</Label>
        <FormattedNumberInput
          value={0}
          onValueChange={(value) =>
            onUpdateAccount((current) => ({
              ...current,
            }))
          }
          maxFractionDigits={2}
        />
      </div>
    </>
  );
};

export default LiabilityAccountFields;
