'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRetirementLadder } from '@/lib/services/hooks/useRetirementLadder';

interface LadderFormInputs {
  initialBalance: string;
  annualExpenses: string;
  currentAge: number;
  firstWithdrawalAge: number;
  yearsToProject: number;
  isRoth: boolean;
  filingStatus: string;
}

const RetirementLadder = () => {
  const currentYear = new Date().getFullYear();
  const [formInputs, setFormInputs] = useState<LadderFormInputs>({
    initialBalance: '500000',
    annualExpenses: '50000',
    currentAge: 35,
    firstWithdrawalAge: 60,
    yearsToProject: 40,
    isRoth: false,
    filingStatus: 'SINGLE',
  });

  const {
    data: ladderData,
    isPending,
    error,
  } = useRetirementLadder(
    formInputs.initialBalance &&
      formInputs.annualExpenses &&
      formInputs.currentAge &&
      formInputs.firstWithdrawalAge
      ? {
          initialBalance: formInputs.initialBalance,
          annualExpenses: formInputs.annualExpenses,
          currentAge: formInputs.currentAge,
          firstWithdrawalAge: formInputs.firstWithdrawalAge,
          isRoth: formInputs.isRoth,
          year: currentYear,
          filingStatus: formInputs.filingStatus,
          yearsToProject: formInputs.yearsToProject,
        }
      : null,
    !!formInputs.initialBalance,
  );

  const handleInputChange = (key: keyof LadderFormInputs, value: string | number | boolean) => {
    setFormInputs((prev) => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Determine sustainability
  const isSustainable = ladderData?.isSustainable || false;

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Retirement Ladder Calculator</h1>
        <p className="text-muted-foreground mt-1">
          Project your retirement withdrawals and tax efficiency over time
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Retirement Ladder Inputs</CardTitle>
          <CardDescription>Configure your retirement scenario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="initialBalance">Starting Balance</Label>
              <Input
                id="initialBalance"
                type="number"
                value={formInputs.initialBalance}
                onChange={(e) => handleInputChange('initialBalance', e.target.value)}
                placeholder="500000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualExpenses">Annual Expenses</Label>
              <Input
                id="annualExpenses"
                type="number"
                value={formInputs.annualExpenses}
                onChange={(e) => handleInputChange('annualExpenses', e.target.value)}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAge">Current Age</Label>
              <Input
                id="currentAge"
                type="number"
                value={formInputs.currentAge}
                onChange={(e) => handleInputChange('currentAge', parseInt(e.target.value))}
                placeholder="35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstWithdrawalAge">Retirement Age</Label>
              <Input
                id="firstWithdrawalAge"
                type="number"
                value={formInputs.firstWithdrawalAge}
                onChange={(e) => handleInputChange('firstWithdrawalAge', parseInt(e.target.value))}
                placeholder="60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsToProject">Years to Project</Label>
              <Input
                id="yearsToProject"
                type="number"
                value={formInputs.yearsToProject}
                onChange={(e) => handleInputChange('yearsToProject', parseInt(e.target.value))}
                placeholder="40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filingStatus">Filing Status</Label>
              <Select
                value={formInputs.filingStatus}
                onValueChange={(v) => handleInputChange('filingStatus', v)}
              >
                <SelectTrigger id="filingStatus">
                  <SelectValue placeholder="Select filing status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MFJ">Married Filing Jointly</SelectItem>
                  <SelectItem value="MFS">Married Filing Separately</SelectItem>
                  <SelectItem value="HOH">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formInputs.isRoth}
                onChange={(e) => handleInputChange('isRoth', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Use Roth Conversion Ladder</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {ladderData && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            className={isSustainable ? 'border-success/30 bg-success/10' : 'border-destructive/30 bg-destructive/10'}
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
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-bold text-success">Sustainable</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="font-bold text-destructive">
                      Depleted at age {ladderData.projectedDepletionAge}
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
              <div className="text-2xl font-bold">
                {ladderData.projectedSteps?.length || 0} years
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
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
      {ladderData && (
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
                  {(ladderData.projectedSteps || []).slice(0, 15).map((step, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/50 border-b">
                      <td className="p-2">{step.year}</td>
                      <td className="p-2 text-right">{step.age}</td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(step.withdrawalAmount)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(step.taxableWithdrawal)}
                      </td>
                      <td className="p-2 text-right font-mono text-destructive">
                        {formatCurrency(step.estimatedIncomeTax)}
                      </td>
                      <td className="p-2 text-right font-mono text-success">
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
              {(ladderData.projectedSteps?.length || 0) > 15 && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  Showing first 15 years... (Total: {ladderData.projectedSteps?.length} years)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RetirementLadder;
