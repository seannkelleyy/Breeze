'use client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RetirementLadderProjection } from '@/features/retirement-ladder/hooks/useRetirementLadder';

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export function LadderResults({
  data,
  isPending,
  error,
}: {
  data: RetirementLadderProjection | null | undefined;
  isPending: boolean;
  error: Error | null;
}) {
  const isSustainable = data?.isSustainable || false;

  return (
    <>
      {/* Results Summary */}
      {data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            className={
              isSustainable
                ? 'border-success/30 bg-success/10'
                : 'border-destructive/30 bg-destructive/10'
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Sustainability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {isSustainable ? (
                  <>
                    <CheckCircle2 className="text-success h-5 w-5" />
                    <span className="text-success font-bold">Sustainable</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-destructive h-5 w-5" />
                    <span className="text-destructive font-bold">
                      Depleted at age {data.projectedDepletionAge}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Years in Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.projectedSteps?.length || 0} years</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-4">
          <div className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>
              Failed to calculate ladder.{' '}
              {error?.message || 'Please check your inputs and try again.'}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isPending && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Calculating your retirement ladder...</p>
          </CardContent>
        </Card>
      )}

      {/* Ladder Table */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Year-by-Year Projection</CardTitle>
            <CardDescription>
              Shows your projected balance, withdrawals, and tax liability each year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-muted-foreground text-left">
                    <th className="p-2 font-medium">Year</th>
                    <th className="p-2 text-right font-medium">Age</th>
                    <th className="p-2 text-right font-medium">Withdrawal</th>
                    <th className="p-2 text-right font-medium">Taxable</th>
                    <th className="p-2 text-right font-medium">Tax</th>
                    <th className="p-2 text-right font-medium">Net</th>
                    <th className="p-2 text-right font-medium">Balance</th>
                    <th className="p-2 text-center font-medium">Accessible</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.projectedSteps || []).slice(0, 15).map((step, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/50 border-b">
                      <td className="p-2">{step.year}</td>
                      <td className="p-2 text-right">{step.age}</td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(step.withdrawalAmount)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(step.taxableWithdrawal)}
                      </td>
                      <td className="text-destructive p-2 text-right font-mono">
                        {formatCurrency(step.estimatedIncomeTax)}
                      </td>
                      <td className="text-success p-2 text-right font-mono">
                        {formatCurrency(step.netWithdrawal)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(step.remainingBalance)}
                      </td>
                      <td className="p-2 text-center">{step.isAccessible ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data.projectedSteps?.length || 0) > 15 && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  Showing first 15 years... (Total: {data.projectedSteps?.length} years)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
