/**
 * Payroll tax computation over two wage bases. Pure — no React, no I/O.
 *
 * Wage bases (see payrollWages.ts for the flags that decide them):
 * - income-tax wages: gross minus traditional 401(k)/403(b)/457 deferrals,
 *   HSA payroll contributions, and §125 premiums (insurance, FSA).
 * - FICA wages: gross minus §125 items only (HSA payroll, insurance, FSA).
 *   Traditional 401(k)/403(b)/457 deferrals do NOT reduce FICA wages.
 *
 * FICA: Social Security 6.2% up to the wage base (2026: $184,500) + Medicare
 * 1.45% on all FICA wages + Additional Medicare Tax 0.9% above the
 * filing-status threshold ($200k single/HOH, $250k MFJ, $125k MFS).
 */

/** Structural bracket row — mirrors the API's taxYearData brackets. */
export interface TaxBracket {
  rate: number;
  minimum: number;
  maximum: number | null;
}

export interface PayrollTaxInput {
  grossIncome: number;
  /** Reduces income-tax wages only (traditional deferrals). */
  incomeTaxReductions: number;
  /** Reduces both bases (§125 cafeteria-plan items). */
  ficaReductions: number;
  standardDeduction: number;
  ssWageBase: number;
  additionalMedicareThreshold: number;
  brackets: TaxBracket[];
}

export interface PayrollTaxResult {
  incomeTaxWages: number;
  ficaWages: number;
  federalTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  ficaTax: number;
  totalTax: number;
  effectiveRate: number;
}

/** Employer withholding rule: 0.9% on ONE person's FICA wages above $200,000,
 * regardless of filing status. This is what actual paychecks reflect. */
export const ADDITIONAL_MEDICARE_WITHHOLDING_THRESHOLD = 200000;

/** Employer-withheld Additional Medicare Tax for one person. */
export function additionalMedicareWithheld(ficaWages: number): number {
  return Math.max(0, ficaWages - ADDITIONAL_MEDICARE_WITHHOLDING_THRESHOLD) * 0.009;
}

/** Additional Medicare Tax OWED on the return: 0.9% on COMBINED household
 * FICA wages above the filing-status threshold ($250k MFJ, $125k MFS,
 * $200k single/HOH — statutory, frozen since 2013). Settled at tax time or
 * through extra W-4 withholding. */
export function additionalMedicareOwed(ficaWages: number, filingStatus: string): number {
  const thresholds: Record<string, number> = {
    MFJ: 250000,
    MFS: 125000,
    SINGLE: 200000,
    HOH: 200000,
  };
  const threshold = thresholds[filingStatus] ?? 200000;
  return Math.max(0, ficaWages - threshold) * 0.009;
}

export interface FicaBreakdown {
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  total: number;
}

/** FICA over the FICA wage base: SS 6.2% capped at the wage base, Medicare
 * 1.45% on all FICA wages, Additional Medicare Tax 0.9% above the
 * filing-status threshold. The single FICA implementation — both the
 * waterfall and the Taxes page use this. */
export function computeFicaTax(
  ficaWages: number,
  ssWageBase: number,
  additionalMedicareThreshold: number,
): FicaBreakdown {
  const socialSecurityTax = Math.min(ficaWages, ssWageBase) * 0.062;
  const medicareTax = ficaWages * 0.0145;
  const additionalMedicareTax = Math.max(0, ficaWages - additionalMedicareThreshold) * 0.009;
  return {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    total: socialSecurityTax + medicareTax + additionalMedicareTax,
  };
}

/** Federal income tax over a bracket ladder. */
export function walkFederalBrackets(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.minimum) break;
    const upper =
      bracket.maximum === null ? taxableIncome : Math.min(taxableIncome, bracket.maximum);
    tax += (upper - bracket.minimum) * bracket.rate;
  }
  return tax;
}

export function computePayrollTaxes(input: PayrollTaxInput): PayrollTaxResult {
  const incomeTaxWages = Math.max(0, input.grossIncome - input.incomeTaxReductions);
  const ficaWages = Math.max(0, input.grossIncome - input.ficaReductions);

  const taxable = Math.max(0, incomeTaxWages - input.standardDeduction);
  const federalTax = walkFederalBrackets(taxable, input.brackets);

  const {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    total: ficaTax,
  } = computeFicaTax(ficaWages, input.ssWageBase, input.additionalMedicareThreshold);

  const totalTax = federalTax + ficaTax;
  return {
    incomeTaxWages,
    ficaWages,
    federalTax,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    ficaTax,
    totalTax,
    effectiveRate: input.grossIncome > 0 ? totalTax / input.grossIncome : 0,
  };
}
