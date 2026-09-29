'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyWithCode } from '@/lib/utils';
import { InfoTip } from '@/components/common/InfoTip';
import {
  buildBracketLadder,
  buildScenarioColumns,
  type TaxScenario,
} from '../lib/taxScenario';

/** Segment colors keyed by marginal rate — cool to hot as rates climb. */
const RATE_COLORS: Record<number, string> = {
  0.1: 'oklch(0.85 0.09 145)',
  0.12: 'oklch(0.8 0.12 130)',
  0.22: 'oklch(0.8 0.14 90)',
  0.24: 'oklch(0.75 0.15 60)',
  0.32: 'oklch(0.68 0.17 35)',
  0.35: 'oklch(0.62 0.19 25)',
  0.37: 'oklch(0.55 0.21 15)',
};
const rateColor = (rate: number) => RATE_COLORS[rate] ?? `oklch(0.7 0.15 ${(rate * 1000) % 360})`;

const PRETAX_COLOR = 'oklch(0.72 0.15 155)';
const DEDUCTION_COLOR = 'oklch(0.68 0.12 240)';

export function TaxScenarioColumns({
  baseline,
  current,
  brackets,
  currencyCode,
}: {
  baseline: TaxScenario;
  current: TaxScenario;
  brackets: { minimum: number; maximum: number | null; rate: number }[];
  currencyCode: string;
}) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const { rates, rows } = buildScenarioColumns(baseline, current);
  const scenarioByLabel: Record<string, TaxScenario> = {
    [baseline.label]: baseline,
    [current.label]: current,
  };

  const ladder = buildBracketLadder(current.taxableIncome, brackets);
  const currentRow = ladder.find((r) => r.status === 'current');
  const nextRow = ladder.find((r) => r.status === 'ahead');

  return (
    <div className="space-y-3">
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v: number) => fc(v)}
              width={78}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const scenario = scenarioByLabel[String(label)];
                const lines = payload
                  .filter((entry) => Number(entry.value) > 0)
                  .map((entry) => {
                    const key = String(entry.dataKey);
                    const value = fc(Number(entry.value));
                    if (key.startsWith('b')) {
                      const rate = Number(key.slice(1)) / 100;
                      const slice = scenario?.slices.find((s) => s.rate === rate);
                      return {
                        name: `${(rate * 100).toFixed(0)}% bracket`,
                        detail: `${value} income → ${fc(slice?.tax ?? 0)} tax`,
                        color: rateColor(rate),
                      };
                    }
                    return {
                      name: key === 'preTax' ? 'Pre-tax reductions' : 'Deduction',
                      detail: `${value} not taxed`,
                      color: key === 'preTax' ? PRETAX_COLOR : DEDUCTION_COLOR,
                    };
                  });
                return (
                  <div className="bg-background rounded-lg border p-3 text-xs shadow-md">
                    <p className="mb-1 font-medium">{String(label)}</p>
                    {lines.map((l) => (
                      <p key={l.name} className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-3 rounded-sm"
                          style={{ backgroundColor: l.color }}
                        />
                        {l.name}: {l.detail}
                      </p>
                    ))}
                    {scenario && (
                      <p className="mt-1 border-t pt-1">
                        Total tax: {fc(scenario.totalTax)} · effective{' '}
                        {(scenario.effectiveRate * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
            />
            <Bar
              dataKey="preTax"
              stackId="income"
              name="Pre-tax reductions"
              fill={PRETAX_COLOR}
              maxBarSize={110}
            />
            <Bar
              dataKey="deduction"
              stackId="income"
              name="Deduction"
              fill={DEDUCTION_COLOR}
              maxBarSize={110}
            />
            {rates.map((rate) => (
              <Bar
                key={rate}
                dataKey={`b${rate * 100}`}
                stackId="income"
                name={`${(rate * 100).toFixed(0)}% bracket`}
                fill={rateColor(rate)}
                maxBarSize={110}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {currentRow && (
        <p className="text-muted-foreground text-xs">
          You&apos;re in the{' '}
          <span className="text-foreground font-medium">
            {(currentRow.rate * 100).toFixed(0)}% bracket
          </span>{' '}
          — {fc(currentRow.used)} of income fills it,{' '}
          <span className="text-foreground font-medium">{fc(currentRow.remainingToNext ?? 0)}</span>{' '}
          more before the{' '}
          {(nextRow?.rate ?? 0) * 100}% rate applies.
          <InfoTip text="Every dollar of additional gross income above that line is taxed at the next rate; every additional pre-tax dollar is saved at the current one." />
        </p>
      )}
    </div>
  );
}

export default TaxScenarioColumns;
