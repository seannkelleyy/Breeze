'use client';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Moon, Sun, Settings, LogOut, PcCase } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { Button } from '@/components/ui/button';
import { PLANNER_RETURN_DISPLAY_MODE_OPTIONS } from '@/app/future/lib/constants';
import { useState } from 'react';
import Image from 'next/image';

export function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { setTheme, theme } = useTheme();
  const [showPreferences, setShowPreferences] = useState(false);

  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? '?';

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'Light':
        return <Sun className='mr-2 size-4'/>;
      case 'Dark':
        return <Moon className='mr-2 size-4'/>;
      default:
        return <PcCase className='mr-2 size-4'/>;
    }
  }

  const getNextTheme = (currentTheme: string) => {
    switch (currentTheme) {
      case 'Light':
        return 'Dark';
      case 'Dark':
        return 'System';
      default:
        return 'Light';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus-visible:ring-ring cursor-pointer rounded-full outline-none focus-visible:ring-2">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.firstName ?? 'User'}
                width={32}
                height={32}
                className="size-8 rounded-full"
              />
            ) : (
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium">
                {initials}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" key={theme}>
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.firstName ?? 'User'}</p>
            <p className="text-muted-foreground text-xs">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowPreferences(true)}>
            <Settings className="mr-2 size-4" />
            Preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setTheme(getNextTheme(theme));
            }}
          >
            {getThemeIcon(theme)}
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Preferences Dialog */}
      <PreferencesDialog open={showPreferences} onOpenChange={setShowPreferences} />
    </>
  );
}

function PreferencesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    currencyCode,
    updateCurrencyCode,
    returnDisplayMode,
    updateReturnDisplayMode,
    inflationRate,
    updateInflationRate,
    safeWithdrawalRate,
    updateSafeWithdrawalRate,
    filingStatus,
    updateFilingStatus,
    deductionType,
    updateDeductionType,
    monthlyExpenses,
    setMonthlyExpenses,
    budgetEnabled,
    updateUserSetup,
  } = useCurrentUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Filing Status</Label>
              <Select value={filingStatus} onValueChange={updateFilingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MFJ">Married filing jointly</SelectItem>
                  <SelectItem value="MFS">Married filing separately</SelectItem>
                  <SelectItem value="HOH">Head of household</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Deduction Type</Label>
              <Select value={deductionType} onValueChange={updateDeductionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="ITEMIZED">Itemized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
          <Button
            variant="outline"
            onClick={() => void updateUserSetup({ budgetEnabled: !budgetEnabled })}
          >
            {budgetEnabled ? 'Disable Budget' : 'Enable Budget'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
