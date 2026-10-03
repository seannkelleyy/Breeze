/**
 * Payroll wage-base treatment — the canonical table of which paycheck
 * deductions reduce which wage bases. Never inline these flags: they come
 * from IRS rules that differ per deduction type (§125 cafeteria plans vs
 * 401(k) deferrals), and a completeness test fails if a kind is missing.
 *
 * Two independent wage bases exist:
 * - Federal income-tax wages: reduced by traditional 401(k)/403(b)/457
 *   deferrals, HSA payroll contributions, and §125 premiums (health,
 *   dental, vision, health FSA, commuter).
 * - FICA wages (Social Security + Medicare): reduced ONLY by §125 items.
 *   401(k)/403(b)/457 deferrals — traditional or Roth — do NOT reduce FICA
 *   wages. Roth contributions reduce neither base.
 *
 * Sources: IRS Pub 15-T (income-tax withholding), IRS Pub 15 (FICA wages),
 * IRC §3121(a)(5)(D) (§125 FICA exclusion), IRC §402(l)–(q).
 */
interface WageTreatmentAccount {
  accountType: string;
  taxTreatment?: string;
  pretaxSharePercent?: number | null;
}

/** Account types whose PRE-TAX contributions reduce FICA wages (§125
 * cafeteria-plan HSA). Traditional 401(k)/403(b)/457 do not. */
export const FICA_EXEMPT_ACCOUNT_TYPES = new Set(['hsa']);

/** Wage-base treatment of a deduction or contribution. */
export interface WageTreatment {
  /** Reduces federal income-tax wages. */
  incomeTax: boolean;
  /** Reduces FICA wages (Social Security + Medicare). */
  fica: boolean;
}

export const WITHHOLDING_KIND_OPTIONS = [
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'FSA', label: 'FSA' },
  { value: 'HSA', label: 'HSA' },
  { value: 'OTHER', label: 'Other' },
] as const;

/** Per-kind treatment for paycheck withholdings (paycheck_deductions.kind).
 * BOTH must be explicit — the completeness test fails on a missing kind. */
export const WITHHOLDING_WAGE_TREATMENT: Record<string, WageTreatment> = {
  // §125 cafeteria-plan items: reduce both bases (when pretax).
  INSURANCE: { incomeTax: true, fica: true },
  FSA: { incomeTax: true, fica: true },
  HSA: { incomeTax: true, fica: true },
  // Unknown purpose: pretax claims income-tax reduction only — do NOT claim
  // a §125 FICA exclusion without knowing the plan type.
  OTHER: { incomeTax: true, fica: false },
};

/** Exhaustiveness guard: every withholding kind option must have explicit
 * treatment. A new kind without an entry fails this test. */
export function withholdingTreatmentFor(kind: string): WageTreatment {
  const treatment = WITHHOLDING_WAGE_TREATMENT[kind];
  if (!treatment) {
    throw new Error(`no wage treatment defined for withholding kind "${kind}"`);
  }
  return treatment;
}

/** Account-backed contributions: pre-tax reduces income-tax wages; only the
 * HSA (cafeteria plan) also reduces FICA wages. Roth reduces neither. */
export function accountWageTreatment(account: WageTreatmentAccount): WageTreatment {
  const isPretaxPortion = account.taxTreatment !== 'ROTH';
  const fica = account.accountType === 'hsa' && isPretaxPortion;
  return { incomeTax: isPretaxPortion, fica };
}

/** Additional Medicare Tax (0.9%) thresholds by filing status — statutory,
 * not indexed. Applied at the HOUSEHOLD level on combined FICA wages. */
export const ADDITIONAL_MEDICARE_THRESHOLDS: Record<string, number> = {
  SINGLE: 200000,
  MFJ: 250000,
  MFS: 125000,
  HOH: 200000,
};
