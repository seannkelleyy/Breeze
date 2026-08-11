import { describe, it, expect } from 'vitest';

// Test the validation logic extracted from FormattedNumberInput
const isValidNumber = (value: string) => {
  const cleaned = value.replace(/,/g, '').trim();
  if (cleaned === '') return false;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed);
};

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

describe('FormattedNumberInput validation', () => {
  describe('isValidNumber', () => {
    it('accepts plain numbers', () => {
      expect(isValidNumber('123')).toBe(true);
      expect(isValidNumber('0')).toBe(true);
      expect(isValidNumber('999')).toBe(true);
    });

    it('accepts decimal numbers', () => {
      expect(isValidNumber('123.45')).toBe(true);
      expect(isValidNumber('0.01')).toBe(true);
      expect(isValidNumber('.5')).toBe(true);
    });

    it('accepts negative numbers', () => {
      expect(isValidNumber('-100')).toBe(true);
      expect(isValidNumber('-0.5')).toBe(true);
    });

    it('accepts numbers with commas', () => {
      expect(isValidNumber('1,000')).toBe(true);
      expect(isValidNumber('1,000,000')).toBe(true);
      expect(isValidNumber('12,345.67')).toBe(true);
    });

    it('rejects empty strings', () => {
      expect(isValidNumber('')).toBe(false);
      expect(isValidNumber('   ')).toBe(false);
    });

    it('rejects non-numeric strings', () => {
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber('12abc')).toBe(false);
      expect(isValidNumber('$100')).toBe(false);
    });

    it('rejects special values', () => {
      expect(isValidNumber('NaN')).toBe(false);
      expect(isValidNumber('Infinity')).toBe(false);
    });
  });

  describe('parseNumber', () => {
    it('parses plain numbers', () => {
      expect(parseNumber('123')).toBe(123);
      expect(parseNumber('0')).toBe(0);
    });

    it('parses decimals', () => {
      expect(parseNumber('123.45')).toBeCloseTo(123.45);
    });

    it('strips commas before parsing', () => {
      expect(parseNumber('1,000')).toBe(1000);
      expect(parseNumber('1,000,000')).toBe(1000000);
    });

    it('returns 0 for invalid input', () => {
      expect(parseNumber('abc')).toBe(0);
      expect(parseNumber('')).toBe(0);
    });
  });

  describe('clamp', () => {
    it('clamps to minimum', () => {
      expect(clamp(-5)).toBe(0);
      expect(clamp(-100, 0)).toBe(0);
    });

    it('preserves values above minimum', () => {
      expect(clamp(100)).toBe(100);
      expect(clamp(0)).toBe(0);
    });

    it('handles custom minimum', () => {
      expect(clamp(5, 10)).toBe(10);
      expect(clamp(15, 10)).toBe(15);
    });

    it('handles NaN', () => {
      expect(clamp(NaN)).toBe(0);
      expect(clamp(NaN, 5)).toBe(5);
    });

    it('handles Infinity', () => {
      expect(clamp(Infinity)).toBe(0);
    });
  });
});
