import { clamp } from '../../lib/plannerMath';
import { FormattedNumberInput } from '../../../../components/common/form/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AssetFinanceDetails } from '../../types/finance';

interface CombinedAssetLoanFieldsProps {
  assetFinanceDetails: AssetFinanceDetails | undefined;
  onUpdateAssetFinanceDetails: (
    updater: (current: AssetFinanceDetails) => AssetFinanceDetails,
  ) => void;
  formatCurrency: (value: number) => string;
}

const CombinedAssetLoanFields = ({
  assetFinanceDetails,
  onUpdateAssetFinanceDetails,
  formatCurrency,
}: CombinedAssetLoanFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Still Have a Loan?</Label>
        <Select
          value={(assetFinanceDetails?.hasLoan ?? false) ? 'yes' : 'no'}
          onValueChange={(value) =>
            onUpdateAssetFinanceDetails((current) => ({
              ...current,
              hasLoan: value === 'yes',
              originalLoanAmount:
                value === 'yes' && clamp(current.originalLoanAmount) <= 0
                  ? clamp(current.currentLoanBalance)
                  : current.originalLoanAmount,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {assetFinanceDetails?.hasLoan ? (
        <>
          <div className="space-y-2">
            <Label>Loan Interest Rate %</Label>
            <FormattedNumberInput
              value={assetFinanceDetails.loanInterestRate}
              onValueChange={(value) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  loanInterestRate: value,
                }))
              }
              maxFractionDigits={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Original Loan Amount</Label>
            <FormattedNumberInput
              value={assetFinanceDetails.originalLoanAmount}
              onValueChange={(value) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  originalLoanAmount: clamp(value),
                }))
              }
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Principal + Interest Payment (Monthly)</Label>
            <FormattedNumberInput
              value={assetFinanceDetails.loanMonthlyPayment}
              onValueChange={(value) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  loanMonthlyPayment: clamp(value),
                }))
              }
              maxFractionDigits={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Loan Term (Years)</Label>
            <FormattedNumberInput
              value={assetFinanceDetails.loanTermYears}
              onValueChange={(value) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  loanTermYears: clamp(value),
                }))
              }
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Loan Start Date</Label>
            <Input
              type="date"
              value={assetFinanceDetails.loanStartDate}
              onChange={(event) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  loanStartDate: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Current Loan Amount</Label>
            <FormattedNumberInput
              value={assetFinanceDetails.currentLoanBalance}
              onValueChange={(value) =>
                onUpdateAssetFinanceDetails((current) => ({
                  ...current,
                  currentLoanBalance: clamp(value),
                }))
              }
              maxFractionDigits={0}
            />
          </div>
          {assetFinanceDetails.originalLoanAmount > 0 ? (
            <div className="text-muted-foreground rounded-md border p-2 text-xs md:col-span-2">
              <p>
                Principal paid to date:{' '}
                {formatCurrency(
                  Math.max(
                    0,
                    assetFinanceDetails.originalLoanAmount - assetFinanceDetails.currentLoanBalance,
                  ),
                )}
              </p>
              <p>
                Loan paid off:{' '}
                {(
                  (Math.max(
                    0,
                    assetFinanceDetails.originalLoanAmount - assetFinanceDetails.currentLoanBalance,
                  ) /
                    assetFinanceDetails.originalLoanAmount) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
};

export default CombinedAssetLoanFields;
