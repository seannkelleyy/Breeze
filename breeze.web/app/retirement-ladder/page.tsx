'use client';

import { useState } from 'react';
import { useRetirementLadder } from '@/features/retirement-ladder/hooks/useRetirementLadder';
import {
  LadderForm,
  type LadderFormInputs,
} from '@/features/retirement-ladder/components/LadderForm';
import { LadderResults } from '@/features/retirement-ladder/components/LadderResults';

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

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Retirement Ladder Calculator</h1>
        <p className="text-muted-foreground mt-1">
          Project your retirement withdrawals and tax efficiency over time
        </p>
      </div>

      <LadderForm inputs={formInputs} onChange={handleInputChange} />

      <LadderResults data={ladderData} isPending={isPending} error={error} />
    </div>
  );
};

export default RetirementLadder;
