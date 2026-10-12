'use client';

import { Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'recharts';
import {
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { RequireAuth } from '@/components/common/auth/RequireAuth';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import BreezeLineChart from '@/components/common/charts/BreezeLineChart';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_ASSETS_BY_USER } from '@/lib/services/queries/assets';
import {
  useRetirementAccess,
  useCreateHsaReceipt,
  useDeleteHsaReceipt,
  useCreateHsaReimbursement,
  useDeleteHsaReimbursement,
  useCreateRothConversion,
  useDeleteRothConversion,
  type HsaReceipt,
  type HsaReimbursement,
  type RothConversion,
  type RothConversionBucket,
} from '@/lib/services/hooks/useRetirementAccess';
import { formatCurrencyWithCode } from '@/lib/utils';

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Conversions move pre-tax retirement money into a Roth; nothing else is a
// legal from/to pair in this model.
const CONVERSION_FROM_TYPES = new Set(['TRADITIONAL_IRA', '_401K', '_403B', '_457']);
const CONVERSION_TO_TYPES = new Set(['ROTH_IRA']);

export default function RetirementAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <RequireAuth>
        <RetirementAccessContent />
      </RequireAuth>
    </Suspense>
  );
}

function RetirementAccessContent() {
  const { userId, currencyCode } = useCurrentUser();
  const { data: access, isLoading } = useRetirementAccess(userId);
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const num = (v: string) => {
    const parsed = Number(v);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  if (isLoading || !access) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-24 pb-12">
        <PageHeader
          icon={KeyRound}
          title="Retirement Access"
          subtitle="Money you can reach before 59½ — the HSA receipt ladder and Roth conversion clock."
        />
        <Card>
          <CardContent className="text-muted-foreground flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your access ladder…
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={KeyRound}
        title="Retirement Access"
        subtitle="Money you can reach before 59½ — the HSA receipt ladder and Roth conversion clock."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available to reimburse</CardDescription>
            <CardTitle className="text-success text-2xl">
              {fc(num(access.hsaSummary.availableToReimburse))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Saved receipts minus reimbursements already taken.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saved receipts</CardDescription>
            <CardTitle className="text-2xl">{fc(num(access.hsaSummary.totalReceipts))}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Qualified expenses you paid out of pocket.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reimbursed so far</CardDescription>
            <CardTitle className="text-2xl">{fc(num(access.hsaSummary.totalReimbursed))}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Tax-free withdrawals you have already taken.
          </CardContent>
        </Card>
      </div>

      <AccessTimelineCard
        buckets={access.rothBuckets}
        hsaAvailable={num(access.hsaSummary.availableToReimburse)}
        fc={fc}
      />

      <HsaLadderCard receipts={access.hsaReceipts} />
      <ReimbursementsCard reimbursements={access.hsaReimbursements} />
      <RothConversionsCard conversions={access.rothConversions} buckets={access.rothBuckets} />
    </div>
  );
}

const timelineChartConfig = {
  roth: { label: 'Penalty-free Roth principal', color: 'var(--chart-1)' },
  hsa: { label: 'HSA receipts (available now)', color: 'var(--chart-2)' },
} satisfies ChartConfig;

// When money becomes reachable: HSA receipt balance is spendable today, while
// converted Roth principal steps up each January 1 a bucket clears its
// five-year clock.
function AccessTimelineCard({
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

function HsaLadderCard({ receipts }: { receipts: HsaReceipt[] }) {
  const { currencyCode } = useCurrentUser();
  const { mutateAsync: createReceipt, isPending: isCreating } = useCreateHsaReceipt();
  const { mutateAsync: deleteReceipt, isPending: isDeleting } = useDeleteHsaReceipt();

  const [incurredOn, setIncurredOn] = useState(today());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HsaReceipt | null>(null);

  const byYear = useMemo(() => {
    const groups = new Map<number, HsaReceipt[]>();
    for (const receipt of receipts) {
      const year = Number(receipt.incurredOn.slice(0, 4));
      const list = groups.get(year) ?? [];
      list.push(receipt);
      groups.set(year, list);
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0]);
  }, [receipts]);

  const handleAdd = async () => {
    setError(null);
    if (!description.trim() || amount <= 0) {
      setError('Add a description and a positive amount.');
      return;
    }
    try {
      await createReceipt({ incurredOn, description: description.trim(), amount: String(amount) });
      setDescription('');
      setAmount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the receipt.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-4 w-4" /> HSA receipt ladder
        </CardTitle>
        <CardDescription>
          Pay medical costs out of pocket, log the receipts here, and reimburse yourself tax-free in
          any later year — even after retirement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[140px_1fr_160px_auto]">
          <div className="space-y-1">
            <Label>Incurred on</Label>
            <Input type="date" value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dental work, ER visit…"
            />
          </div>
          <div className="space-y-1">
            <Label>Amount</Label>
            <FormattedNumberInput value={amount} onValueChange={setAmount} maxFractionDigits={2} />
          </div>
          <Button onClick={() => void handleAdd()} disabled={isCreating}>
            <Plus className="mr-1 h-4 w-4" /> Add receipt
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {receipts.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No receipts saved yet — add your first out-of-pocket expense above.
          </p>
        ) : (
          <div className="space-y-4">
            {byYear.map(([year, yearReceipts]) => (
              <div key={year} className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {year}
                </p>
                {yearReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{receipt.description}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(receipt.incurredOn)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCurrencyWithCode(Number(receipt.amount), currencyCode)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete receipt ${receipt.description}`}
                        onClick={() => setPendingDelete(receipt)}
                      >
                        <Trash2 className="text-muted-foreground h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this receipt?"
        description={
          pendingDelete
            ? `"${pendingDelete.description}" (${formatCurrencyWithCode(Number(pendingDelete.amount), currencyCode)}) will be removed from your ladder.`
            : ''
        }
        onConfirm={() => {
          if (pendingDelete) void deleteReceipt(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
      {isDeleting && <span className="sr-only">Deleting…</span>}
    </Card>
  );
}

function ReimbursementsCard({ reimbursements }: { reimbursements: HsaReimbursement[] }) {
  const { currencyCode } = useCurrentUser();
  const { mutateAsync: createReimbursement, isPending: isCreating } = useCreateHsaReimbursement();
  const { mutateAsync: deleteReimbursement } = useDeleteHsaReimbursement();

  const [reimbursedOn, setReimbursedOn] = useState(today());
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    if (amount <= 0) {
      setError('Enter a positive amount.');
      return;
    }
    try {
      await createReimbursement({
        reimbursedOn,
        amount: String(amount),
        note: note.trim() || undefined,
      });
      setAmount(0);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the reimbursement.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-4 w-4" /> Reimburse yourself
        </CardTitle>
        <CardDescription>
          Withdraw against saved receipts — tax- and penalty-free at any age. The server rejects
          amounts above what your receipts cover.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[140px_160px_1fr_auto]">
          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={reimbursedOn}
              onChange={(e) => setReimbursedOn(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Amount</Label>
            <FormattedNumberInput value={amount} onValueChange={setAmount} maxFractionDigits={2} />
          </div>
          <div className="space-y-1">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="2024 receipts"
            />
          </div>
          <Button onClick={() => void handleAdd()} disabled={isCreating}>
            <Plus className="mr-1 h-4 w-4" /> Record
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {reimbursements.length > 0 && (
          <div className="space-y-1">
            {reimbursements
              .slice()
              .reverse()
              .map((reimbursement) => (
                <div
                  key={reimbursement.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatCurrencyWithCode(Number(reimbursement.amount), currencyCode)} ·{' '}
                      {formatDate(reimbursement.reimbursedOn)}
                    </p>
                    {reimbursement.note && (
                      <p className="text-muted-foreground truncate text-xs">{reimbursement.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete reimbursement"
                    onClick={() => void deleteReimbursement(reimbursement.id)}
                  >
                    <Trash2 className="text-muted-foreground h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RothConversionsCard({
  conversions,
  buckets,
}: {
  conversions: RothConversion[];
  buckets: RothConversionBucket[];
}) {
  const { userId, currencyCode } = useCurrentUser();
  const { request } = useGraphql();
  const { mutateAsync: createConversion, isPending: isCreating } = useCreateRothConversion();
  const { mutateAsync: deleteConversion } = useDeleteRothConversion();

  const { data: assets } = useQuery({
    queryKey: ['retirement-access-accounts', userId],
    queryFn: async () => {
      const resp = await request<{
        assets: Array<{ id: string; name: string; assetType: string }>;
      }>(GET_ASSETS_BY_USER, { userId });
      return resp.assets ?? [];
    },
    enabled: !!userId,
  });

  const fromAccounts = (assets ?? []).filter((a) => CONVERSION_FROM_TYPES.has(a.assetType));
  const toAccounts = (assets ?? []).filter((a) => CONVERSION_TO_TYPES.has(a.assetType));

  const [convertedOn, setConvertedOn] = useState(today());
  const [amount, setAmount] = useState(0);
  const [fromAssetId, setFromAssetId] = useState('');
  const [toAssetId, setToAssetId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    if (amount <= 0) {
      setError('Enter a positive amount.');
      return;
    }
    try {
      await createConversion({
        convertedOn,
        amount: String(amount),
        fromAssetId: fromAssetId || undefined,
        toAssetId: toAssetId || undefined,
        note: note.trim() || undefined,
      });
      setAmount(0);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the conversion.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" /> Roth conversion ladder
        </CardTitle>
        <CardDescription>
          Track Traditional → Roth conversions. Converted principal becomes penalty-free on January
          1 of the year five years after conversion (earnings still follow the usual age-59½ rules).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {buckets.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {buckets.map((bucket) => (
              <div key={bucket.year} className="rounded-md border px-3 py-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{bucket.year} conversions</span>
                  {bucket.accessible ? (
                    <CheckCircle2 className="text-success h-4 w-4" />
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      locked until {bucket.availableOn.slice(0, 4)}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatCurrencyWithCode(Number(bucket.amount), currencyCode)} ·{' '}
                  {bucket.accessible
                    ? `accessible since ${formatDate(bucket.availableOn)}`
                    : `available ${formatDate(bucket.availableOn)}`}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[140px_160px_1fr_1fr_1fr_auto]">
          <div className="space-y-1">
            <Label>Converted on</Label>
            <Input
              type="date"
              value={convertedOn}
              onChange={(e) => setConvertedOn(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Amount</Label>
            <FormattedNumberInput value={amount} onValueChange={setAmount} maxFractionDigits={2} />
          </div>
          <div className="space-y-1">
            <Label>From (pre-tax)</Label>
            <select
              value={fromAssetId}
              onChange={(e) => setFromAssetId(e.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
            >
              <option value="">—</option>
              {fromAccounts.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>To Roth</Label>
            <select
              value={toAssetId}
              onChange={(e) => setToAssetId(e.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
            >
              <option value="">—</option>
              {toAccounts.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={() => void handleAdd()} disabled={isCreating}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {fromAccounts.length === 0 && toAccounts.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No eligible accounts yet — conversions need a pre-tax source (Traditional IRA or
            401(k)/403(b)/457) and a Roth IRA destination. Add them on the Accounts page.
          </p>
        )}

        {conversions.length > 0 && (
          <div className="space-y-1">
            {conversions
              .slice()
              .reverse()
              .map((conversion) => (
                <div
                  key={conversion.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatCurrencyWithCode(Number(conversion.amount), currencyCode)} ·{' '}
                      {formatDate(conversion.convertedOn)}
                    </p>
                    {conversion.note && (
                      <p className="text-muted-foreground truncate text-xs">{conversion.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete conversion"
                    onClick={() => void deleteConversion(conversion.id)}
                  >
                    <Trash2 className="text-muted-foreground h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
