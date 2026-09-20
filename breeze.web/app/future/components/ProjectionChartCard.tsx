import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { isCombinedAssetType, isLiabilityAccountType } from '../lib/config';
import type { AccountType } from '../types/account';
import type { ProjectionRow } from '../types/projection';

import { Line, ReferenceLine } from 'recharts';

import { Button } from '@/components/ui/button';
import { formatCurrencyWithCode } from '@/lib/utils';
import BreezeLineChart from '../../../components/common/charts/BreezeLineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';

const AGGREGATE_SERIES = new Set(['totalBalance', 'investable', 'property']);

export type ProjectionChartCardProps = {
  collapsed: boolean;
  toggleControl: ReactNode;
  currentAge: number;
  targetAge: number;
  chartConfig: ChartConfig;
  projectionRows: ProjectionRow[];
  accounts: Array<{ id: string; name: string; accountType: string }>;
  projectionEndAge: number;
  setProjectionEndAge: (age: number) => void;
  retirementAge: number;
  setRetirementAge: (age: number) => void;
  marketAdjustment: number;
  setMarketAdjustment: (adjustment: number) => void;
};

const ProjectionChartCard = ({
  collapsed,
  toggleControl,
  currentAge,
  targetAge,
  chartConfig,
  projectionRows,
  accounts,
  projectionEndAge,
  setProjectionEndAge,
  retirementAge,
  setRetirementAge,
  marketAdjustment,
  setMarketAdjustment,
}: ProjectionChartCardProps) => {
  const { currencyCode } = useCurrentUser();
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
    // Remap projection rows so account-0, account-1, etc. match sorted order,
    // and split the total into investable vs property assets — home/vehicle
    // equity keeps growing after retirement and hides portfolio drawdown.
    const remapped = projectionRows.map((row) => {
      const newRow: ProjectionRow = {
        age: row.age,
        totalBalance: row.totalBalance,
        totalContributions: row.totalContributions,
      };
      let investable = 0;
      let property = 0;
      sorted.forEach((account, newIdx) => {
        const origIdx = accounts.indexOf(account);
        const value = row[`account-${origIdx}` as keyof ProjectionRow] as number;
        newRow[`account-${newIdx}` as keyof ProjectionRow] = value;
        if (isCombinedAssetType(account.accountType as AccountType)) property += value;
        else if (!isLiabilityAccountType(account.accountType as AccountType)) investable += value;
      });
      newRow.investable = investable;
      newRow.property = property;
      return newRow;
    });
    return { sortedAccounts: sorted, remappedRows: remapped };
  }, [accounts, projectionRows]);

  // Series visibility: the three aggregates default on, individual account
  // lines default off (toggle with the chips under the sliders).
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const isVisible = (key: string) => visibility[key] ?? AGGREGATE_SERIES.has(key);
  const toggleSeries = (key: string) =>
    setVisibility((prev) => ({ ...prev, [key]: !(prev[key] ?? AGGREGATE_SERIES.has(key)) }));

  const seriesChips = [
    { key: 'totalBalance', label: 'All Assets' },
    { key: 'investable', label: 'Investable' },
    { key: 'property', label: 'Property' },
    ...sortedAccounts.map((account, index) => ({
      key: `account-${index}`,
      label: account.name || 'Unnamed',
    })),
  ];

  // Map account dataKey to account name
  const accountNameMap: Record<string, string> = {
    totalBalance: 'All Assets',
    investable: 'Investable',
    property: 'Property',
    ...Object.fromEntries(sortedAccounts.map((a, i) => [`account-${i}`, a.name])),
  };

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
            Total portfolio plus each account from age {currentAge} to {projectionEndAge}
            {projectionEndAge > targetAge ? ' (including post-retirement drawdown)' : ''}.
          </CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-muted-foreground text-xs">Retirement age:</span>
            <input
              type="range"
              min={currentAge + 1}
              max={95}
              step={1}
              value={retirementAge}
              onChange={(e) => {
                const age = Number(e.target.value);
                setRetirementAge(age);
                if (age > projectionEndAge) setProjectionEndAge(age);
              }}
              className="accent-primary h-1.5 flex-1 cursor-pointer"
            />
            <span className="w-16 text-right text-xs font-medium">Age {retirementAge}</span>
          </div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-muted-foreground text-xs">Market adjustment:</span>
            <input
              type="range"
              min={-5}
              max={0}
              step={0.25}
              value={marketAdjustment}
              onChange={(e) => setMarketAdjustment(Number(e.target.value))}
              className="accent-destructive h-1.5 flex-1 cursor-pointer"
            />
            <span
              className={`w-16 text-right text-xs font-medium ${marketAdjustment < 0 ? 'text-destructive' : ''}`}
            >
              {marketAdjustment === 0 ? 'Base' : `${marketAdjustment}%/yr`}
            </span>
          </div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-muted-foreground text-xs">Projection range:</span>
            <input
              type="range"
              min={targetAge}
              max={95}
              step={1}
              value={projectionEndAge}
              onChange={(e) => setProjectionEndAge(Number(e.target.value))}
              className="accent-primary h-1.5 flex-1 cursor-pointer"
            />
            <span className="w-16 text-right text-xs font-medium">Age {projectionEndAge}</span>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-xs">Show:</span>
            {seriesChips.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                size="xs"
                variant={isVisible(chip.key) ? 'default' : 'outline'}
                onClick={() => toggleSeries(chip.key)}
              >
                {chip.label}
              </Button>
            ))}
          </div>
          <BreezeLineChart
            config={chartConfig}
            className="h-[320px] w-full"
            data={remappedRows}
            xAxisDataKey="age"
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
            <ReferenceLine
              x={retirementAge}
              yAxisId="left"
              stroke="var(--chart-header)"
              strokeDasharray="4 4"
              label={{
                value: 'Retirement',
                position: 'insideTopRight',
                fill: 'var(--muted-foreground)',
                fontSize: 10,
              }}
            />
            {isVisible('totalBalance') && (
              <Line
                type="monotone"
                dataKey="totalBalance"
                stroke="var(--chart-header)"
                strokeWidth={3}
                dot={false}
                strokeDasharray="6 4"
                yAxisId="left"
              />
            )}
            {isVisible('investable') && (
              <Line
                type="monotone"
                dataKey="investable"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                yAxisId="left"
              />
            )}
            {isVisible('property') && (
              <Line
                type="monotone"
                dataKey="property"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="2 2"
                yAxisId="left"
              />
            )}
            {sortedAccounts.map(
              (account, index) =>
                isVisible(`account-${index}`) && (
                  <Line
                    key={account.id}
                    type="monotone"
                    dataKey={`account-${index}`}
                    stroke={'var(--chart-' + ((index + 1) % 5) + ')'}
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                  />
                ),
            )}
          </BreezeLineChart>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-6 rounded-sm"
                style={{ backgroundColor: 'var(--chart-header)' }}
              />
              <span>Total Portfolio</span>
            </div>
            {sortedAccounts.map((account, index) => (
              <div key={account.id} className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-6 rounded-sm"
                  style={{
                    backgroundColor: 'var(--chart-' + ((index + 1) % 5) + ')',
                  }}
                />
                <span style={{ color: 'var(--chart-' + ((index + 1) % 5) + ')' }}>
                  {account.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default ProjectionChartCard;
