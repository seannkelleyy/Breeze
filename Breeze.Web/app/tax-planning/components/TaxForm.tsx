'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TaxFormInputs {
  year: number;
  filingStatus: string;
  income: number;
  deductionType: 'STANDARD' | 'ITEMIZED';
  deductionAmount: number;
}

interface TaxFormProps {
  onCalculate: (inputs: TaxFormInputs) => void;
  isLoading?: boolean;
}

const FILING_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MFJ', label: 'Married Filing Jointly' },
  { value: 'MFS', label: 'Married Filing Separately' },
  { value: 'HOH', label: 'Head of Household' },
];

export const TaxForm = ({ onCalculate, isLoading = false }: TaxFormProps) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [filingStatus, setFilingStatus] = useState('SINGLE');
  const [income, setIncome] = useState(100000);
  const [deductionType, setDeductionType] = useState<'STANDARD' | 'ITEMIZED'>('STANDARD');
  const [deductionAmount, setDeductionAmount] = useState(13850);

  const handleCalculate = () => {
    if (!year || !filingStatus || income < 0) {
      return;
    }
    onCalculate({
      year,
      filingStatus,
      income,
      deductionType,
      deductionAmount: deductionType === 'ITEMIZED' ? deductionAmount : 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Calculator</CardTitle>
        <CardDescription>Enter your income and deduction details to estimate your tax liability.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="year">Tax Year</Label>
            <FormattedNumberInput
              id="year"
              value={year}
              onValueChange={setYear}
              min={2000}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filingStatus">Filing Status</Label>
            <Select value={filingStatus} onValueChange={setFilingStatus}>
              <SelectTrigger id="filingStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILING_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="income">Total Income</Label>
            <FormattedNumberInput
              id="income"
              value={income}
              onValueChange={setIncome}
              min={0}
              maxFractionDigits={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deductionType">Deduction Type</Label>
            <Select
              value={deductionType}
              onValueChange={(val) => setDeductionType(val as 'STANDARD' | 'ITEMIZED')}
            >
              <SelectTrigger id="deductionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="ITEMIZED">Itemized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {deductionType === 'ITEMIZED' && (
          <div className="space-y-2">
            <Label htmlFor="deductionAmount">Itemized Deduction Amount</Label>
            <FormattedNumberInput
              id="deductionAmount"
              value={deductionAmount}
              onValueChange={setDeductionAmount}
              min={0}
              maxFractionDigits={0}
            />
          </div>
        )}

        <Button onClick={handleCalculate} disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? 'Calculating...' : 'Calculate Tax'}
        </Button>
      </CardContent>
    </Card>
  );
};
