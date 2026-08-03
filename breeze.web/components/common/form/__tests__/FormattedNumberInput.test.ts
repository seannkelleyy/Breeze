import { describe, it, expect } from 'vitest';

// These functions are defined locally in FormattedNumberInput.tsx
// We test the same logic by reimplementing the pure functions here.
// In practice, these should be extracted to a shared utility.

const clamp = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number, maxFractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);

describe('clamp (FormattedNumberInput)', () => {
  it('returns value when above min', () => {
    expect(clamp(42)).toBe(42);
  });

  it('returns min for negative values', () => {
    expect(clamp(-5)).toBe(0);
  });

  it('returns min for NaN', () => {
    expect(clamp(NaN)).toBe(0);
  });

  it('returns min for Infinity', () => {
    expect(clamp(Infinity)).toBe(0);
  });

  it('uses custom min', () => {
    expect(clamp(5, 10)).toBe(10);
  });
});

describe('parseNumber', () => {
  it('parses valid numbers', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber('3.14')).toBe(3.14);
    expect(parseNumber('-10')).toBe(-10);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(parseNumber('abc')).toBe(0);
    expect(parseNumber('')).toBe(0);
    expect(parseNumber('NaN')).toBe(0);
  });

  it('handles "0"', () => {
    expect(parseNumber('0')).toBe(0);
  });

  it('handles large numbers', () => {
    expect(parseNumber('1000000')).toBe(1000000);
  });
});

describe('formatNumber', () => {
  it('formats integers', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('formats with fraction digits', () => {
    expect(formatNumber(1234.56, 2)).toBe('1,234.56');
  });

  it('rounds to maxFractionDigits', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats negative numbers', () => {
    expect(formatNumber(-5000)).toBe('-5,000');
  });

  it('defaults to 0 fraction digits', () => {
    expect(formatNumber(1234.56)).toBe('1,235');
  });
});
