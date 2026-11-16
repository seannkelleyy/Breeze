'use client';
import { useState } from 'react';
import { Banknote, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import {
  useCreateHsaReimbursement,
  useDeleteHsaReimbursement,
  type HsaReimbursement,
} from '@/features/retirement-access/hooks/useRetirementAccess';
import { formatCurrencyWithCode } from '@/lib/utils';
import { formatDate, today } from '@/features/retirement-access/lib/dates';

export function ReimbursementsCard({ reimbursements }: { reimbursements: HsaReimbursement[] }) {
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
