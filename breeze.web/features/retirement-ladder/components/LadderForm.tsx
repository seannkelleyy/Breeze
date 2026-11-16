'use client';
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
import type { FilingStatus } from '@/lib/gql/graphql';

export interface LadderFormInputs {
  initialBalance: string;
  annualExpenses: string;
  currentAge: number;
  firstWithdrawalAge: number;
  yearsToProject: number;
  isRoth: boolean;
  filingStatus: FilingStatus;
}

export function LadderForm({
  inputs,
  onChange,
}: {
  inputs: LadderFormInputs;
  onChange: (key: keyof LadderFormInputs, value: string | number | boolean) => void;
}) {
  return (
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
              value={inputs.initialBalance}
              onChange={(e) => onChange('initialBalance', e.target.value)}
              placeholder="500000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualExpenses">Annual Expenses</Label>
            <Input
              id="annualExpenses"
              type="number"
              value={inputs.annualExpenses}
              onChange={(e) => onChange('annualExpenses', e.target.value)}
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentAge">Current Age</Label>
            <Input
              id="currentAge"
              type="number"
              value={inputs.currentAge}
              onChange={(e) => onChange('currentAge', parseInt(e.target.value))}
              placeholder="35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstWithdrawalAge">Retirement Age</Label>
            <Input
              id="firstWithdrawalAge"
              type="number"
              value={inputs.firstWithdrawalAge}
              onChange={(e) => onChange('firstWithdrawalAge', parseInt(e.target.value))}
              placeholder="60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsToProject">Years to Project</Label>
            <Input
              id="yearsToProject"
              type="number"
              value={inputs.yearsToProject}
              onChange={(e) => onChange('yearsToProject', parseInt(e.target.value))}
              placeholder="40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filingStatus">Filing Status</Label>
            <Select value={inputs.filingStatus} onValueChange={(v) => onChange('filingStatus', v)}>
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
              checked={inputs.isRoth}
              onChange={(e) => onChange('isRoth', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Use Roth Conversion Ladder</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
