import BreezeLineChart from '@/components/common/charts/BreezeLineChart';
import { FormattedNumberInput } from '@/components/common/form/FormattedNumberInput';
import { ChartConfig } from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import { Line } from 'recharts';

interface HomeLoanContext {
  monthlyPayment: number;
  remainingMonths: number;
}

interface BaseLoanRow {
  period: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface BaseLoanSummary {
  totalInterest: number;
  rows: BaseLoanRow[];
  isNegativeAmortization: boolean;
}

interface ExtraPaymentSummary {
  acceleratedSummary: {
    monthsToPayoff: number;
  };
  monthsSaved: number;
  interestSaved: number;
}

type RatioChartDisplayMode = 'share' | 'amount' | 'both';

interface AmortizationTabProps {
  data: {
    homeLoan: HomeLoanContext | null;
    baseLoanSummary: BaseLoanSummary | null;
    extraPaymentSummary: ExtraPaymentSummary | null;
    amortizationComparisonData: Array<Record<string, unknown>>;
    showShareSeries: boolean;
    showAmountSeries: boolean;
    isAmountOnlyMode: boolean;
    isBothMode: boolean;
    ratioShareAxisId: string;
    ratioAmountAxisId: string;
    amountAxisMax: number;
  };
  state: {
    extraMonthly: number;
    extraOneTime: number;
    ratioChartDisplayMode: RatioChartDisplayMode;
  };
  actions: {
    setExtraMonthly: (value: number) => void;
    setExtraOneTime: (value: number) => void;
    setRatioChartDisplayMode: (mode: RatioChartDisplayMode) => void;
  };
  chart: {
    amortizationChartConfig: ChartConfig;
    amortizationRatioChartConfig: ChartConfig;
  };
  helpers: {
    formatCompactAxisLabel: (value: number) => string;
    formatCurrency: (value: number) => string;
  };
}

const AmortizationTab = ({ data, state, actions, chart, helpers }: AmortizationTabProps) => {
  const {
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
  } = data;
  const { extraMonthly, extraOneTime, ratioChartDisplayMode } = state;
  const { setExtraMonthly, setExtraOneTime, setRatioChartDisplayMode } = actions;
  const { amortizationChartConfig, amortizationRatioChartConfig } = chart;
  const { formatCompactAxisLabel, formatCurrency } = helpers;

  return (
    <TabsContent value="amortization" className="space-y-3">
      {homeLoan && baseLoanSummary ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Extra Monthly Payment</Label>
              <FormattedNumberInput
                value={extraMonthly}
                onValueChange={setExtraMonthly}
                maxFractionDigits={0}
              />
            </div>
            <div className="space-y-1">
              <Label>One-Time Extra Payment</Label>
              <FormattedNumberInput
                value={extraOneTime}
                onValueChange={setExtraOneTime}
                maxFractionDigits={0}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <p>Payment: {formatCurrency(homeLoan.monthlyPayment)}/mo</p>
            <p>Remaining term: {homeLoan.remainingMonths} months</p>
            <p>Projected remaining interest: {formatCurrency(baseLoanSummary.totalInterest)}</p>
          </div>
          {extraPaymentSummary ? (
            <div className="grid grid-cols-1 gap-3 rounded-md border p-3 text-sm sm:grid-cols-3">
              <p>
                Accelerated payoff: {extraPaymentSummary.acceleratedSummary.monthsToPayoff} months
              </p>
              <p>Months saved: {extraPaymentSummary.monthsSaved}</p>
              <p>Interest saved: {formatCurrency(extraPaymentSummary.interestSaved)}</p>
            </div>
          ) : null}
          <BreezeLineChart
            config={amortizationChartConfig}
            className="h-[280px] w-full"
            data={amortizationComparisonData}
            xAxisDataKey="date"
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            leftAxis={{
              dataKey: 'balance',
              yAxisId: 'left',
              tickFormatter: formatCompactAxisLabel,
            }}
            tooltipFormatter={(value: number) => formatCurrency(Number(value))}
            tooltipLabelFormatter={(
              label: string | number,
              payload: ReadonlyArray<{ payload?: Record<string, unknown> }>,
            ) => {
              const period = payload?.[0]?.payload?.period;
              return period ? `${label} (Month ${period})` : `${label}`;
            }}
          >
            <Line
              type="monotone"
              dataKey="balance"
              stroke="var(--color-balance)"
              strokeWidth={3}
              dot={false}
              yAxisId="left"
            />
            <Line
              type="monotone"
              dataKey="acceleratedBalance"
              stroke="var(--color-acceleratedBalance)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="8 4"
              yAxisId="left"
            />
            <Line
              type="monotone"
              dataKey="cumulativeInterest"
              stroke="var(--color-cumulativeInterest)"
              strokeWidth={2}
              dot={false}
              yAxisId="left"
            />
            <Line
              type="monotone"
              dataKey="acceleratedCumulativeInterest"
              stroke="var(--color-acceleratedCumulativeInterest)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="8 4"
              yAxisId="left"
            />
          </BreezeLineChart>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-6 rounded-sm"
                style={{ backgroundColor: 'hsl(var(--chart-1))' }}
              />
              <span>Remaining Balance</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-6 rounded-sm border border-dashed"
                style={{ borderColor: 'hsl(var(--chart-1))' }}
              />
              <span>Accelerated Balance (Dashed)</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-6 rounded-sm"
                style={{ backgroundColor: 'hsl(var(--chart-4))' }}
              />
              <span>Total Interest Paid</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-6 rounded-sm border border-dashed"
                style={{ borderColor: 'hsl(var(--chart-4))' }}
              />
              <span>Accelerated Total Interest (Dashed)</span>
            </div>
          </div>
          <div className="rounded-md border p-3">
            <p className="mb-2 text-xs font-medium">Composition View</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="ratio-chart-display-mode"
                  value="share"
                  checked={ratioChartDisplayMode === 'share'}
                  onChange={() => setRatioChartDisplayMode('share')}
                />
                <span>Share %</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="ratio-chart-display-mode"
                  value="amount"
                  checked={ratioChartDisplayMode === 'amount'}
                  onChange={() => setRatioChartDisplayMode('amount')}
                />
                <span>Amount</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="ratio-chart-display-mode"
                  value="both"
                  checked={ratioChartDisplayMode === 'both'}
                  onChange={() => setRatioChartDisplayMode('both')}
                />
                <span>Both</span>
              </label>
            </div>
          </div>
          <BreezeLineChart
            config={amortizationRatioChartConfig}
            className="h-[220px] w-full"
            data={amortizationComparisonData}
            xAxisDataKey="date"
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            leftAxis={
              isAmountOnlyMode
                ? {
                    yAxisId: ratioAmountAxisId,
                    dataKey: 'principalAmount',
                    domain: [0, amountAxisMax],
                    tickFormatter: formatCompactAxisLabel,
                  }
                : {
                    yAxisId: ratioShareAxisId,
                    dataKey: 'principalSharePercent',
                    domain: [0, 100],
                    tickFormatter: (value: number) => `${value}%`,
                  }
            }
            rightAxis={
              isBothMode
                ? {
                    yAxisId: ratioAmountAxisId,
                    dataKey: 'principalAmount',
                    tickFormatter: formatCompactAxisLabel,
                  }
                : undefined
            }
            tooltipFormatter={(value: number, _name: string, item: unknown) => {
              const dataKey = String((item as { dataKey?: string })?.dataKey ?? '');
              if (dataKey.toLowerCase().includes('sharepercent')) {
                return `${Number(value).toFixed(1)}%`;
              }
              return formatCurrency(Number(value));
            }}
            tooltipLabelFormatter={(
              label: string | number,
              payload: ReadonlyArray<{ payload?: Record<string, unknown> }>,
            ) => {
              const period = payload?.[0]?.payload?.period;
              return period ? `${label} (Month ${period})` : `${label}`;
            }}
          >
            {showShareSeries ? (
              <>
                <Line
                  yAxisId={ratioShareAxisId}
                  type="monotone"
                  dataKey="principalSharePercent"
                  stroke="var(--color-principalSharePercent)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId={ratioShareAxisId}
                  type="monotone"
                  dataKey="interestSharePercent"
                  stroke="var(--color-interestSharePercent)"
                  strokeWidth={2}
                  dot={false}
                />
              </>
            ) : null}
            {showAmountSeries ? (
              <>
                <Line
                  yAxisId={ratioAmountAxisId}
                  type="monotone"
                  dataKey="principalAmount"
                  stroke="var(--color-principalAmount)"
                  strokeWidth={1.75}
                  dot={false}
                  opacity={0.7}
                />
                <Line
                  yAxisId={ratioAmountAxisId}
                  type="monotone"
                  dataKey="interestAmount"
                  stroke="var(--color-interestAmount)"
                  strokeWidth={1.75}
                  dot={false}
                  opacity={0.7}
                />
              </>
            ) : null}
            {showShareSeries ? (
              <>
                <Line
                  yAxisId={ratioShareAxisId}
                  type="monotone"
                  dataKey="acceleratedPrincipalSharePercent"
                  stroke="var(--color-acceleratedPrincipalSharePercent)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="8 4"
                />
                <Line
                  yAxisId={ratioShareAxisId}
                  type="monotone"
                  dataKey="acceleratedInterestSharePercent"
                  stroke="var(--color-acceleratedInterestSharePercent)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="8 4"
                />
              </>
            ) : null}
            {showAmountSeries ? (
              <>
                <Line
                  yAxisId={ratioAmountAxisId}
                  type="monotone"
                  dataKey="acceleratedPrincipalAmount"
                  stroke="var(--color-acceleratedPrincipalAmount)"
                  strokeWidth={1.75}
                  dot={false}
                  strokeDasharray="8 4"
                  opacity={0.7}
                />
                <Line
                  yAxisId={ratioAmountAxisId}
                  type="monotone"
                  dataKey="acceleratedInterestAmount"
                  stroke="var(--color-acceleratedInterestAmount)"
                  strokeWidth={1.75}
                  dot={false}
                  strokeDasharray="8 4"
                  opacity={0.7}
                />
              </>
            ) : null}
          </BreezeLineChart>
          <p className="text-muted-foreground text-xs">
            Payment composition over time: principal share rises as interest share falls.
          </p>
          <div className="max-h-72 overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Payment</th>
                  <th className="p-2 text-right">Principal</th>
                  <th className="p-2 text-right">Interest</th>
                  <th className="p-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {baseLoanSummary.rows.slice(0, 120).map((row) => (
                  <tr key={`${row.period}-${row.date}`} className="border-t">
                    <td className="p-2">{row.period}</td>
                    <td className="p-2">{row.date}</td>
                    <td className="p-2 text-right">{formatCurrency(row.payment)}</td>
                    <td className="p-2 text-right">{formatCurrency(row.principal)}</td>
                    <td className="p-2 text-right">{formatCurrency(row.interest)}</td>
                    <td className="p-2 text-right">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {baseLoanSummary.isNegativeAmortization ? (
            <p className="text-destructive text-xs">
              Current payment may not cover interest (negative amortization).
            </p>
          ) : null}
        </>
      ) : null}
    </TabsContent>
  );
};

export default AmortizationTab;
