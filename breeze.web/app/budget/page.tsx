'use client';

import { Suspense, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import Link from 'next/link';
import { MoveLeft, MoveRight, RefreshCw, Loader2, Receipt } from 'lucide-react';

import { useBudgetContext } from './providers/index';
import { useRegenerateBudget } from './hooks/budget/index';
import { Button } from '@/components/ui/button';
import {
  CategoriesTable,
  CreateExpenseDialog,
  CreateIncomeDialog,
  ExpensesTable,
  IncomeTable,
} from './components/index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isMoneyGreaterThanOrEqualWithTolerance } from '../future/lib/constants';
import { getMonthPayrollIncomes } from '../future/lib/paycheck';
import { usePlannerHydration } from '../future/hooks/usePlannerHydration';
import { usePlannerState } from '../future/providers/PlannerStateProvider';
import { usePaycheckDeductions } from '../future/hooks/planner/usePaycheckDeductions';
import useTaxYear from '../future/hooks/planner/useTaxYear';
import { useTabParam } from '@/lib/hooks/useTabParam';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { formatCurrencyWithCode } from '@/lib/utils';

const BUDGET_TABS = ['categories', 'expenses', 'income'] as const;

export default function BudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        </div>
      }
    >
      <BudgetContent />
    </Suspense>
  );
}

const BudgetContent = () => {
  const { budget, getBudgetForDate, refetchBudget, refetchIncomes, refetchCategories } =
    useBudgetContext();
  const { regenerateBudgetMonth } = useRegenerateBudget();
  const { filingStatus, deductionType, currencyCode } = useCurrentUser();

  // Paycheck income comes from the planner: people + accounts + withholdings
  // feed the per-person waterfall that generates this month's payday incomes.
  usePlannerHydration();
  const { plannerPeople, plannerAccounts } = usePlannerState();
  const { deductions: allWithholdings } = usePaycheckDeductions(null);
  const taxTables = useTaxYear(filingStatus);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateMessage, setRegenerateMessage] = useState('');
  const [activeTab, setActiveTab] = useTabParam('expenses', BUDGET_TABS);

  useEffect(() => {
    getBudgetForDate(currentYear, currentMonth);
    setRegenerateMessage('');
    setConfirmRegenerate(false);
  }, [currentMonth, currentYear, getBudgetForDate]);

  const getNextBudget = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getPreviousBudget = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const isBudgetDifferencePositive = isMoneyGreaterThanOrEqualWithTolerance(
    Number(budget?.monthlyIncome ?? 0) - Number(budget?.monthlyExpenses ?? 0),
    0,
  );

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenerateMessage('');
    try {
      const payrollIncomes = getMonthPayrollIncomes(
        plannerPeople,
        plannerAccounts,
        allWithholdings,
        taxTables,
        deductionType,
        currentYear,
        currentMonth + 1,
      );
      await regenerateBudgetMonth(currentYear, currentMonth + 1, payrollIncomes);
      await Promise.all([refetchBudget(), refetchIncomes(), refetchCategories()]);
      setRegenerateMessage(
        `Income and recurring templates regenerated for ${dayjs(new Date(currentYear, currentMonth)).format('MMMM YYYY')}.`,
      );
    } catch {
      setRegenerateMessage('Failed to regenerate recurring templates. Please try again.');
    } finally {
      setRegenerating(false);
      setConfirmRegenerate(false);
    }
  };

  return (
    <div className="m-auto flex max-w-xl flex-col items-center justify-start gap-1 overflow-x-hidden rounded-[.5rem] py-4 pt-[10vh] text-center">
      <div className="mb-4 flex gap-4">
        <Button onClick={getPreviousBudget} title="Previous Month">
          <MoveLeft />
        </Button>
        <h1 className="text-3xl font-bold">
          {dayjs(new Date(currentYear, currentMonth)).format('MMMM YYYY')}
        </h1>
        <Button onClick={getNextBudget} title="Next Month">
          <MoveRight />
        </Button>
      </div>
      <h2 className="text-lg">
        Income:{' '}
        <span className="text-accent font-bold">
          {budget
            ? formatCurrencyWithCode(Number(budget.monthlyIncome), currencyCode)
            : 'Loading...'}
        </span>
      </h2>
      <h2 className="text-lg">
        Expenses:{' '}
        <span className="text-accent font-bold">
          {budget
            ? formatCurrencyWithCode(Number(budget.monthlyExpenses), currencyCode)
            : 'Loading...'}
        </span>
      </h2>
      <h2 className="text-lg">
        Difference:{' '}
        <span
          className={
            isBudgetDifferencePositive
              ? 'bg-success rounded-sm p-1'
              : 'bg-destructive rounded-sm p-1'
          }
        >
          {budget
            ? formatCurrencyWithCode(
                Number(budget.monthlyIncome ?? 0) - Number(budget.monthlyExpenses ?? 0),
                currencyCode,
              )
            : 'Loading...'}
        </span>
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <CreateIncomeDialog />
        <CreateExpenseDialog />
        <Link href="/expenses">
          <Button variant="outline" className="gap-2">
            <Receipt className="h-4 w-4" />
            Monthly Expenses
          </Button>
        </Link>
      </div>
      {confirmRegenerate ? (
        <div className="border-warning/30 bg-warning/10 flex w-full flex-col items-center gap-3 rounded-lg border px-4 py-3 text-sm sm:flex-row">
          <span className="text-warning flex-1">
            This will delete and re-generate all template-sourced rows for{' '}
            <strong>{dayjs(new Date(currentYear, currentMonth)).format('MMMM YYYY')}</strong>.
            Continue?
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={regenerating}
              onClick={() => void handleRegenerate()}
            >
              {regenerating ? 'Regenerating...' : 'Confirm'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={regenerating}
              onClick={() => setConfirmRegenerate(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1"
          onClick={() => setConfirmRegenerate(true)}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate Month
        </Button>
      )}
      {regenerateMessage ? (
        <div
          className={`w-full rounded-md border px-3 py-2 text-sm ${regenerateMessage.startsWith('Failed') ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-success/30 bg-success/10 text-success'}`}
        >
          {regenerateMessage}
        </div>
      ) : null}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="m-4 flex flex-col items-center justify-center"
      >
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Incomes</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <CategoriesTable />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTable />
        </TabsContent>
        <TabsContent value="income">
          <IncomeTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};
