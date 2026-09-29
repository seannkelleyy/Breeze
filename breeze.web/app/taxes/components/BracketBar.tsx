'use client';
import { InfoTip } from '@/components/common/InfoTip';
import { formatCurrencyWithCode } from '@/lib/utils';
import type { TaxScenario } from '../lib/taxScenario';

const fc = (v: number) => formatCurrencyWithCode(v, 'USD');

/** Segment colors keyed by marginal rate — cool to hot as rates climb. */
const RATE_COLORS: Record<number, { bg: string; text: string }> = {
  0.1: { bg: 'oklch(0.85 0.09 145)', text: 'oklch(0.3 0.05 145)' },
  0.12: { bg: 'oklch(0.8 0.12 130)', text: 'oklch(0.3 0.05 130)' },
  0.22: { bg: 'oklch(0.8 0.14 90)', text: 'oklch(0.3 0.05 90)' },
  0.24: { bg: 'oklch(0.75 0.15 60)', text: 'oklch(0.25 0.05 60)' },
  0.32: { bg: 'oklch(0.68 0.17 35)', text: 'white' },
  0.35: { bg: 'oklch(0.62 0.19 25)', text: 'white' },
  0.37: { bg: 'oklch(0.55 0.21 15)', text: 'white' },
};
const rateColor = (rate: number) =>
  RATE_COLORS[rate] ?? {
    bg: `oklch(0.7 0.15 ${(rate * 1000) % 360})`,
    text: 'white',
  };

export function BracketBar({ scenario }: { scenario: TaxScenario }) {
  const gross = scenario.grossIncome;
  if (gross <= 0) return null;

  const pct = (v: number) => `${(v / gross) * 100}%`;
  const reductionsPct = (scenario.pretaxReductions / gross) * 100;
  const deductionPct = (scenario.deduction / gross) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-9 w-full overflow-hidden rounded-lg border">
        {scenario.pretaxReductions > 0 && (
          <div
            className="flex items-center justify-center bg-emerald-500/80 text-[10px] font-medium text-white"
            style={{ width: pct(scenario.pretaxReductions) }}
            title={`Pre-tax reductions: ${fc(scenario.pretaxReductions)}`}
          >
            {reductionsPct >= 7 && 'Pre-tax'}
          </div>
        )}
        {scenario.deduction > 0 && (
          <div
            className="flex items-center justify-center bg-sky-500/70 text-[10px] font-medium text-white"
            style={{ width: pct(scenario.deduction) }}
            title={`Standard deduction: ${fc(scenario.deduction)}`}
          >
            {deductionPct >= 7 && 'Deduction'}
          </div>
        )}
        {scenario.slices.map((slice) => {
          const { bg, text } = rateColor(slice.rate);
          const widthPct = (slice.taxedAmount / gross) * 100;
          return (
            <div
              key={slice.rate}
              className="flex items-center justify-center text-[10px] font-medium"
              style={{ width: `${widthPct}%`, backgroundColor: bg, color: text }}
              title={`${(slice.rate * 100).toFixed(0)}% bracket: ${fc(slice.taxedAmount)} taxed → ${fc(slice.tax)} tax`}
            >
              {widthPct >= 6 && `${(slice.rate * 100).toFixed(0)}%`}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Taxable income</p>
          <p className="font-medium">{fc(scenario.taxableIncome)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">
            Total tax{' '}
            <InfoTip text="Federal income tax by bracket plus FICA (Social Security + Medicare). State taxes are not modeled." />
          </p>
          <p className="font-medium">{fc(scenario.totalTax)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Effective rate</p>
          <p className="font-medium">{(scenario.effectiveRate * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Marginal rate</p>
          <p className="font-medium">{(scenario.marginalRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      {scenario.slices.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {scenario.slices.map((slice) => {
            const { bg } = rateColor(slice.rate);
            return (
              <span key={slice.rate} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2 w-3 rounded-sm"
                  style={{ backgroundColor: bg }}
                />
                {(slice.rate * 100).toFixed(0)}% bracket · {fc(slice.tax)} tax
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BracketBar;
