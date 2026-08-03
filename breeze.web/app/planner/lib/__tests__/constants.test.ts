import { describe, it, expect } from 'vitest';
import {
  isMoneyEqualWithinTolerance,
  isMoneyGreaterThanWithTolerance,
  isMoneyGreaterThanOrEqualWithTolerance,
  IRS_MAX_CONTRIBUTION_MATCH_TOLERANCE,
} from '../constants';

describe('isMoneyEqualWithinTolerance', () => {
  it('returns true for exactly equal amounts', () => {
    expect(isMoneyEqualWithinTolerance(100, 100)).toBe(true);
  });

  it('returns true within default tolerance ($1)', () => {
    expect(isMoneyEqualWithinTolerance(100, 100.5)).toBe(true);
    expect(isMoneyEqualWithinTolerance(100, 99.5)).toBe(true);
  });

  it('returns false beyond default tolerance', () => {
    expect(isMoneyEqualWithinTolerance(100, 102)).toBe(false);
    expect(isMoneyEqualWithinTolerance(100, 98)).toBe(false);
  });

  it('respects custom tolerance', () => {
    expect(isMoneyEqualWithinTolerance(100, 105, 10)).toBe(true);
    expect(isMoneyEqualWithinTolerance(100, 115, 10)).toBe(false);
  });

  it('handles negative amounts', () => {
    expect(isMoneyEqualWithinTolerance(-100, -100.5)).toBe(true);
  });
});

describe('isMoneyGreaterThanWithTolerance', () => {
  it('returns true when clearly greater', () => {
    expect(isMoneyGreaterThanWithTolerance(200, 100)).toBe(true);
  });

  it('returns false when equal (within tolerance)', () => {
    expect(isMoneyGreaterThanWithTolerance(100, 100)).toBe(false);
  });

  it('returns false when within tolerance of being equal', () => {
    expect(isMoneyGreaterThanWithTolerance(100.5, 100)).toBe(false);
  });

  it('returns true when exceeds tolerance', () => {
    expect(isMoneyGreaterThanWithTolerance(102, 100)).toBe(true);
  });

  it('returns false when less', () => {
    expect(isMoneyGreaterThanWithTolerance(50, 100)).toBe(false);
  });
});

describe('isMoneyGreaterThanOrEqualWithTolerance', () => {
  it('returns true when clearly greater', () => {
    expect(isMoneyGreaterThanOrEqualWithTolerance(200, 100)).toBe(true);
  });

  it('returns true when equal', () => {
    expect(isMoneyGreaterThanOrEqualWithTolerance(100, 100)).toBe(true);
  });

  it('returns true when within tolerance of being equal', () => {
    expect(isMoneyGreaterThanOrEqualWithTolerance(99.5, 100)).toBe(true);
  });

  it('returns false when below tolerance', () => {
    expect(isMoneyGreaterThanOrEqualWithTolerance(98, 100)).toBe(false);
  });
});

describe('IRS_MAX_CONTRIBUTION_MATCH_TOLERANCE', () => {
  it('defaults to $1', () => {
    expect(IRS_MAX_CONTRIBUTION_MATCH_TOLERANCE).toBe(1);
  });
});
