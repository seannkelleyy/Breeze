'use client';
import { formatCurrencyWithCode } from '@/lib/utils';
import { InfoTip } from '@/components/common/InfoTip';
import {
  buildBracketBands,
  buildBracketLadder,
  type BracketBandSection,
  type TaxScenario,
} from '../lib/taxScenario';

const rateBg = (rate: number) => `oklch(0.75 0.15 ${(rate * 1000) % 360})`;
const SHIELDED_BG = 'oklch(0.72 0.15 155)';
const isCurrentBand = (band: BracketBandSection) => band.fillPct > 0 && band.fillPct < 1;

function ScenarioColumn({
  scenario,
  bands,
  currencyCode,
}: {
  scenario: TaxScenario;
  bands: BracketBandSection[];
  currencyCode: string;
}) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  // Ladder fills the bar minus the shielded share; bands are proportional to
  // each bracket's income span within that ladder space.
  const shieldedPct = (bands.find((b) => b.kind === 'shielded')?.span ?? 0) / scenario.grossIncome;
  const ladderPct = Math.max(0, 100 - shieldedPct * 100);
  const totalSpan = bands
    .filter((b) => b.kind === 'bracket')
    .reduce((sum, b) => sum + b.span, 0);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium">{scenario.label}</p>
      <div className="flex h-[420px] w-40 flex-col-reverse overflow-hidden rounded-lg border">
        {bands.map((band) => {
          const heightPct =
            band.kind === 'shielded'
              ? shieldedPct * 100
              : totalSpan > 0
                ? (band.span / totalSpan) * ladderPct
                : 0;
          if (band.kind === 'shielded') {
            return (
              <div
                key="shielded"
                className="flex items-center justify-center text-[10px] font-medium text-white"
                style={{ height: `${heightPct}%`, backgroundColor: SHIELDED_BG }}
                title={`Pre-tax + deduction: ${fc(band.span)}`}
              >
                {heightPct >= 8 && 'Pre-tax'}
              </div>
            );
          }
          const solid = rateBg(band.rate ?? 0);
          return (
            <div
              key={band.rate}
              className="relative border-t border-border/60"
              style={{ height: `${heightPct}%` }}
              title={`${((band.rate ?? 0) * 100).toFixed(0)}% bracket · ${fc(band.used)} of ${fc(band.span)} taxable`}
            >
              <div
                className="absolute inset-x-0 bottom-0"
                style={{ height: `${band.fillPct * 100}%`, backgroundColor: solid }}
              />
              {isCurrentBand(band) && (
                <span className="absolute inset-x-0 top-0.5 text-center text-[9px] font-medium text-foreground">
                  you are here
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center text-xs">
        <p className="text-muted-foreground">Total tax</p>
        <p className="font-medium">{fc(scenario.totalTax)}</p>
        <p className="text-muted-foreground">
          {(scenario.effectiveRate * 100).toFixed(1)}% effective ·{' '}
          {(scenario.marginalRate * 100).toFixed(0)}% marginal
        </p>
      </div>
    </div>
  );
}

export function TaxScenarioColumns({
  baseline,
  current,
  brackets,
  currencyCode,
}: {
  baseline: TaxScenario;
  current: TaxScenario;
  brackets: { minimum: number; maximum: number | null; rate: number }[];
  currencyCode: string;
}) {
  const fc = (v: number) => formatCurrencyWithCode(v, currencyCode);
  const ladder = buildBracketLadder(current.taxableIncome, brackets);
  const currentRow = ladder.find((r) => r.status === 'current');
  const nextRow = ladder.find((r) => r.status === 'ahead');

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-center gap-6">
        <ScenarioColumn
          scenario={baseline}
          bands={buildBracketBands(baseline, brackets)}
          currencyCode={currencyCode}
        />
        <ScenarioColumn
          scenario={current}
          bands={buildBracketBands(current, brackets)}
          currencyCode={currencyCode}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ backgroundColor: SHIELDED_BG }}
          />
          Pre-tax + deduction (not taxed)
        </span>
        <span>
          Each band is a federal bracket — filled = your income in it, hollow = headroom
        </span>
      </div>

      {currentRow && (
        <p className="text-center text-xs">
          You&apos;re in the{' '}
          <span className="font-medium">{(currentRow.rate * 100).toFixed(0)}% bracket</span> —{' '}
          {fc(currentRow.used)} fills it,{' '}
          <span className="font-medium">{fc(currentRow.remainingToNext ?? 0)}</span> more before
          the {(nextRow?.rate ?? 0) * 100}% rate applies.
          <InfoTip text="Every dollar of additional gross income above that line is taxed at the next rate; every additional pre-tax dollar is saved at the current one." />
        </p>
      )}
    </div>
  );
}

export default TaxScenarioColumns;
