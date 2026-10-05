'use client';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyWithCode } from '@/lib/utils';
import { InfoTip } from '@/components/common/InfoTip';
import { buildBracketLadder, type TaxScenario } from '../lib/taxScenario';

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
  const data = [
    {
      name: 'Just income',
      totalTax: baseline.totalTax,
      effectiveRate: baseline.effectiveRate,
      fill: 'oklch(0.62 0.19 25)',
    },
    {
      name: 'Your setup today',
      totalTax: current.totalTax,
      effectiveRate: current.effectiveRate,
      fill: 'oklch(0.72 0.15 155)',
    },
  ];

  const ladder = buildBracketLadder(current.taxableIncome, brackets);
  const currentRow = ladder.find((r) => r.status === 'current');
  const nextRow = ladder.find((r) => r.status === 'ahead');

  return (
    <div className="space-y-3">
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 28, right: 16, left: 8, bottom: 0 }} barGap={80}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v: number) => fc(v)}
              width={78}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as {
                  name: string;
                  totalTax: number;
                  effectiveRate: number;
                };
                return (
                  <div className="bg-background rounded-lg border p-3 text-xs shadow-md">
                    <p className="font-medium">{row.name}</p>
                    <p>Total tax: {fc(row.totalTax)}</p>
                    <p className="text-muted-foreground">
                      {(row.effectiveRate * 100).toFixed(1)}% effective (incl. FICA)
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="totalTax" maxBarSize={140} radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="totalTax"
                position="top"
                formatter={(v: number) => fc(v)}
                style={{ fontWeight: 600, fill: 'var(--foreground)' }}
              />
              <LabelList
                dataKey="effectiveRate"
                position="top"
                content={(props: { x?: number | string; y?: number | string; index?: number }) => {
                  const entry = data[Number(props.index)];
                  if (!entry) return null;
                  return (
                    <text
                      x={Number(props.x)}
                      y={Number(props.y) + 18}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--muted-foreground)"
                    >
                      {(entry.effectiveRate * 100).toFixed(1)}% effective
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {currentRow && (
        <p className="text-center text-xs">
          You&apos;re in the{' '}
          <span className="font-medium">{(currentRow.rate * 100).toFixed(0)}% bracket</span> —{' '}
          {fc(currentRow.used)} fills it,{' '}
          <span className="font-medium">{fc(currentRow.remainingToNext ?? 0)}</span> more before the{' '}
          {(nextRow?.rate ?? 0) * 100}% rate applies.
          <InfoTip text="Every dollar of additional gross income above that line is taxed at the next rate; every additional pre-tax dollar is saved at the current one." />
        </p>
      )}
    </div>
  );
}

export default TaxScenarioColumns;
