'use client';
import { useMemo, useState } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import {
  useCreateHsaReceipt,
  useDeleteHsaReceipt,
  type HsaReceipt,
} from '@/features/retirement-access/hooks/useRetirementAccess';
import { formatCurrencyWithCode } from '@/lib/utils';
import { formatDate, today } from '@/features/retirement-access/lib/dates';

export function HsaLadderCard({ receipts }: { receipts: HsaReceipt[] }) {
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
