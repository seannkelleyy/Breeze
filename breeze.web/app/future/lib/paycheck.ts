import type { PlannerPerson } from '../types/person';
import type { TaxYearTables } from '../types/tax';
import { getEffectiveTaxRate } from './tax';
import { getPaychecksPerYear } from './plannerMath';

/**
 * Per-person paycheck modeling: gross pay plus itemized deductions, from which
 * we estimate taxes and arrive at the take-home amount that lands in the bank.
 */

export interface PaycheckDeduction {
  id: string;
  name: string;
  /** Amount per paycheck. */
  amount: number;
  /** Pre-tax deductions (401k, HSA, FSA...) reduce taxable income. */
  pretax: boolean;
  /** Account the deducted money flows into (401k/HSA/investment). */
  linkedAccountId: string | null;
}

export interface PersonPaycheckConfig {
  /** Overrides the derived gross-per-check (annual base / paychecks per year). */
  grossPerCheck: number | null;
  deductions: PaycheckDeduction[];
}

export interface PaycheckComputation {
  grossPerCheck: number;
  pretaxPerCheck: number;
  taxablePerCheck: number;
  taxRate: number;
  taxesPerCheck: number;
  posttaxPerCheck: number;
  netPerCheck: number;
  checksPerYear: number;
  grossAnnual: number;
  netAnnual: number;
}

const EMPTY_CONFIG: PersonPaycheckConfig = { grossPerCheck: null, deductions: [] };

export function parsePaycheckConfig(json: string | undefined | null): PersonPaycheckConfig {
  if (!json) return { ...EMPTY_CONFIG, deductions: [] };
  try {
    const parsed = JSON.parse(json) as Partial<PersonPaycheckConfig> | null;
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_CONFIG, deductions: [] };
    return {
      grossPerCheck: typeof parsed.grossPerCheck === 'number' ? parsed.grossPerCheck : null,
      deductions: Array.isArray(parsed.deductions)
        ? parsed.deductions
            .filter((d) => d && typeof d.name === 'string' && typeof d.amount === 'number')
            .map((d, i) => ({
              id: d.id ?? `deduction-${i}`,
              name: d.name,
              amount: d.amount,
              pretax: d.pretax ?? true,
              linkedAccountId: d.linkedAccountId ?? null,
            }))
        : [],
    };
  } catch {
    return { ...EMPTY_CONFIG, deductions: [] };
  }
}

export function serializePaycheckConfig(config: PersonPaycheckConfig): string {
  return JSON.stringify(config);
}

export function isPaycheckConfigured(person: PlannerPerson): boolean {
  const config = parsePaycheckConfig(person.paycheck);
  return config.grossPerCheck !== null || config.deductions.length > 0;
}

export function makePaycheckDeduction(): PaycheckDeduction {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    pretax: true,
    linkedAccountId: null,
  };
}

/**
 * Full paycheck waterfall for one person:
 *   gross − pre-tax deductions = taxable → taxes (est.) → − post-tax deductions = net
 */
export function computePaycheck(
  person: PlannerPerson,
  taxTables: TaxYearTables | null,
  deductionType: string,
): PaycheckComputation {
  const config = parsePaycheckConfig(person.paycheck);
  const checksPerYear = getPaychecksPerYear(person.payCadence);
  const baseAnnual =
    person.payType === 'hourly'
      ? person.hourlyRate * person.expectedHoursPerWeek * 52
      : person.annualSalary;
  const grossPerCheck = config.grossPerCheck ?? baseAnnual / checksPerYear;
  const grossAnnual = grossPerCheck * checksPerYear;

  const pretaxPerCheck = config.deductions
    .filter((d) => d.pretax)
    .reduce((sum, d) => sum + d.amount, 0);
  const posttaxPerCheck = config.deductions
    .filter((d) => !d.pretax)
    .reduce((sum, d) => sum + d.amount, 0);

  const taxablePerCheck = Math.max(0, grossPerCheck - pretaxPerCheck);
  const taxableAnnual = taxablePerCheck * checksPerYear;
  const taxRate = taxTables
    ? getEffectiveTaxRate(taxableAnnual, taxTables, deductionType).effectiveRate
    : 0.2;
  const taxesPerCheck = taxablePerCheck * taxRate;

  const netPerCheck = grossPerCheck - pretaxPerCheck - taxesPerCheck - posttaxPerCheck;

  return {
    grossPerCheck,
    pretaxPerCheck,
    taxablePerCheck,
    taxRate,
    taxesPerCheck,
    posttaxPerCheck,
    netPerCheck,
    checksPerYear,
    grossAnnual,
    netAnnual: netPerCheck * checksPerYear,
  };
}

/** Annual take-home for a person; falls back to the estimated waterfall when no paycheck is configured. */
export function getPersonNetAnnual(
  person: PlannerPerson,
  taxTables: TaxYearTables | null,
  deductionType: string,
): number {
  if (isPaycheckConfigured(person)) {
    return computePaycheck(person, taxTables, deductionType).netAnnual;
  }
  const baseAnnual =
    person.payType === 'hourly'
      ? person.hourlyRate * person.expectedHoursPerWeek * 52
      : person.annualSalary;
  return baseAnnual * 0.8; // neutral take-home estimate, matching the tax fallback
}
