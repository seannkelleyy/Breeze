export interface AmortizationRow {
  period: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  totalInterest: number;
  monthsToPayoff: number;
  payoffDate: Date | null;
  rows: AmortizationRow[];
  isNegativeAmortization: boolean;
}

const monthDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

export const clamp = (value: number, min = 0): number =>
  Number.isFinite(value) ? Math.max(min, value) : min;

export const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const calculateMonthlyPayment = (
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number => {
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

export const buildAmortization = (
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

export const loanPaidDownPercent = (originalAmount: number, currentBalance: number): number => {
  if (originalAmount <= 0) return 0;
  return ((originalAmount - currentBalance) / originalAmount) * 100;
};

export const computeRefinanceNpv = (
  currentMonthlyPayment: number,
  currentRemainingMonths: number,
  currentInterestRate: number,
  newMonthlyPayment: number,
  newRemainingMonths: number,
  closingCosts: number,
  discountRatePercent: number,
): number => {
  const monthlyDiscountRate = discountRatePercent / 100 / 12;
  let npv = 0;
  const maxMonths = Math.max(currentRemainingMonths, newRemainingMonths);

  for (let month = 1; month <= maxMonths; month++) {
    const discountFactor = 1 / (1 + monthlyDiscountRate) ** month;
    const currentCost = month <= currentRemainingMonths ? currentMonthlyPayment : 0;
    const newCost = month <= newRemainingMonths ? newMonthlyPayment : 0;
    npv += (currentCost - newCost) * discountFactor;
  }

  return npv - closingCosts;
};

export const computeBreakEvenMonths = (closingCosts: number, monthlySavings: number): number => {
  if (monthlySavings <= 0) return Infinity;
  return Math.ceil(closingCosts / monthlySavings);
};
