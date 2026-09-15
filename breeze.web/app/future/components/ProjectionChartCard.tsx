import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { Line } from 'recharts';

import { formatCurrencyWithCode } from '../lib/plannerMath';
import BreezeLineChart from '../../../components/common/charts/BreezeLineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

type ProjectionRow = {
  age: number;
  totalBalance: number;
  totalContributions: number;
  [key: `account-${number}`]: number;
};

export type ProjectionChartCardProps = {
  collapsed: boolean;
  toggleControl: ReactNode;
  currentAge: number;
  chartConfig: ChartConfig;
  projectionRows: ProjectionRow[];
  accounts: Array<{ id: string; name: string }>;
  accountLineColors: string[];
};

const ProjectionChartCard = ({
  collapsed,
  toggleControl,
  currentAge,
  chartConfig,
  projectionRows,
  accounts,
}: ProjectionChartCardProps) => {
  const { currencyCode, plannerSummary } = useCurrentUser();
  const targetAge = plannerSummary?.targetAge ?? currentAge;
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);

  // Sort accounts by their final balance value (highest first) and remap data keys
  const { sortedAccounts, remappedRows } = useMemo(() => {
    if (projectionRows.length === 0 || accounts.length === 0) {
      return { sortedAccounts: accounts, remappedRows: projectionRows };
    }
    const lastRow = projectionRows[projectionRows.length - 1];
    const sorted = [...accounts].sort((a, b) => {
      const aIdx = accounts.indexOf(a);
      const bIdx = accounts.indexOf(b);
      const aVal = (lastRow[`account-${aIdx}`] as number) ?? 0;
      const bVal = (lastRow[`account-${bIdx}`] as number) ?? 0;
      return bVal - aVal;
    });
    // Remap projection rows so account-0, account-1, etc. match sorted order
    const remapped = projectionRows.map((row) => {
      const newRow: ProjectionRow = { age: row.age, totalBalance: row.totalBalance, totalContributions: row.totalContributions };
      sorted.forEach((account, newIdx) => {
        const origIdx = accounts.indexOf(account);
        newRow[`account-${newIdx}` as keyof ProjectionRow] = row[`account-${origIdx}` as keyof ProjectionRow] as number;
      });
      return newRow;
    });
    return { sortedAccounts: sorted, remappedRows: remapped };
  }, [accounts, projectionRows]);

  // Map account dataKey to account name
  const accountNameMap = Object.fromEntries(
    sortedAccounts.map((a, i) => [`account-${i}`, a.name]),
  );

  // Custom tooltip formatter: show account name next to number, colored
  const tooltipFormatter = (value: number, name: string) => {
    const accountName = accountNameMap[name];
    if (accountName) {
      const index = Object.keys(accountNameMap).findIndex((k) => k === name);
      const colorVar = `--chart-${(index + 1) % 5}`;
      return (
        <span>
          <span style={{ color: `var(${colorVar})`, fontWeight: 500 }}>{accountName}</span>:{' '}
          {formatCurrency(Number(value))}
        </span>
      );
    }
    return formatCurrency(Number(value));
  };

  // Custom label formatter to show total contributions
  const tooltipLabelFormatter = (
    label: string | number,
    payload: ReadonlyArray<{ payload?: Record<string, unknown> }>,
  ) => {
    const data = payload[0]?.payload as ProjectionRow | undefined;
    return (
      <div>
        <div className="font-medium">Age {label}</div>
        {data && (
          <div className="text-muted-foreground text-xs">
            Total contributions: {formatCurrency(data.totalContributions)}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Projection Chart</CardTitle>
          <CardDescription>
            Total portfolio plus each account from age {currentAge} to {targetAge} using per-account
            monthly inputs.
          </CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent>
          <BreezeLineChart
            config={chartConfig}
            className="h-[320px] w-full"
            data={remappedRows}
            xAxisDataKey="age"
            xAxisMinTickGap={0}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            leftAxis={{
              dataKey: 'totalBalance',
              yAxisId: 'left',
              tickFormatter: (value: number) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return `${value}`;
              },
            }}
            tooltipFormatter={tooltipFormatter}
            tooltipLabelFormatter={tooltipLabelFormatter}
          >
            <Line
              type="monotone"
              dataKey="totalBalance"
              stroke="var(--chart-header)"
              strokeWidth={3}
              dot={false}
              strokeDasharray="6 4"
              yAxisId="left"
            />
            {sortedAccounts.map((account, index) => (
              <Line
                key={account.id}
                type="monotone"
                dataKey={`account-${index}`}
                stroke={'var(--chart-' + ((index + 1) % 5) + ')'}
                strokeWidth={2}
                dot={false}
                yAxisId="left"
              />
            ))}
          </BreezeLineChart>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-6 rounded-sm"
                style={{ backgroundColor: 'hsl(var(--color-balance))' }}
              />
              <span>Total Portfolio</span>
            </div>
            {sortedAccounts.map((account, index) => (
              <div key={account.id} className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-6 rounded-sm"
                  style={{
                    backgroundColor: 'hsl(var(--chart-' + ((index + 1) % 5) + '))',
                  }}
                />
                <span>{account.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default ProjectionChartCard;
