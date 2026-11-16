'use client';
import { useMemo } from 'react';
import { Line } from 'recharts';
import { Clock } from 'lucide-react';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BreezeLineChart from '@/components/common/charts/BreezeLineChart';
import type { RothConversionBucket } from '@/features/retirement-access/hooks/useRetirementAccess';

const timelineChartConfig = {
  roth: { label: 'Penalty-free Roth principal', color: 'var(--chart-1)' },
  hsa: { label: 'HSA receipts (available now)', color: 'var(--chart-2)' },
} satisfies ChartConfig;

// When money becomes reachable: HSA receipt balance is spendable today, while
// converted Roth principal steps up each January 1 a bucket clears its
// five-year clock.
export function AccessTimelineCard({
  buckets,
  hsaAvailable,
  fc,
}: {
  buckets: RothConversionBucket[];
  hsaAvailable: number;
  fc: (v: number) => string;
}) {
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const unlockYears = buckets.map((b) => Number(b.availableOn.slice(0, 4)));
    const lastYear = Math.max(currentYear, ...unlockYears);

    const rows: Array<{ year: string; roth: number; hsa: number }> = [];
    for (let year = currentYear; year <= lastYear; year++) {
      const roth = buckets
        .filter((b) => Number(b.availableOn.slice(0, 4)) <= year)
        .reduce((sum, b) => sum + Number(b.amount), 0);
      rows.push({ year: String(year), roth, hsa: hsaAvailable });
    }
    return rows;
  }, [buckets, hsaAvailable]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" /> When your money unlocks
        </CardTitle>
        <CardDescription>
          HSA receipts are reimburseable today; each Roth conversion step becomes penalty-free five
          years after its tax year (earnings still follow the age-59½ rules).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BreezeLineChart
          config={timelineChartConfig}
          className="h-[220px] w-full"
          data={chartData}
          xAxisDataKey="year"
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          leftAxis={{
            dataKey: 'roth',
            yAxisId: 'left',
            tickFormatter: (value: number) => {
              if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return `${value}`;
            },
          }}
          tooltipFormatter={(value: number, name: string) => `${fc(value)} — ${name}`}
        >
          <Line
            type="stepAfter"
            dataKey="roth"
            stroke="var(--color-roth)"
            strokeWidth={2}
            dot={false}
            yAxisId="left"
          />
          <Line
            type="monotone"
            dataKey="hsa"
            stroke="var(--color-hsa)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            yAxisId="left"
          />
        </BreezeLineChart>
      </CardContent>
    </Card>
  );
}
