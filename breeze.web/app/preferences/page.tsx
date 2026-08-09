'use client';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { PLANNER_RETURN_DISPLAY_MODE_OPTIONS } from '@/app/future/lib/constants';

export default function PreferencesPage() {
  const { isLoaded: clerkLoaded } = useUser();
  const {
    userId,
    isLoaded,
    currencyCode,
    updateCurrencyCode,
    returnDisplayMode,
    updateReturnDisplayMode,
    inflationRate,
    updateInflationRate,
    safeWithdrawalRate,
    updateSafeWithdrawalRate,
    monthlyExpenses,
    setMonthlyExpenses,
    updateUserSetup,
  } = useCurrentUser();

  if (!clerkLoaded || !isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-info mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Preferences</h1>
        <p className="text-muted-foreground text-sm">
          Personal defaults saved to your account and reused across tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">General</CardTitle>
          <CardDescription>Defaults used across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Return Display Mode</Label>
            <Select
              value={returnDisplayMode}
              onValueChange={(value) => updateReturnDisplayMode(value as 'real' | 'nominal')}
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
            <Select value={currencyCode} onValueChange={updateCurrencyCode}>
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
                onValueChange={updateInflationRate}
                maxFractionDigits={2}
              />
            </div>
            <div className="space-y-1">
              <Label>Safe Withdrawal Rate %</Label>
              <FormattedNumberInput
                value={safeWithdrawalRate}
                onValueChange={updateSafeWithdrawalRate}
                maxFractionDigits={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Financial Setup</CardTitle>
          <CardDescription>
            Your monthly expenses and budgeting preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Monthly Expenses</Label>
            <FormattedNumberInput
              value={monthlyExpenses ?? 0}
              onValueChange={(next) => {
                setMonthlyExpenses(next);
                void updateUserSetup({ monthlyExpenses: String(next) });
              }}
              maxFractionDigits={2}
            />
          </div>
          <Button variant="outline" onClick={() => void updateUserSetup({ budgetEnabled: true })}>
            Enable Budget
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}