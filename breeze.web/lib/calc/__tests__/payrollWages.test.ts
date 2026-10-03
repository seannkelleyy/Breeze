import { describe, it, expect } from 'vitest';
import {
  withholdingTreatmentFor,
  accountWageTreatment,
  WITHHOLDING_WAGE_TREATMENT,
} from '../payrollWages';
import { WITHHOLDING_KIND_OPTIONS } from '../payrollWages';

describe('withholding wage treatment — every kind has explicit flags', () => {
  it('covers every withholding kind option (no silent defaults)', () => {
    for (const option of WITHHOLDING_KIND_OPTIONS) {
      expect(WITHHOLDING_WAGE_TREATMENT[option.value]).toBeDefined();
    }
  });

  it('throws for an unknown kind instead of defaulting', () => {
    expect(() => withholdingTreatmentFor('MYSTERY')).toThrow(/no wage treatment/);
  });

  it('§125 items reduce both bases; OTHER only income-tax', () => {
    expect(withholdingTreatmentFor('INSURANCE')).toEqual({ incomeTax: true, fica: true });
    expect(withholdingTreatmentFor('FSA')).toEqual({ incomeTax: true, fica: true });
    expect(withholdingTreatmentFor('HSA')).toEqual({ incomeTax: true, fica: true });
    expect(withholdingTreatmentFor('OTHER')).toEqual({ incomeTax: true, fica: false });
  });
});

describe('accountWageTreatment', () => {
  it('traditional 401(k): reduces income-tax wages, not FICA', () => {
    expect(
      accountWageTreatment({ accountType: '401k', taxTreatment: 'PRE_TAX', pretaxSharePercent: 100 }),
    ).toEqual({ incomeTax: true, fica: false });
  });

  it('Roth 401(k): reduces neither', () => {
    expect(
      accountWageTreatment({ accountType: '401k', taxTreatment: 'ROTH', pretaxSharePercent: 0 }),
    ).toEqual({ incomeTax: false, fica: false });
  });

  it('payroll HSA: cafeteria plan — reduces both', () => {
    expect(accountWageTreatment({ accountType: 'hsa', taxTreatment: 'PRE_TAX' })).toEqual({
      incomeTax: true,
      fica: true,
    });
  });

  it('457: reduces income-tax wages, not FICA', () => {
    expect(accountWageTreatment({ accountType: '457', taxTreatment: 'PRE_TAX' })).toEqual({
      incomeTax: true,
      fica: false,
    });
  });
});
