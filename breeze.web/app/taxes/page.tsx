'use client';
import { useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerHydration } from '../future/hooks/usePlannerHydration';
import { usePlannerState } from '../future/providers/PlannerStateProvider';
import { usePaycheckDeductions } from '../future/hooks/planner/usePaycheckDeductions';
import useTaxYear from '../future/hooks/planner/useTaxYear';
import { computeHouseholdWaterfall } from '../future/lib/paycheck';
import { computeTaxScenario, householdPretaxReductions } from './lib/taxScenario';
import { TaxScenarioColumns } from './components/TaxScenarioColumns';
import { WealthByTreatmentBar } from './components/WealthByTreatmentBar';
import { buildBracketLadder } from './lib/taxScenario';
import { getWealthByTaxTreatment } from './lib/wealthByTaxTreatment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrencyWithCode } from '@/lib/utils';
import { InfoTip } from '@/components/common/InfoTip';

export default function TaxesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { currencyCode } = useCurrentUser();
  usePlannerHydration();
  const { plannerPeople, plannerAccounts } = usePlannerState();
  const { deductions: withholdings } = usePaycheckDeductions(null);
  const { filingStatus, updateFilingStatus, deductionType } = useCurrentUser();
  const taxTables = useTaxYear(filingStatus);

  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  const scenario = useMemo(() => {
    if (!taxTables || plannerPeople.length === 0) return null;
    const waterfall = computeHouseholdWaterfall(
      plannerPeople,
      plannerAccounts,
      withholdings,
      taxTables,
      deductionType,
    );
    const grossIncome = waterfall.grossMonthly * 12;
    const reductions = householdPretaxReductions(waterfall);
    return {
      waterfall,
      baseline: computeTaxScenario('Without tax-advantaged accounts', grossIncome, 0, taxTables, deductionType),
      current: computeTaxScenario('Your setup today', grossIncome, reductions, taxTables, deductionType),
    };
  }, [plannerPeople, plannerAccounts, withholdings, taxTables, deductionType]);
  const { waterfall, baseline, current } = scenario ?? {};
  const wealth = useMemo(() => getWealthByTaxTreatment(plannerAccounts), [plannerAccounts]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const loading = !scenario || !waterfall || !taxTables;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Taxes</h1>
        <p className="text-muted-foreground text-sm">
          Where your household income lands in the federal bracket ladder — and what your
          pre-tax choices do about it. {taxTables ? `${taxTables.year} brackets · ` : ''}
          {filingStatus === 'MFJ'
            ? 'Married filing jointly'
            : filingStatus === 'MFS'
              ? 'Married filing separately'
              : filingStatus === 'HOH'
                ? 'Head of household'
                : 'Single'}{' '}
          · {deductionType === 'ITEMIZED' ? 'itemized' : 'standard'} deduction.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Filing status:</span>
          <Select value={filingStatus} onValueChange={updateFilingStatus}>
            <SelectTrigger className="h-8 w-56 text-sm">
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
      </div>

      {(loading || !baseline || !current) ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            {plannerPeople.length === 0 ? (
              <>Add household members on the People page to model your taxes.</>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading tax tables…
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>The pre-tax effect</CardTitle>
              <CardDescription>
                Same income, two worlds: with and without the tax-advantaged moves you make
                during the year.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TaxScenarioColumns
                baseline={baseline}
                current={current}
                brackets={taxTables.brackets}
                currencyCode={currencyCode}
              />
              <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Tax saved per year
                  </p>
                  <p className="text-lg font-semibold text-success">
                    {fc(baseline.totalTax - current.totalTax)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Effective rate
                  </p>
                  <p className="text-lg font-semibold">
                    {(baseline.effectiveRate * 100).toFixed(1)}%{' '}
                    <span className="text-muted-foreground text-sm">→</span>{' '}
                    {(current.effectiveRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Pre-tax reductions
                  </p>
                  <p className="text-lg font-semibold">{fc(current.pretaxReductions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What you&apos;re doing to lower your taxes</CardTitle>
              <CardDescription>
                Everything the &ldquo;Your setup today&rdquo; bar strips out before brackets apply.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  Pre-tax 401(k) / HSA contributions
                  <InfoTip text="Only the pre-tax share of your contributions counts here — Roth portions are taxed now. Includes your household's split elections." />
                </span>
                <span className="font-medium">
                  {fc(waterfall.pretaxSavingsMonthly * 12)}/yr
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  Pre-tax withholdings (insurance, FSA…)
                  <InfoTip text="Payroll deductions without an account behind them — managed per person on the People page." />
                </span>
                <span className="font-medium">
                  {fc(waterfall.pretaxWithholdingsMonthly * 12)}/yr
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  {deductionType === 'ITEMIZED' ? 'Itemized deduction' : 'Standard deduction'}
                  <InfoTip text="Subtracted from income before brackets apply. Itemized amounts aren't modeled line-by-line, so itemized filers show $0 here." />
                </span>
                <span className="font-medium">{fc(current.deduction)}/yr</span>
              </div>
              <p className="text-muted-foreground border-t pt-3 text-xs">
                Employer match never appears here — it isn&apos;t income to you and doesn&apos;t
                affect your taxes. Roth contributions are also absent: they&apos;re taxed now and
                grow tax-free.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wealth by tax treatment</CardTitle>
              <CardDescription>
                Where your investment wealth sits today — the map you&apos;ll use to plan
                retirement withdrawals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WealthByTreatmentBar
                buckets={wealth.buckets}
                totalInvestment={wealth.totalInvestment}
                currencyCode={currencyCode}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
