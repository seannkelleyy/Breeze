import type { ReactNode } from 'react';

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
  accountLineColors,
}: ProjectionChartCardProps) => {
  const { currencyCode, plannerSummary } = useCurrentUser();
  const targetAge = plannerSummary?.targetAge ?? currentAge;
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currencyCode);
  // Map account dataKey to account name
  const accountNameMap = Object.fromEntries(accounts.map((a, i) => [`account-${i}`, a.name]));
  // Custom tooltip formatter: show account name next to number, colored
  const tooltipFormatter = (value: number, name: string) => {
    const accountName = accountNameMap[name];
    if (accountName) {
      // Find index for color
      const index = Object.keys(accountNameMap).findIndex((k) => k === name);
      const colorVar = `--chart-${(index + 1) % 5}`;
      return (
        <span>
          <span style={{ color: `var(${colorVar})`, fontWeight: 500 }}>{accountName}</span>:{' '}
          {formatCurrency(Number(value))}
        </span>
      );
    }
    // For totalBalance or other keys
    return formatCurrency(Number(value));
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
            data={projectionRows}
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
            tooltipLabelFormatter={(label: string | number) => `Age ${label}`}
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
            {accounts.map((account, index) => (
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
            {accounts.map((account, index) => (
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
