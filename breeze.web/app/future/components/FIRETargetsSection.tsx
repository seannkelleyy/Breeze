'use client';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormattedNumberInput } from '../../../components/common/form/FormattedNumberInput';
import { Label } from '@/components/ui/label';
import { FIREVariantCard } from './FIREVariantCard';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerRetirementInputs } from '../hooks/planner/index';
import { formatCurrencyWithCode, getMonthlyContribution } from '../lib/plannerMath';
import { cn } from '@/lib/utils';

interface FIRETargetsSectionProps {
  fireTargets: ReadonlyArray<{
    label: string;
    target: number;
    monthlySpendSupported: number;
  }>;
  investmentStartingBalance: number;
  realWeightedAnnualRate: number;
  yearsToGoal: number;
  financialFreedomAge: number | null;
  coastFireTargetToday: number;
  coastFireGap: number;
  hasReachedCoastFire: boolean;
  incomeReplacementTarget: number;
  monthlyGapToGoal: number;
  isMonthlyGapPositive: boolean;
}

export function FIRETargetsSection({
  fireTargets,
  investmentStartingBalance,
  realWeightedAnnualRate,
  yearsToGoal,
  financialFreedomAge,
  coastFireTargetToday,
  coastFireGap,
  hasReachedCoastFire,
  incomeReplacementTarget,
  monthlyGapToGoal,
  isMonthlyGapPositive,
}: FIRETargetsSectionProps) {
  const { currencyCode, safeWithdrawalRate } = useCurrentUser();
  const {
    monthlyExpenses,
    setMonthlyExpenses,
    isRefreshingExpenses,
    refreshMonthlyExpenses,
    desiredInvestmentAmount,
    setDesiredInvestmentAmount,
  } = usePlannerRetirementInputs();
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  // Find closest target to current selection
  const selectedTargetIndex = useMemo(() => {
    if (fireTargets.length === 0) return 0;
    let closest = 0;
    let closestDist = Math.abs(fireTargets[0].target - desiredInvestmentAmount);
    for (let i = 1; i < fireTargets.length; i++) {
      const dist = Math.abs(fireTargets[i].target - desiredInvestmentAmount);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    return closest;
  }, [fireTargets, desiredInvestmentAmount]);

  // Compute monthly needed for each target
  const monthlyNeededMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (let i = 0; i < fireTargets.length; i++) {
      map[i] = getMonthlyContribution(
        fireTargets[i].target,
        investmentStartingBalance,
        realWeightedAnnualRate,
        yearsToGoal,
      );
    }
    return map;
  }, [fireTargets, investmentStartingBalance, realWeightedAnnualRate, yearsToGoal]);

  // Compute years to goal for each target
  const yearsToGoalMap = useMemo(() => {
    const map: Record<number, number | null> = {};
    for (let i = 0; i < fireTargets.length; i++) {
      const monthly = monthlyNeededMap[i];
      if (monthly <= 0) {
        // Already past this target
        map[i] = 0;
        continue;
      }
      // Estimate years using simple formula
      const monthlyRate = realWeightedAnnualRate / 100 / 12;
      if (monthlyRate <= 0) {
        map[i] = null;
        continue;
      }
      const target = fireTargets[i].target;
      const pv = investmentStartingBalance;
      const pmt = monthly;
      // FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r = target
      // Solve for n using logarithms
      const fvFactor = target * monthlyRate - pmt * monthlyRate + pmt * monthlyRate;
      const numerator = target * monthlyRate + pmt * monthlyRate;
      const denominator = pv * monthlyRate + pmt * monthlyRate;
      if (denominator <= 0) {
        map[i] = null;
        continue;
      }
      const n = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
      map[i] = n > 0 ? n / 12 : 0;
    }
    return map;
  }, [fireTargets, investmentStartingBalance, realWeightedAnnualRate, monthlyNeededMap]);

  return (
    <div className="space-y-4">
      {/* Compact inputs row */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Monthly Expenses</Label>
                <button
                  type="button"
                  onClick={refreshMonthlyExpenses}
                  disabled={isRefreshingExpenses}
                  className="text-primary text-xs hover:underline"
                >
                  {isRefreshingExpenses ? 'Refreshing...' : 'Refresh from budget'}
                </button>
              </div>
              <FormattedNumberInput
                value={monthlyExpenses}
                onValueChange={setMonthlyExpenses}
                maxFractionDigits={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Safe Withdrawal Rate</Label>
              <div className="bg-muted flex h-10 items-center rounded-md px-3 text-sm font-medium">
                {safeWithdrawalRate.toFixed(2)}%
              </div>
            </div>
            <div className="space-y-2">
              <Label>Coast FIRE</Label>
              <div className="bg-muted flex h-10 items-center rounded-md px-3 text-sm">
                {hasReachedCoastFire ? (
                  <span className="text-success font-medium">
                    Achieved by {fc(Math.abs(coastFireGap))}
                  </span>
                ) : (
                  <span>Need {fc(Math.abs(coastFireGap))} more</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FIRE Variant Cards */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          FIRE Variants
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fireTargets.map((target, index) => (
            <FIREVariantCard
              key={target.label}
              label={target.label}
              target={target.target}
              currentPortfolio={investmentStartingBalance}
              monthlyNeeded={monthlyNeededMap[index] ?? 0}
              yearsToGoal={yearsToGoalMap[index] ?? null}
              isSelected={selectedTargetIndex === index}
              currencyCode={currencyCode}
              onClick={() => setDesiredInvestmentAmount(target.target)}
            />
          ))}
        </div>
      </div>

      {/* Selected target summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Required Monthly
              </p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold',
                  isMonthlyGapPositive ? 'text-success' : 'text-destructive',
                )}
              >
                {fc(monthlyNeededMap[selectedTargetIndex] ?? 0)}
                <span className="text-muted-foreground ml-2 text-sm font-normal">/month</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Monthly gap</p>
              <p
                className={cn(
                  'mt-1 text-lg font-semibold',
                  isMonthlyGapPositive ? 'text-success' : 'text-destructive',
                )}
              >
                {isMonthlyGapPositive ? '+' : ''}
                {fc(monthlyGapToGoal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
