'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxEstimate } from '@/lib/services/hooks/useTaxEstimate';

interface TaxResultsProps {
  estimate: TaxEstimate | null | undefined;
  isLoading?: boolean;
}

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatPercent = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(2)}%`;
};

export const TaxResults = ({ estimate, isLoading = false }: TaxResultsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Calculating your tax estimate...</div>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) {
    return null;
  }

  const results = [
    { label: 'Total Income', value: estimate.taxableIncome, type: 'currency' },
    { label: 'Tax Owed', value: estimate.taxOwed, type: 'currency' },
    { label: 'Effective Tax Rate', value: estimate.effectiveRate, type: 'percent' },
    { label: 'Marginal Tax Rate', value: estimate.marginalRate, type: 'percent' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {results.map((result) => (
        <Card key={result.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {result.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {result.type === 'currency'
                ? formatCurrency(result.value)
                : formatPercent(result.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
