'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ReactNode, useMemo, useState } from 'react';
import AmortizationTab from './tabs/AmortizationTab';
import LoanCompareTab from './tabs/LoanCompareTab';
import RefinanceTab from './tabs/RefinanceTab';

interface HomeLoanContext {
  accountName: string;
  currentBalance: number;
  originalLoanAmount?: number;
  interestRate: number;
  monthlyPayment: number;
  remainingMonths: number;
  currentHomeValue: number;
  homeAnnualGrowthRate: number;
}

interface PlannerToolsCardProps {
  collapsed: boolean;
  toggleControl: ReactNode;
  formatCurrency: (value: number) => string;
  homeLoan: HomeLoanContext | null;
}

interface AmortizationRow {
  period: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface LoanSummary {
  monthlyPayment: number;
  totalInterest: number;
  monthsToPayoff: number;
  payoffDate: Date | null;
  rows: AmortizationRow[];
  isNegativeAmortization: boolean;
}

type RatioChartDisplayMode = 'share' | 'amount' | 'both';

const monthDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const calculateMonthlyPayment = (
  principal: number,
  annualRatePercent: number,
  termMonths: number,
) => {
  const normalizedPrincipal = clamp(principal);
  const normalizedTermMonths = Math.max(1, Math.floor(termMonths));
  const monthlyRate = clamp(annualRatePercent, -99) / 100 / 12;

  if (monthlyRate === 0) {
    return normalizedPrincipal / normalizedTermMonths;
  }

  const denominator = 1 - (1 + monthlyRate) ** -normalizedTermMonths;
  if (denominator === 0) {
    return 0;
  }

  return (normalizedPrincipal * monthlyRate) / denominator;
};

const buildAmortization = (
  principal: number,
  annualRatePercent: number,
  monthlyPayment: number,
  startDate: Date,
  oneTimeExtra = 0,
  recurringExtra = 0,
  maxMonths = 720,
): LoanSummary => {
  const rows: AmortizationRow[] = [];
  let balance = clamp(principal);
  let totalInterest = 0;
  const monthlyRate = clamp(annualRatePercent, -99) / 100 / 12;
  const normalizedMonthlyPayment = clamp(monthlyPayment);
  const normalizedOneTimeExtra = clamp(oneTimeExtra);
  const normalizedRecurringExtra = clamp(recurringExtra);
  let isNegativeAmortization = false;

  for (let month = 1; month <= maxMonths && balance > 0.000001; month++) {
    const interest = balance * monthlyRate;
    let principalPayment = normalizedMonthlyPayment - interest;
    if (month === 1) {
      principalPayment += normalizedOneTimeExtra;
    }
    principalPayment += normalizedRecurringExtra;

    if (principalPayment <= 0) {
      isNegativeAmortization = true;
      break;
    }

    if (principalPayment > balance) {
      principalPayment = balance;
    }

    const payment = interest + principalPayment;
    balance -= principalPayment;
    totalInterest += interest;

    const rowDate = addMonths(startDate, month - 1);
    rows.push({
      period: month,
      date: monthDateFormatter.format(rowDate),
      payment,
      principal: principalPayment,
      interest,
      balance: Math.max(0, balance),
    });
  }

  const monthsToPayoff = rows.length;
  const payoffDate = monthsToPayoff > 0 ? addMonths(startDate, monthsToPayoff - 1) : null;

  return {
    monthlyPayment: normalizedMonthlyPayment,
    totalInterest,
    monthsToPayoff,
    payoffDate,
    rows,
    isNegativeAmortization,
  };
};

const amortizationChartConfig = {
  balance: {
    label: 'Remaining Balance',
    color: 'hsl(var(--chart-1))',
  },
  acceleratedBalance: {
    label: 'Accelerated Balance',
    color: 'hsl(var(--chart-1))',
  },
  cumulativeInterest: {
    label: 'Total Interest Paid',
    color: 'hsl(var(--chart-4))',
  },
  acceleratedCumulativeInterest: {
    label: 'Accelerated Total Interest',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

const amortizationRatioChartConfig = {
  principalSharePercent: {
    label: 'Principal Share %',
    color: 'hsl(var(--chart-2))',
  },
  interestSharePercent: {
    label: 'Interest Share %',
    color: 'hsl(var(--chart-3))',
  },
  principalAmount: {
    label: 'Principal Amount',
    color: 'hsl(var(--chart-2))',
  },
  interestAmount: {
    label: 'Interest Amount',
    color: 'hsl(var(--chart-3))',
  },
  acceleratedPrincipalAmount: {
    label: 'Accelerated Principal Amount',
    color: 'hsl(var(--chart-2))',
  },
  acceleratedInterestAmount: {
    label: 'Accelerated Interest Amount',
    color: 'hsl(var(--chart-3))',
  },
  acceleratedPrincipalSharePercent: {
    label: 'Accelerated Principal Share %',
    color: 'hsl(var(--chart-2))',
  },
  acceleratedInterestSharePercent: {
    label: 'Accelerated Interest Share %',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export const PlannerToolsCard = ({
  collapsed,
  toggleControl,
  formatCurrency,
  homeLoan,
}: PlannerToolsCardProps) => {
  const [selectedTool, setSelectedTool] = useState('loan-compare');
  const [refiRate, setRefiRate] = useState(0);
  const [refiTermYears, setRefiTermYears] = useState(0);
  const [refiClosingCosts, setRefiClosingCosts] = useState(4500);
  const [refiCashOut, setRefiCashOut] = useState(0);
  const [refiDiscountRate, setRefiDiscountRate] = useState(5);
  const [extraMonthly, setExtraMonthly] = useState(200);
  const [extraOneTime, setExtraOneTime] = useState(0);
  const [ratioChartDisplayMode, setRatioChartDisplayMode] = useState<RatioChartDisplayMode>('both');
  const effectiveRefiRate = refiRate > 0 ? refiRate : (homeLoan?.interestRate ?? 0);
  const effectiveRefiTermYears =
    refiTermYears > 0
      ? refiTermYears
      : Math.max(1, Math.round((homeLoan?.remainingMonths ?? 12) / 12));

  const baseLoanSummary = useMemo(() => {
    if (!homeLoan) {
      return null;
    }

    return buildAmortization(
      homeLoan.currentBalance,
      homeLoan.interestRate,
      homeLoan.monthlyPayment,
      new Date(),
    );
  }, [homeLoan]);

  const amortizationChartData = useMemo(() => {
    if (!baseLoanSummary) {
      return [];
    }

    const cumulativeInterestByPeriod = new Map<number, number>();
    let runningInterest = 0;
    for (const row of baseLoanSummary.rows) {
      runningInterest += row.interest;
      cumulativeInterestByPeriod.set(row.period, runningInterest);
    }

    const maxPoints = 120;
    const stride = Math.max(1, Math.ceil(baseLoanSummary.rows.length / maxPoints));
    const reducedRows = baseLoanSummary.rows.filter((_, index) => index % stride === 0);
    const lastRow = baseLoanSummary.rows[baseLoanSummary.rows.length - 1];
    const reducedLastRow = reducedRows[reducedRows.length - 1];
    if (lastRow && reducedLastRow?.period !== lastRow.period) {
      reducedRows.push(lastRow);
    }

    return reducedRows.map((row) => {
      const paymentTotal = row.principal + row.interest;
      const principalSharePercent = paymentTotal > 0 ? (row.principal / paymentTotal) * 100 : 0;
      const interestSharePercent = paymentTotal > 0 ? (row.interest / paymentTotal) * 100 : 0;

      return {
        period: row.period,
        date: row.date,
        balance: row.balance,
        principal: row.principal,
        interest: row.interest,
        principalAmount: row.principal,
        interestAmount: row.interest,
        cumulativeInterest: cumulativeInterestByPeriod.get(row.period) ?? 0,
        principalSharePercent,
        interestSharePercent,
      };
    });
  }, [baseLoanSummary]);

  const compareTerms = useMemo(() => {
    if (!homeLoan) {
      return [];
    }

    const options = [15, 20, 30];
    return options.map((termYears) => {
      const payment = calculateMonthlyPayment(
        homeLoan.currentBalance,
        homeLoan.interestRate,
        termYears * 12,
      );
      const summary = buildAmortization(
        homeLoan.currentBalance,
        homeLoan.interestRate,
        payment,
        new Date(),
      );
      return {
        termYears,
        monthlyPayment: payment,
        totalInterest: summary.totalInterest,
        monthsToPayoff: summary.monthsToPayoff,
        payoffDate: summary.payoffDate,
      };
    });
  }, [homeLoan]);

  const loanPaidDownPercent = useMemo(() => {
    if (!homeLoan || !homeLoan.originalLoanAmount || homeLoan.originalLoanAmount <= 0) {
      return null;
    }

    const paidDown = Math.max(0, homeLoan.originalLoanAmount - homeLoan.currentBalance);
    return (paidDown / homeLoan.originalLoanAmount) * 100;
  }, [homeLoan]);

  const refinanceSummary = useMemo(() => {
    if (!homeLoan || !baseLoanSummary) {
      return null;
    }

    const refinancePrincipal =
      homeLoan.currentBalance + clamp(refiClosingCosts) + clamp(refiCashOut);
    const refinancePayment = calculateMonthlyPayment(
      refinancePrincipal,
      effectiveRefiRate,
      Math.max(1, effectiveRefiTermYears) * 12,
    );
    const refinanceLoanSummary = buildAmortization(
      refinancePrincipal,
      effectiveRefiRate,
      refinancePayment,
      new Date(),
    );
    const monthlySavings = homeLoan.monthlyPayment - refinancePayment;
    const interestSavings = baseLoanSummary.totalInterest - refinanceLoanSummary.totalInterest;
    const breakEvenMonths =
      monthlySavings > 0 ? Math.ceil(clamp(refiClosingCosts) / monthlySavings) : null;
    const monthlyDiscountRate = clamp(refiDiscountRate, 0) / 100 / 12;

    const oldLoanMonths = baseLoanSummary.rows.length;
    const newLoanMonths = refinanceLoanSummary.rows.length;
    const comparisonMonths = Math.max(oldLoanMonths, newLoanMonths);
    const oldPaymentsByMonth = baseLoanSummary.rows.map((row) => row.payment);
    const newPaymentsByMonth = refinanceLoanSummary.rows.map((row) => row.payment);
    const upfrontNetCashFlow = clamp(refiCashOut) - clamp(refiClosingCosts);

    let npv = upfrontNetCashFlow;
    let nominalCashFlowDelta = upfrontNetCashFlow;

    for (let monthIndex = 0; monthIndex < comparisonMonths; monthIndex++) {
      const oldPayment = oldPaymentsByMonth[monthIndex] ?? 0;
      const newPayment = newPaymentsByMonth[monthIndex] ?? 0;
      const delta = oldPayment - newPayment;
      nominalCashFlowDelta += delta;

      const discountFactor =
        monthlyDiscountRate > 0 ? (1 + monthlyDiscountRate) ** (monthIndex + 1) : 1;
      npv += delta / discountFactor;
    }

    let recommendationScore = 0;
    const recommendationReasons: string[] = [];

    if (npv > 0) {
      recommendationScore += 40;
      recommendationReasons.push(
        `Positive NPV (${npv >= 0 ? '+' : ''}${npv.toFixed(0)}) at ${refiDiscountRate.toFixed(2)}% discount rate`,
      );
    } else {
      recommendationScore -= 40;
      recommendationReasons.push(
        `Negative NPV (${npv.toFixed(0)}) at ${refiDiscountRate.toFixed(2)}% discount rate`,
      );
    }

    if (breakEvenMonths !== null) {
      if (breakEvenMonths <= oldLoanMonths * 0.5) {
        recommendationScore += 20;
        recommendationReasons.push(`Fast break-even (${breakEvenMonths} months)`);
      } else if (breakEvenMonths <= oldLoanMonths) {
        recommendationScore += 10;
        recommendationReasons.push(`Break-even before current payoff (${breakEvenMonths} months)`);
      } else {
        recommendationScore -= 15;
        recommendationReasons.push(`Break-even after current payoff (${breakEvenMonths} months)`);
      }
    } else {
      recommendationScore -= 20;
      recommendationReasons.push('No monthly-payment break-even at current assumptions');
    }

    if (interestSavings > 0) {
      recommendationScore += 10;
      recommendationReasons.push(`Lower lifetime interest (${interestSavings.toFixed(0)} saved)`);
    } else {
      recommendationScore -= 10;
      recommendationReasons.push(
        `Higher lifetime interest (${Math.abs(interestSavings).toFixed(0)} extra)`,
      );
    }

    if (newLoanMonths > oldLoanMonths) {
      recommendationScore -= 10;
      recommendationReasons.push(
        `Longer payoff horizon (${newLoanMonths - oldLoanMonths} extra months)`,
      );
    }

    const recommendationLabel =
      recommendationScore >= 45
        ? 'Recommend Refinance'
        : recommendationScore >= 10
          ? 'Borderline / Depends on Priorities'
          : 'Keep Current Loan';

    return {
      refinancePrincipal,
      refinancePayment,
      refinanceLoanSummary,
      monthlySavings,
      interestSavings,
      breakEvenMonths,
      npv,
      nominalCashFlowDelta,
      recommendationScore,
      recommendationLabel,
      recommendationReasons,
    };
  }, [
    homeLoan,
    baseLoanSummary,
    refiClosingCosts,
    refiCashOut,
    effectiveRefiRate,
    effectiveRefiTermYears,
    refiDiscountRate,
  ]);

  const extraPaymentSummary = useMemo(() => {
    if (!homeLoan || !baseLoanSummary) {
      return null;
    }

    const acceleratedSummary = buildAmortization(
      homeLoan.currentBalance,
      homeLoan.interestRate,
      homeLoan.monthlyPayment,
      new Date(),
      extraOneTime,
      extraMonthly,
    );

    return {
      acceleratedSummary,
      monthsSaved: Math.max(0, baseLoanSummary.monthsToPayoff - acceleratedSummary.monthsToPayoff),
      interestSaved: Math.max(0, baseLoanSummary.totalInterest - acceleratedSummary.totalInterest),
    };
  }, [homeLoan, baseLoanSummary, extraOneTime, extraMonthly]);

  const amortizationComparisonData = useMemo(() => {
    if (!baseLoanSummary) {
      return [];
    }

    const acceleratedRows = extraPaymentSummary?.acceleratedSummary.rows ?? [];
    const acceleratedRowsByPeriod = new Map(acceleratedRows.map((row) => [row.period, row]));
    const acceleratedCumulativeInterestByPeriod = new Map<number, number>();
    let runningAcceleratedInterest = 0;
    for (const row of acceleratedRows) {
      runningAcceleratedInterest += row.interest;
      acceleratedCumulativeInterestByPeriod.set(row.period, runningAcceleratedInterest);
    }

    return amortizationChartData.map((row) => {
      const acceleratedRow = acceleratedRowsByPeriod.get(row.period);

      const acceleratedPaymentTotal = acceleratedRow
        ? acceleratedRow.principal + acceleratedRow.interest
        : 0;

      return {
        ...row,
        acceleratedBalance: acceleratedRow?.balance,
        acceleratedCumulativeInterest: acceleratedCumulativeInterestByPeriod.get(row.period),
        acceleratedPrincipalAmount: acceleratedRow?.principal,
        acceleratedInterestAmount: acceleratedRow?.interest,
        acceleratedPrincipalSharePercent:
          acceleratedPaymentTotal > 0
            ? (acceleratedRow!.principal / acceleratedPaymentTotal) * 100
            : undefined,
        acceleratedInterestSharePercent:
          acceleratedPaymentTotal > 0
            ? (acceleratedRow!.interest / acceleratedPaymentTotal) * 100
            : undefined,
      };
    });
  }, [baseLoanSummary, amortizationChartData, extraPaymentSummary]);

  const formatCompactAxisLabel = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return `${Math.round(value)}`;
  };
  const showShareSeries = ratioChartDisplayMode === 'share' || ratioChartDisplayMode === 'both';
  const showAmountSeries = ratioChartDisplayMode === 'amount' || ratioChartDisplayMode === 'both';
  const isAmountOnlyMode = ratioChartDisplayMode === 'amount';
  const isBothMode = ratioChartDisplayMode === 'both';
  const ratioShareAxisId = 'ratio-share';
  const ratioAmountAxisId = 'ratio-amount';
  const amountAxisMax = useMemo(() => {
    const maxAmount = amortizationComparisonData.reduce((max, row) => {
      return Math.max(
        max,
        Number(row.principalAmount ?? 0),
        Number(row.interestAmount ?? 0),
        Number(row.acceleratedPrincipalAmount ?? 0),
        Number(row.acceleratedInterestAmount ?? 0),
      );
    }, 0);

    if (maxAmount <= 0) {
      return 100;
    }

    return maxAmount * 1.05;
  }, [amortizationComparisonData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Planner Tools</CardTitle>
          <CardDescription>Scenario labs for mortgage choices.</CardDescription>
        </div>
        {toggleControl}
      </CardHeader>
      {!collapsed ? (
        <CardContent className="space-y-4">
          <Tabs value={selectedTool} onValueChange={setSelectedTool}>
            <div className="overflow-x-auto pb-1">
              <TabsList className="inline-flex h-9 w-max min-w-full justify-start gap-1">
                <TabsTrigger value="loan-compare">Loan Compare</TabsTrigger>
                <TabsTrigger value="amortization">Amortization</TabsTrigger>
                <TabsTrigger value="refinance">Refinance</TabsTrigger>
              </TabsList>
            </div>

            {!homeLoan ? (
              <div className="text-muted-foreground rounded-md border p-3 text-sm">
                Add a <span className="font-medium">Home</span> account with loan details to unlock
                mortgage tools.
              </div>
            ) : null}

            <LoanCompareTab
              homeLoan={homeLoan}
              loanPaidDownPercent={loanPaidDownPercent}
              compareTerms={compareTerms}
              formatCurrency={formatCurrency}
            />

            <AmortizationTab
              data={{
                homeLoan,
                baseLoanSummary,
                extraPaymentSummary,
                amortizationComparisonData,
                showShareSeries,
                showAmountSeries,
                isAmountOnlyMode,
                isBothMode,
                ratioShareAxisId,
                ratioAmountAxisId,
                amountAxisMax,
              }}
              state={{
                extraMonthly,
                extraOneTime,
                ratioChartDisplayMode,
              }}
              actions={{
                setExtraMonthly,
                setExtraOneTime,
                setRatioChartDisplayMode,
              }}
              chart={{
                amortizationChartConfig,
                amortizationRatioChartConfig,
              }}
              helpers={{
                formatCompactAxisLabel,
                formatCurrency,
              }}
            />

            <RefinanceTab
              data={{
                homeLoan,
                baseLoanSummary,
                refinanceSummary,
              }}
              state={{
                refiRate: effectiveRefiRate,
                refiTermYears: effectiveRefiTermYears,
                refiClosingCosts,
                refiCashOut,
                refiDiscountRate,
              }}
              actions={{
                setRefiRate,
                setRefiTermYears,
                setRefiClosingCosts,
                setRefiCashOut,
                setRefiDiscountRate,
              }}
              helpers={{ formatCurrency }}
            />
          </Tabs>
        </CardContent>
      ) : null}
    </Card>
  );
};
