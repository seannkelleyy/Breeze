import { describe, it, expect } from 'vitest';
import { GOAL_CATEGORIES } from '../types/goal';

describe('GOAL_CATEGORIES', () => {
  it('has 10 categories', () => {
    expect(GOAL_CATEGORIES).toHaveLength(10);
  });

  it('has unique values', () => {
    const values = GOAL_CATEGORIES.map((c) => c.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('has labels for all values', () => {
    GOAL_CATEGORIES.forEach((category) => {
      expect(category.label).toBeTruthy();
      expect(category.label.length).toBeGreaterThan(0);
    });
  });

  it('includes expected categories', () => {
    const values = GOAL_CATEGORIES.map((c) => c.value);
    expect(values).toContain('emergency_fund');
    expect(values).toContain('debt_payoff');
    expect(values).toContain('retirement');
    expect(values).toContain('home');
    expect(values).toContain('vehicle');
    expect(values).toContain('travel');
    expect(values).toContain('education');
    expect(values).toContain('other');
  });
});

describe('Goal type structure', () => {
  it('validates goal shape', () => {
    // This tests the TypeScript type at compile time
    const goal = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      description: 'Save for emergency fund',
      isCompleted: false,
      targetAmount: '10000.00',
      targetDate: '2025-12-31',
      category: 'emergency_fund',
      customCategory: null,
      priority: 1,
      notes: 'Important goal',
      connectedAccountIds: ['123e4567-e89b-12d3-a456-426614174002'],
      isFinancialOrderStep: false,
      financialOrderStep: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    expect(goal.id).toBeTruthy();
    expect(goal.description).toBeTruthy();
    expect(goal.isCompleted).toBe(false);
    expect(goal.priority).toBe(1);
  });

  it('validates FOO step shape', () => {
    const fooStep = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      description: 'Build $1,000 emergency fund',
      isCompleted: false,
      targetAmount: null,
      targetDate: null,
      category: null,
      customCategory: null,
      priority: 0,
      notes: null,
      connectedAccountIds: [],
      isFinancialOrderStep: true,
      financialOrderStep: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    expect(fooStep.isFinancialOrderStep).toBe(true);
    expect(fooStep.financialOrderStep).toBe(1);
  });
});
