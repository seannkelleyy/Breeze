import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePayrollTaxes } from '../payrollTaxes';

/**
 * Golden test: the payroll tax split against a hand-checked fixture shared
 * with the repo docs (tests/fixtures/payroll-taxes.json). The fixture pins
 * the wage-base conventions: traditional 401(k) deferrals reduce income-tax
 * wages only; §125 items (HSA, premiums, FSA) reduce both bases; FICA
 * includes the SS wage-base cap and the 0.9% additional Medicare tax.
 */
const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'tests', 'fixtures', 'payroll-taxes.json'), 'utf8'),
) as {
  inputs: { standardDeduction: number; ssWageBase: number; additionalMedicareThreshold: number };
  brackets: { rate: number; minimum: number; maximum: number | null }[];
  cases: {
    name: string;
    grossIncome: number;
    incomeTaxReductions: number;
    ficaReductions: number;
    incomeTaxWages: number;
    ficaWages: number;
    federalTax: number;
    ficaTax: number;
    totalTax: number;
  }[];
};

describe('payroll taxes — golden fixtures (FICA wage-base conventions)', () => {
  it.each(fixture.cases)('$name', (c) => {
    const result = computePayrollTaxes({
      grossIncome: c.grossIncome,
      incomeTaxReductions: c.incomeTaxReductions,
      ficaReductions: c.ficaReductions,
      standardDeduction: fixture.inputs.standardDeduction,
      ssWageBase: fixture.inputs.ssWageBase,
      additionalMedicareThreshold: fixture.inputs.additionalMedicareThreshold,
      brackets: fixture.brackets,
    });

    expect(result.incomeTaxWages).toBeCloseTo(c.incomeTaxWages, 2);
    expect(result.ficaWages).toBeCloseTo(c.ficaWages, 2);
    expect(result.federalTax).toBeCloseTo(c.federalTax, 2);
    expect(result.ficaTax).toBeCloseTo(c.ficaTax, 2);
    expect(result.totalTax).toBeCloseTo(c.totalTax, 2);
  });

  it('401(k) deferrals never reduce FICA wages', () => {
    const only = computePayrollTaxes({
      grossIncome: 100000,
      incomeTaxReductions: 20000,
      ficaReductions: 0,
      standardDeduction: 16100,
      ssWageBase: 184500,
      additionalMedicareThreshold: 200000,
      brackets: fixture.brackets,
    });
    expect(only.ficaWages).toBe(100000);
  });
});
