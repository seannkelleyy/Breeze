import { describe, it, expect } from 'vitest';
import { cn, formatCurrencyWithCode, formatTimeAgo } from '../utils';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4', 'py-1')).toBe('px-4 py-1');
  });
});

describe('formatCurrencyWithCode', () => {
  it('formats USD with cents by default', () => {
    expect(formatCurrencyWithCode(1234.5, 'USD')).toBe('$1,234.50');
  });

  it('rounds to whole dollars when maximumFractionDigits is 0', () => {
    expect(formatCurrencyWithCode(1234.5, 'USD', { maximumFractionDigits: 0 })).toBe('$1,235');
  });

  it('handles negative amounts', () => {
    expect(formatCurrencyWithCode(-42.25, 'USD')).toBe('-$42.25');
  });

  it('falls back to plain number formatting for invalid currency codes', () => {
    expect(formatCurrencyWithCode(1234.5, 'NOT_A_CURRENCY')).toBe('1,234.50');
  });
});

describe('formatTimeAgo', () => {
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

  it('returns "just now" for less than a minute', () => {
    expect(formatTimeAgo(new Date(Date.now() - 5_000).toISOString())).toBe('just now');
  });

  it('returns minutes for under an hour', () => {
    expect(formatTimeAgo(minutesAgo(5))).toBe('5m ago');
  });

  it('returns hours for under a day', () => {
    expect(formatTimeAgo(minutesAgo(90))).toBe('1h ago');
    expect(formatTimeAgo(minutesAgo(23 * 60))).toBe('23h ago');
  });

  it('returns days for under 30 days', () => {
    expect(formatTimeAgo(minutesAgo(25 * 60))).toBe('1d ago');
    expect(formatTimeAgo(minutesAgo(29 * 24 * 60))).toBe('29d ago');
  });

  it('returns months at 30 days and beyond', () => {
    expect(formatTimeAgo(minutesAgo(45 * 24 * 60))).toBe('1mo ago');
    expect(formatTimeAgo(minutesAgo(400 * 24 * 60))).toBe('13mo ago');
  });
});
