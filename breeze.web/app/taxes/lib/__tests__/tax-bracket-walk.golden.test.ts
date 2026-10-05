import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFederalTax } from '@/app/future/lib/tax';
import type { TaxBracketRow } from '@/app/future/types/tax';

/**
 * Golden test: the TS federal bracket walk against a shared fixture that the
 * Go suite (breeze.api/internal/service/bracket_walk_golden_test.go) also
 * loads. If the two implementations drift, CI fails here AND there.
 * Fixture: tests/fixtures/tax-bracket-walk.json (repo root).
 */
const fixture = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '..',
      '..',
      '..',
      'tests',
      'fixtures',
      'tax-bracket-walk.json',
    ),
    'utf8',
  ),
) as {
  brackets: TaxBracketRow[];
  cases: { name: string; taxableIncome: number; expectedTax: number }[];
};

describe('federal bracket walk — golden fixtures (shared with Go)', () => {
  it.each(fixture.cases)(
    '$name: $taxableIncome → $expectedTax',
    ({ taxableIncome, expectedTax }) => {
      expect(getFederalTax(taxableIncome, fixture.brackets)).toBeCloseTo(expectedTax, 2);
    },
  );

  it('uses every fixture bracket in ascending rate order', () => {
    const rates = fixture.brackets.map((b) => b.rate);
    expect([...rates].sort((a, b) => a - b)).toEqual(rates);
  });
});
