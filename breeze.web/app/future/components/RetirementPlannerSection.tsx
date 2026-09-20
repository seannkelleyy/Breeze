'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { cn, formatCurrencyWithCode } from '@/lib/utils';
import { usePlannerState } from '../providers/PlannerStateProvider';
import { PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE } from '../lib/constants';
import { getMonthlyContribution } from '../lib/plannerMath';

interface Milestone {
  label: string;
  target: number;
  achievementAge: number | null;
  yearsToAchieve: number | null;
}

interface RetirementPlannerSectionProps {
  milestones: Milestone[];
  currentAge: number;
  targetAge: number;
  /** Investable (income-generating) assets only — excludes home/vehicle equity. */
  investmentStartingBalance: number;
  /** Real (inflation-adjusted) weighted return, in percent. */
  realWeightedAnnualRate: number;
  projectedNetWorthAtTargetAge: number;
  totalPlannedMonthlyInvestment: number;
  currencyCode: string;
}

export function RetirementPlannerSection({
  milestones,
  currentAge,
  targetAge,
  investmentStartingBalance,
  realWeightedAnnualRate,
  projectedNetWorthAtTargetAge,
  totalPlannedMonthlyInvestment,
  currencyCode,
}: RetirementPlannerSectionProps) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const { plannerSummary, plannerDesiredInvestmentAmount, setPlannerDesiredInvestmentAmount } =
    usePlannerState();
  const annualHouseholdIncome = plannerSummary?.annualHouseholdIncome ?? 0;
  const plannedMonthlyRate = plannerSummary?.currentSavingsRateTotalPercent ?? 0;
  const freedomTarget = plannerSummary?.financialFreedomTarget ?? 0;
  const annualNeedAtRetirement = plannerSummary?.annualNeedAtRetirement ?? 0;

  const yearsToGoal = Math.max(0, targetAge - currentAge);

  const rows = useMemo(
    () =>
      milestones.map((m) => {
        const requiredMonthly = getMonthlyContribution(
          m.target,
          investmentStartingBalance,
          realWeightedAnnualRate,
          yearsToGoal,
        );
        const requiredRate =
          annualHouseholdIncome > 0 ? (requiredMonthly * 12 * 100) / annualHouseholdIncome : 0;
        const progressPct = m.target > 0 ? (investmentStartingBalance / m.target) * 100 : 0;
        return {
          ...m,
          requiredRate,
          progressPct,
          isEditable: m.label === 'Custom',
        };
      }),
    [
      milestones,
      investmentStartingBalance,
      realWeightedAnnualRate,
      yearsToGoal,
      annualHouseholdIncome,
    ],
  );

  if (!plannerSummary) {
    return null;
  }

  const gridCls =
    'grid grid-cols-[1.3fr_0.9fr_1fr_3rem] gap-2 sm:grid-cols-[1.4fr_0.8fr_1.1fr_0.6fr_3rem_3.5rem_3.5rem]';

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">FIRE &amp; Retirement Planner</h2>
      <Card className="bg-muted/50">
        <CardContent className="space-y-6 p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Investable Assets
              </p>
              <p className="text-lg font-semibold">{fc(investmentStartingBalance)}</p>
              <p className="text-muted-foreground text-xs">(income-generating only)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Planned Monthly
              </p>
              <p className="text-lg font-semibold">{fc(totalPlannedMonthlyInvestment)}</p>
              <p className="text-muted-foreground text-xs">
                ({fc(totalPlannedMonthlyInvestment * 12)} per year)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Savings Rate
              </p>
              <p className="text-lg font-semibold">{plannedMonthlyRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Projected at Age {targetAge}
              </p>
              <p className="text-lg font-semibold">{fc(projectedNetWorthAtTargetAge)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Retirement Spending
              </p>
              <Link
                href="/expenses"
                className="group inline-flex items-baseline hover:underline"
                title="Based on your recurring expenses — click to edit"
              >
                <span className="text-lg font-semibold group-hover:underline">
                  {fc(annualNeedAtRetirement / 12)}
                </span>
                <span className="text-muted-foreground ml-1 text-xs font-normal">per month</span>
              </Link>
              <p className="text-muted-foreground text-xs">
                ({fc(annualNeedAtRetirement)} per year · from your{' '}
                <Link href="/expenses" className="underline-offset-2 hover:underline">
                  expenses
                </Link>
                )
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Weighted Return
              </p>
              <p className="text-lg font-semibold">{realWeightedAnnualRate.toFixed(2)}%</p>
            </div>
          </div>

          <div className="space-y-1 border-t pt-4">
            <div className={cn(gridCls, 'px-2')}>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Milestone
              </p>
              <p className="text-muted-foreground text-right text-xs font-medium tracking-wide uppercase">
                Target
              </p>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Progress
              </p>
              <p className="text-muted-foreground text-right text-xs font-medium tracking-wide uppercase">
                Age
              </p>
              <p className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase sm:block">
                Req. Rate
              </p>
              <p className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase sm:block">
                In
              </p>
              <p className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase sm:block">
                Year
              </p>
            </div>
            {rows.map((m) => {
              const achieved = m.achievementAge !== null && m.achievementAge <= currentAge;
              const onTrack = plannedMonthlyRate >= m.requiredRate;
              return (
                <div
                  key={m.label}
                  className={cn(
                    gridCls,
                    'items-center rounded-md px-2 py-1.5 text-sm',
                    achieved && 'bg-success/5',
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn('truncate font-medium', achieved && 'text-success')}>
                      {m.label}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {m.label === 'Income replacement'
                        ? `Replaces ${PLANNER_DEFAULT_INCOME_REPLACEMENT_RATE}% of income`
                        : m.label === 'Custom'
                          ? 'Your own target amount'
                          : `${((m.target / (freedomTarget || 1)) * 100).toFixed(0)}% of freedom target`}
                    </p>
                  </div>
                  {m.isEditable ? (
                    <FormattedNumberInput
                      id="custom-target-amount"
                      value={plannerDesiredInvestmentAmount}
                      onValueChange={setPlannerDesiredInvestmentAmount}
                      min={0}
                      maxFractionDigits={0}
                      inputMode="numeric"
                    />
                  ) : (
                    <p className="text-right font-medium">{fc(m.target)}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          m.progressPct >= 100 ? 'bg-success' : 'bg-info',
                        )}
                        style={{ width: `${Math.min(100, m.progressPct)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'w-10 text-right text-xs',
                        m.progressPct >= 100 ? 'text-success font-medium' : 'text-muted-foreground',
                      )}
                    >
                      {m.progressPct.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-right">
                    {m.achievementAge !== null ? (
                      <span className={cn(achieved && 'text-success font-medium')}>
                        {achieved ? '✓ ' : ''}
                        {m.achievementAge}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                  <p
                    className={cn(
                      'hidden text-right text-xs font-medium sm:block',
                      onTrack ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {m.requiredRate.toFixed(1)}%
                  </p>
                  <p className="hidden text-right text-xs sm:block">
                    {m.yearsToAchieve === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : m.yearsToAchieve === 0 ? (
                      <span className="text-success font-medium">Now</span>
                    ) : (
                      `${m.yearsToAchieve} yrs`
                    )}
                  </p>
                  <p className="text-muted-foreground hidden text-right text-xs sm:block">
                    {m.yearsToAchieve === null ? '—' : new Date().getFullYear() + m.yearsToAchieve}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
