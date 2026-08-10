'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerState } from '@/app/future/hooks/usePlannerState';
import { usePlannerHydration } from '@/app/future/hooks/usePlannerHydration';
import { PeopleSection, AccountsSection } from '@/app/future/components/sections';

const STEPS = [
  'Welcome',
  'People',
  'Accounts',
  'Expenses',
  'Goals',
  'Disclaimer',
] as const;

export const SetupWizard = () => {
  const {
    isLoaded,
    isSignedIn,
    setupCompleted,
    monthlyExpenses,
    setMonthlyExpenses,
    updateUserSetup,
  } = useCurrentUser();
  const [stepIndex, setStepIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [manualClose, setManualClose] = useState(false);
  const router = useRouter();
  const { collapsedSections, toggleSection } = usePlannerState();
  usePlannerHydration();

  const open = isLoaded && isSignedIn && !setupCompleted && !manualClose;
  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const next = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    }
  };

  const back = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  };

  const skip = () => {
    void updateUserSetup({ setupCompleted: true });
    setManualClose(true);
  };

  const finish = () => {
    void updateUserSetup({
      setupCompleted: true,
      disclaimerAccepted: acknowledged,
    });
    setManualClose(true);
  };

  const provisionMonthlyExpenses = (value: number) => {
    setMonthlyExpenses(value);
    void updateUserSetup({ monthlyExpenses: String(value) });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <div className="space-y-2 pb-2">
          <Progress value={progress} />
          <p className="text-muted-foreground text-xs">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>

        {step === 'Welcome' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to Breeze</DialogTitle>
              <DialogDescription>
                Let&apos;s set up your financial picture in a few quick steps. You can adjust
                everything later.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={skip}>
                Skip for now
              </Button>
              <Button onClick={next} className="ml-auto">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'People' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Your Household</DialogTitle>
              <DialogDescription>
                Add the people in your financial plan (spouse, partner, or yourself).
              </DialogDescription>
            </DialogHeader>
            <PeopleSection
              isCollapsed={collapsedSections['people']}
              onToggle={() => toggleSection('people')}
            />
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'Accounts' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Your Accounts</DialogTitle>
              <DialogDescription>
                Add your financial accounts or link them with Plaid.
              </DialogDescription>
            </DialogHeader>
            <AccountsSection
              isCollapsed={collapsedSections['accounts']}
              onToggle={() => toggleSection('accounts')}
            />
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'Expenses' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Monthly Expenses</DialogTitle>
              <DialogDescription>
                Your monthly spend drives your savings rate and FIRE targets. Enter how much you
                spend per month, or enable the Budget to track it precisely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="setup-monthly-expenses">Monthly Expenses</Label>
                <FormattedNumberInput
                  id="setup-monthly-expenses"
                  value={monthlyExpenses ?? 0}
                  onValueChange={provisionMonthlyExpenses}
                  maxFractionDigits={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="setup-budget-enabled"
                  onCheckedChange={(checked) =>
                    void updateUserSetup({ budgetEnabled: Boolean(checked) })
                  }
                />
                <Label htmlFor="setup-budget-enabled">
                  Track expenses in detail with the Budget tool
                </Label>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={next}
                disabled={(monthlyExpenses ?? 0) <= 0}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'Goals' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Goals</DialogTitle>
              <DialogDescription>
                Set financial goals and follow the recommended order of operations. You can add
                these later anytime.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={next}>
                  Skip
                </Button>
                <Button onClick={() => {
                  setManualClose(true);
                  router.push('/goals');
                }}>
                  Go to Goals <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'Disclaimer' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Important Disclaimer</DialogTitle>
              <DialogDescription>
                Breeze provides financial planning tools and estimates for informational purposes
                only. It is not financial advice, and we are not a licensed financial advisor.
                Always consult a qualified professional before making financial decisions.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="setup-disclaimer"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
              />
              <Label htmlFor="setup-disclaimer">I understand this is not financial advice</Label>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={finish} disabled={!acknowledged}>
                Finish <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};