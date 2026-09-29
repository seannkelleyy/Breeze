'use client';
import { InfoTip } from '@/components/common/InfoTip';
import { formatCurrencyWithCode } from '@/lib/utils';
import type { WealthBucket } from '../lib/wealthByTaxTreatment';

const BUCKET_STYLE: Record<string, { bg: string; text: string }> = {
  pretax: { bg: 'oklch(0.75 0.15 60)', text: 'oklch(0.25 0.05 60)' },
  roth: { bg: 'oklch(0.72 0.15 155)', text: 'white' },
  taxable: { bg: 'oklch(0.68 0.12 240)', text: 'white' },
};

export function WealthByTreatmentBar({
  buckets,
  totalInvestment,
  currencyCode,
}: {
  buckets: WealthBucket[];
  totalInvestment: number;
  currencyCode: string;
}) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  if (totalInvestment <= 0) return null;

  const ordered = [...buckets].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-3">
      <div className="flex h-9 w-full overflow-hidden rounded-lg border">
        {ordered.map((bucket) => {
          const style = BUCKET_STYLE[bucket.key];
          const widthPct = (bucket.balance / totalInvestment) * 100;
          if (widthPct <= 0) return null;
          return (
            <div
              key={bucket.key}
              className="flex items-center justify-center text-[10px] font-medium"
              style={{ width: `${widthPct}%`, backgroundColor: style.bg, color: style.text }}
              title={`${bucket.label}: ${fc(bucket.balance)} (${(bucket.percent * 100).toFixed(1)}%)`}
            >
              {widthPct >= 8 && `${(bucket.percent * 100).toFixed(0)}%`}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {ordered
          .filter((b) => b.balance > 0)
          .map((bucket) => {
            const style = BUCKET_STYLE[bucket.key];
            return (
              <div key={bucket.key} className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span
                      className="inline-block h-2 w-3 rounded-sm"
                      style={{ backgroundColor: style.bg }}
                    />
                    {bucket.label}
                    <span className="text-muted-foreground font-normal">
                      — {bucket.description}
                    </span>
                  </span>
                  <span>
                    {fc(bucket.balance)}{' '}
                    <span className="text-muted-foreground">
                      ({(bucket.percent * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="pl-4 text-[11px] text-muted-foreground">
                  {bucket.accounts
                    .map((a) => `${a.name} ${fc(a.amount)}`)
                    .join(' · ')}
                </div>
              </div>
            );
          })}
        <div className="border-t pt-2 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            Total investment wealth <InfoTip text="Investment accounts only — home and vehicle equity are excluded, since you don't draw retirement income from them. Split accounts (e.g. a 70/30 401(k)) contribute to both buckets by their share." />
          </span>
          <span className="float-right font-medium">{fc(totalInvestment)}</span>
        </div>
      </div>
    </div>
  );
}

export default WealthByTreatmentBar;
