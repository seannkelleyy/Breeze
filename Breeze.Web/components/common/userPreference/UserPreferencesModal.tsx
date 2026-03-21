import { PLANNER_RETURN_DISPLAY_MODE_OPTIONS } from '@/app/planner/lib/constants';
import { FormattedNumberInput } from '../form/FormattedNumberInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

export const UserPreferencesModal = () => {
  const {
    currencyCode,
    setCurrencyCode,
    returnDisplayMode,
    setReturnDisplayMode,
    inflationRate,
    setInflationRate,
    safeWithdrawalRate,
    setSafeWithdrawalRate,
  } = useCurrentUser();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" title="User Preferences">
          Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Preferences</DialogTitle>
          <DialogDescription>
            Personal defaults saved to your account and reused across tools.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Return Display Mode</Label>
            <Select
              value={returnDisplayMode}
              onValueChange={(value) => setReturnDisplayMode(value as 'real' | 'nominal')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANNER_RETURN_DISPLAY_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Currency</Label>
            <Select value={currencyCode} onValueChange={setCurrencyCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                <SelectItem value="GBP">British Pound (GBP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Inflation Rate %</Label>
              <FormattedNumberInput
                value={inflationRate}
                onValueChange={setInflationRate}
                maxFractionDigits={2}
              />
            </div>
            <div className="space-y-1">
              <Label>Safe Withdrawal Rate %</Label>
              <FormattedNumberInput
                value={safeWithdrawalRate}
                onValueChange={setSafeWithdrawalRate}
                maxFractionDigits={2}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
