import { FormattedNumberInput } from '../../../../components/common/form/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { PlannerAccount } from '../../types/account';

interface LiabilityAccountFieldsProps {
  account: PlannerAccount;
  onUpdateAccount: (updater: (current: PlannerAccount) => PlannerAccount) => void;
}

const LiabilityAccountFields = ({ account, onUpdateAccount }: LiabilityAccountFieldsProps) => {
  return (
    <>
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
