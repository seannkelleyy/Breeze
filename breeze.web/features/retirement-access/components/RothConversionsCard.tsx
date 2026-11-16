'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_ASSETS_BY_USER } from '@/features/assets/asset.operations';
import {
  useCreateRothConversion,
  useDeleteRothConversion,
  type RothConversion,
  type RothConversionBucket,
} from '@/features/retirement-access/hooks/useRetirementAccess';
import { formatCurrencyWithCode } from '@/lib/utils';
import { formatDate, today } from '@/features/retirement-access/lib/dates';

// Conversions move pre-tax retirement money into a Roth; nothing else is a
// legal from/to pair in this model.
const CONVERSION_FROM_TYPES = new Set(['TRADITIONAL_IRA', '_401K', '_403B', '_457']);
const CONVERSION_TO_TYPES = new Set(['ROTH_IRA']);

export function RothConversionsCard({
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
      const resp = await request(GET_ASSETS_BY_USER, { userId });
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
