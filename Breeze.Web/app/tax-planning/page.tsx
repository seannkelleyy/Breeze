'use client';

import { useState } from 'react';
import { useTaxEstimate, type CalculateTaxEstimateInput } from '@/lib/services/hooks/useTaxEstimate';
import { TaxForm, TaxFormInputs } from './components/TaxForm';
import { TaxResults } from './components/TaxResults';

const TaxPlanning = () => {
  const [formInputs, setFormInputs] = useState<CalculateTaxEstimateInput | null>(null);
  const { data: estimate, isPending, error } = useTaxEstimate(formInputs, !!formInputs);

  const handleCalculate = (inputs: TaxFormInputs) => {
    // Convert form inputs to API format (numbers to strings)
    setFormInputs({
      year: inputs.year,
      filingStatus: inputs.filingStatus,
      income: inputs.income.toString(),
      deduction: inputs.deductionAmount.toString(),
    });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pt-24 pb-12">
      <div>
        <h1 className="text-3xl font-bold">Tax Planning Calculator</h1>
        <p className="text-muted-foreground mt-1">
          Estimate your federal tax liability based on your income, filing status, and deductions.
        </p>
      </div>

      <TaxForm onCalculate={handleCalculate} isLoading={isPending} />

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <p className="font-semibold">Error calculating tax estimate</p>
          <p className="text-sm">{error?.message || 'Please check your inputs and try again.'}</p>
        </div>
      )}

      <TaxResults estimate={estimate} isLoading={isPending} />
    </div>
  );
};

export default TaxPlanning;
