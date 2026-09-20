'use client';
import { useMemo, useState } from 'react';
import { PieChart, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Line } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BreezeLineChart from '@/components/common/charts/BreezeLineChart';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { useNetWorthSnapshots } from '@/lib/services/hooks/useNetWorthSnapshots';
import { cn } from '@/lib/utils';

export interface NetWorthAccountOption {
  name: string;
  value: number;
  kind: 'ASSET' | 'LIABILITY';
}

interface NetWorthHistoryCardProps {
  userId?: string | null;
  currencyCode: string;
  /** Current accounts, used to prefill a breakdown snapshot. */
  accounts: NetWorthAccountOption[];
}

const chartConfig = {
  netWorth: { label: 'Net Worth', color: 'var(--chart-header)' },
} satisfies ChartConfig;

/**
 * Net worth history: user-captured snapshots (total-only or full breakdown)
 charted over time, per the roadmap dashboard item.
 */
export function NetWorthHistoryCard({
  userId,
  currencyCode,
  accounts,
}: NetWorthHistoryCardProps) {
  const fc = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(v);
  const { snapshots, isLoading, createSnapshot, deleteSnapshot } = useNetWorthSnapshots(userId);

  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        date: s.snapshotDate.slice(0, 10),
        netWorth: s.netWorth,
      })),
    [snapshots],
  );

  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const delta = latest && previous ? latest.netWorth - previous.netWorth : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-muted-foreground h-4 w-4" />
          <div>
            <CardTitle className="text-sm font-medium">Net Worth History</CardTitle>
            <CardDescription className="text-xs">
              {latest
                ? `${fc(latest.netWorth)} as of ${latest.snapshotDate.slice(0, 10)}${
                    delta !== null
                      ? ` · ${delta >= 0 ? '+' : '−'}${fc(Math.abs(delta))} since last snapshot`
                      : ''
                  }`
                : 'Capture a snapshot to start tracking net worth over time.'}
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-4" /> Snapshot
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground py-6 text-center text-sm">Loading...</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed py-8 text-center text-sm">
            No snapshots yet — add one now, or come back after big changes to watch the trend.
          </p>
        ) : (
          <BreezeLineChart
            config={chartConfig}
            className="h-[240px] w-full"
            data={chartData}
            xAxisDataKey="date"
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            leftAxis={{
              dataKey: 'netWorth',
              yAxisId: 'left',
              tickFormatter: (value: number) => {
                if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return `${value}`;
              },
            }}
            tooltipFormatter={(value: number) => fc(value)}
          >
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="var(--color-netWorth)"
              strokeWidth={2}
              dot
              yAxisId="left"
            />
          </BreezeLineChart>
        )}
        {snapshots.length > 0 && (
          <div className="mt-3 space-y-1">
            {snapshots
              .slice()
              .reverse()
              .slice(0, 3)
              .map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.snapshotDate.slice(0, 10)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fc(s.netWorth)}</span>
                    <span className="text-muted-foreground">
                      ({s.items.length > 0 ? `${s.items.length} accounts` : 'totals only'})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive size-6 cursor-pointer"
                      onClick={() => setDeletingId(s.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>

      {showAdd && (
        <AddSnapshotDialog
          accounts={accounts}
          currencyCode={currencyCode}
          saving={createSnapshot.isPending}
          onClose={() => setShowAdd(false)}
          onSave={async (input) => {
            await createSnapshot.mutateAsync(input);
            setShowAdd(false);
          }}
        />
      )}

      <ConfirmDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Snapshot"
        description="Remove this snapshot from your net worth history?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingId) deleteSnapshot.mutate(deletingId);
          setDeletingId(null);
        }}
      />
    </Card>
  );
}

interface DraftItem {
  label: string;
  amount: number;
  kind: 'ASSET' | 'LIABILITY';
}

function AddSnapshotDialog({
  accounts,
  currencyCode,
  saving,
  onClose,
  onSave,
}: {
  accounts: NetWorthAccountOption[];
  currencyCode: string;
  saving: boolean;
  onClose: () => void;
  onSave: (input: {
    snapshotDate: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    items?: { label: string; amount: number; kind: 'ASSET' | 'LIABILITY' }[];
  }) => Promise<void>;
}) {
  const fc = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(v);
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<'totals' | 'breakdown'>(
    accounts.length > 0 ? 'breakdown' : 'totals',
  );

  const initialItems: DraftItem[] = useMemo(
    () =>
      accounts.map((a) => ({
        label: a.name || 'Unnamed',
        amount: Math.max(0, a.value),
        kind: a.kind,
      })),
    [accounts],
  );
  const [items, setItems] = useState<DraftItem[]>(initialItems);
  const [totalAssets, setTotalAssets] = useState(() =>
    Math.max(0, accounts.filter((a) => a.kind === 'ASSET').reduce((s, a) => s + a.value, 0)),
  );
  const [totalLiabilities, setTotalLiabilities] = useState(() =>
    Math.max(0, accounts.filter((a) => a.kind === 'LIABILITY').reduce((s, a) => s + a.value, 0)),
  );

  const itemsAssets = items.filter((i) => i.kind === 'ASSET').reduce((s, i) => s + i.amount, 0);
  const itemsLiabilities = items
    .filter((i) => i.kind === 'LIABILITY')
    .reduce((s, i) => s + i.amount, 0);
  const shownAssets = mode === 'breakdown' ? itemsAssets : totalAssets;
  const shownLiabilities = mode === 'breakdown' ? itemsLiabilities : totalLiabilities;
  const netWorth = shownAssets - shownLiabilities;

  const updateItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Net Worth Snapshot</DialogTitle>
          <DialogDescription>
            Capture today&apos;s totals only, or include the per-account breakdown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Snapshot Date</Label>
              <Input
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
              />
            </div>
            <div className="flex gap-1 pb-0.5">
              <Button
                type="button"
                size="sm"
                variant={mode === 'breakdown' ? 'default' : 'outline'}
                onClick={() => setMode('breakdown')}
                disabled={accounts.length === 0}
              >
                <PieChart className="size-3.5" /> By account
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === 'totals' ? 'default' : 'outline'}
                onClick={() => setMode('totals')}
              >
                Totals only
              </Button>
            </div>
          </div>

          {mode === 'breakdown' ? (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={`${item.label}-${i}`} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-16 shrink-0 text-[10px] font-medium',
                      item.kind === 'ASSET' ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {item.kind === 'ASSET' ? 'Asset' : 'Debt'}
                  </span>
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(i, { label: e.target.value })}
                    className="h-8 flex-1 text-sm"
                  />
                  <FormattedNumberInput
                    value={item.amount}
                    onValueChange={(v) => updateItem(i, { amount: v })}
                    maxFractionDigits={2}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Total Assets</Label>
                <FormattedNumberInput
                  value={totalAssets}
                  onValueChange={setTotalAssets}
                  maxFractionDigits={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total Liabilities</Label>
                <FormattedNumberInput
                  value={totalLiabilities}
                  onValueChange={setTotalLiabilities}
                  maxFractionDigits={2}
                />
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-md px-3 py-2 text-xs">
            Assets {fc(shownAssets)} − Liabilities {fc(shownLiabilities)} ={' '}
            <span className="text-success font-semibold">Net worth {fc(netWorth)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onSave({
                snapshotDate,
                totalAssets: shownAssets,
                totalLiabilities: shownLiabilities,
                netWorth,
                items:
                  mode === 'breakdown'
                    ? items.map((i) => ({ label: i.label, amount: i.amount, kind: i.kind }))
                    : undefined,
              })
            }
          >
            {saving ? 'Saving...' : 'Save Snapshot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NetWorthHistoryCard;
