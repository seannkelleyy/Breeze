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
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Still Have a Loan?</Label>
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
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {assetFinanceDetails?.hasLoan && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Original Loan Amount</Label>
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
            <div className="space-y-1.5">
              <Label className="text-xs">Current Balance</Label>
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
            <div className="space-y-1.5">
              <Label className="text-xs">Interest Rate %</Label>
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
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly P+I Payment</Label>
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
            <div className="space-y-1.5">
              <Label className="text-xs">Loan Term (Years)</Label>
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
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={assetFinanceDetails.loanStartDate}
                onChange={(event) =>
                  onUpdateAssetFinanceDetails((current) => ({
                    ...current,
                    loanStartDate: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          {assetFinanceDetails.originalLoanAmount > 0 && (
            <div className="bg-muted/50 rounded-md px-3 py-2 text-xs">
              <span className="text-muted-foreground">Paid to date: </span>
              <span className="font-medium">
                {formatCurrency(
                  Math.max(
                    0,
                    assetFinanceDetails.originalLoanAmount - assetFinanceDetails.currentLoanBalance,
                  ),
                )}
              </span>
              <span className="text-muted-foreground mx-2">·</span>
              <span className="text-muted-foreground">Progress: </span>
              <span className="font-medium">
                {(
                  (Math.max(
                    0,
                    assetFinanceDetails.originalLoanAmount - assetFinanceDetails.currentLoanBalance,
                  ) /
                    assetFinanceDetails.originalLoanAmount) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CombinedAssetLoanFields;
