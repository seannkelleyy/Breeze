'use client';
import { formatCurrencyWithCode } from '@/lib/utils';
import { InfoTip } from '@/components/common/InfoTip';
import type { BracketLadderRow } from '../lib/taxScenario';

const rateColor = (rate: number): { bg: string; text: string } => ({
  bg: `oklch(0.75 0.15 ${(rate * 1000) % 360})`,
  text: 'oklch(0.25 0.05 60)',
});

export function BracketLadder({
  rows,
  currencyCode,
}: {
  rows: BracketLadderRow[];
  currencyCode: string;
}) {
  const fmt = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const rangeLabel = (row: BracketLadderRow) =>
    row.maximum === null ? `${fmt(row.minimum)}+` : `${fmt(row.minimum)} – ${fmt(row.maximum)}`;

  const currentRow = rows.find((r) => r.status === 'current');
  const nextRow = rows.find((r) => r.status === 'ahead');

  return (
    <div className="space-y-1">
      {currentRow && (
        <div className="space-y-1 pb-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {(currentRow.rate * 100).toFixed(0)}% bracket — {fmt(currentRow.used)} so far
            </span>
            <span className="font-medium">
              {fmt(currentRow.remainingToNext ?? 0)} until {((nextRow?.rate ?? 0) * 100).toFixed(0)}
              %
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: `${((currentRow.used / (currentRow.used + (currentRow.remainingToNext ?? 0)) || 0) * 100).toFixed(1)}%`,
                backgroundColor: rateColor(currentRow.rate).bg,
              }}
            />
          </div>
        </div>
      )}
      <div className="text-muted-foreground flex items-center gap-1 text-xs">
        Bracket ladder
        <InfoTip text="Every federal bracket for your filing status, your taxable income's progress through it, and how much income remains before each higher rate begins." />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">Rate</th>
              <th className="px-3 py-1.5 text-left font-medium">Income range</th>
              <th className="px-3 py-1.5 text-left font-medium">Progress</th>
              <th className="px-3 py-1.5 text-right font-medium">Tax here</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { bg, text } = rateColor(row.rate);
              const isCurrent = row.status === 'current';
              return (
                <tr key={row.rate} className={isCurrent ? 'bg-primary/5 font-medium' : 'border-t'}>
                  <td className="px-3 py-1.5">
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: isCurrent ? text : undefined }}
                    >
                      <span
                        className="inline-block h-2 w-3 rounded-sm"
                        style={{ backgroundColor: bg }}
                      />
                      {(row.rate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-muted-foreground px-3 py-1.5">{rangeLabel(row)}</td>
                  <td className="px-3 py-1.5">
                    {row.status === 'filled' && (
                      <span className="text-muted-foreground">
                        Filled — {fmt(row.used)} taxed here
                      </span>
                    )}
                    {row.status === 'current' && (
                      <span>
                        {fmt(row.used)} used
                        {row.remainingToNext !== null && (
                          <span className="text-muted-foreground">
                            {' '}
                            · {fmt(row.remainingToNext)} until the next bracket
                          </span>
                        )}
                      </span>
                    )}
                    {row.status === 'ahead' && (
                      <span className="text-muted-foreground">
                        +{fmt(row.distanceToEnter ?? 0)} of income to enter
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right">{fmt(row.tax)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BracketLadder;
