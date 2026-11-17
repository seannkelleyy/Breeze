import { describe, it, expect } from 'vitest';

import { formatDate, today } from '../dates';

describe('retirement access dates', () => {
  it('formats today as an ISO date', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats a date for display', () => {
    expect(formatDate('2026-01-02')).toBe('Jan 2, 2026');
  });

  it('returns the original value when the date is invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
