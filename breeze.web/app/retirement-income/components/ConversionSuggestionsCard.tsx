'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Lightbulb } from 'lucide-react';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlannerHydration } from '../../future/hooks/usePlannerHydration';
import { usePlannerModel } from '../../future/hooks/planner';
import useTaxYear from '../../future/hooks/planner/useTaxYear';
import { buildConversionSuggestions } from '../../future/lib/tax';
import { formatCurrencyWithCode } from '@/lib/utils';

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

/**
 * Bracket-fill guidance for Roth conversions: how much pre-tax money to move
 * each year so taxable income lands at — but not above — the chosen bracket's
 * ceiling. Headroom opens up in retirement when the salary disappears; while
 * working, the salary usually already fills past the low brackets.
 */
const ConversionSuggestionsCard = () => {
  const { filingStatus, currencyCode } = useCurrentUser();
  const taxTables = useTaxYear(filingStatus);
  usePlannerHydration();
  const { accounts, currentAge, targetAge, householdPeople } = usePlannerModel();
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);

  const [targetRate, setTargetRate] = useState(0.12);

  const pretaxBalance = useMemo(
    () =>
      accounts
        .filter((a) => ['traditional-ira', '401k', '403b', '457'].includes(a.accountType))
        .reduce((sum, a) => sum + Math.max(0, a.startingBalance), 0),
    [accounts],
  );

  const householdSalary = useMemo(
    () => householdPeople.reduce((sum, p) => sum + Math.max(0, p.annualSalary), 0),
    [householdPeople],
  );

  const rows = useMemo(() => {
    if (!taxTables || currentAge <= 0) return [];
    return buildConversionSuggestions({
      currentYear: new Date().getFullYear(),
      currentAge,
      retirementAge: targetAge,
      annualSalary: householdSalary,
      brackets: taxTables.brackets,
      standardDeduction: taxTables.standardDeduction,
      pretaxBalance,
      targetRate,
      years: Math.min(30, Math.max(10, targetAge - currentAge + 11)),
    });
  }, [taxTables, currentAge, targetAge, householdSalary, pretaxBalance, targetRate]);

  const rates = useMemo(
    () => [...new Set((taxTables?.brackets ?? []).map((b) => b.rate))].sort((a, b) => a - b),
    [taxTables],
  );

  if (!taxTables) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" /> How much to convert each year
        </CardTitle>
        <CardDescription>
          Fill — but never leave — the chosen bracket: convert the headroom between your other
          income and the bracket ceiling. Years where your salary already passes the ceiling
          suggest nothing. Today&apos;s brackets, applied forward; retirement plan draws on the
          Future page will use some of this headroom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Label className="text-sm">Fill the</Label>
          <Select value={String(targetRate)} onValueChange={(v) => setTargetRate(Number(v))}>
            <SelectTrigger className="h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rates.map((rate) => (
                <SelectItem key={rate} value={String(rate)}>
                  {pct(rate)} bracket
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">
            of {filingStatus === 'MFJ' ? 'married filing jointly' : filingStatus.toLowerCase()} income
          </span>
        </div>

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="py-2 pr-3 font-medium">Year</th>
                  <th className="py-2 pr-3 font-medium">Age</th>
                  <th className="py-2 pr-3 font-medium">Other income</th>
                  <th className="py-2 pr-3 font-medium">Convert up to</th>
                  <th className="py-2 pr-3 font-medium">Bracket</th>
                  <th className="py-2 font-medium">Est. federal tax</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.year} className="border-b last:border-0">
                    <td className="py-2 pr-3">{row.year}</td>
                    <td className="py-2 pr-3">{row.age}</td>
                    <td className="py-2 pr-3">{fc(row.otherTaxableIncome)}</td>
                    <td className="py-2 pr-3 font-medium">
                      {row.conversion > 0 ? fc(row.conversion) : '—'}
                    </td>
                    <td className="py-2 pr-3">{pct(row.marginalRate)}</td>
                    <td className="py-2">{fc(row.federalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionSuggestionsCard;
