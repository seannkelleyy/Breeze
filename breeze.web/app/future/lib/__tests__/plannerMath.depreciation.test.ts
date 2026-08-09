import { describe, it, expect } from 'vitest';
import { getVehicleAnnualDepreciationRate, getHomeAnnualGrowthRate } from '../plannerMath';
import {
  PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES,
  PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS,
  PLANNER_DEFAULT_HOME_APPRECIATION_RATE,
  PLANNER_DEFAULT_VEHICLE_DEPRECIATION_RATE,
} from '../constants';

describe('getHomeAnnualGrowthRate', () => {
  it('returns 0% for none profile', () => {
    expect(getHomeAnnualGrowthRate('none')).toBe(0);
  });

  it('returns 2.5% for low profile', () => {
    expect(getHomeAnnualGrowthRate('low')).toBe(2.5);
  });

  it('returns 4% for medium profile', () => {
    expect(getHomeAnnualGrowthRate('medium')).toBe(4);
  });

  it('returns 6% for high profile', () => {
    expect(getHomeAnnualGrowthRate('high')).toBe(6);
  });

  it('returns custom rate when profile is custom', () => {
    expect(getHomeAnnualGrowthRate('custom', 5.5)).toBe(5.5);
  });

  it('falls back to default when profile is custom and no rate provided', () => {
    expect(getHomeAnnualGrowthRate('custom')).toBe(PLANNER_DEFAULT_HOME_APPRECIATION_RATE);
  });

  it('falls back to default for undefined profile', () => {
    expect(getHomeAnnualGrowthRate(undefined)).toBe(PLANNER_DEFAULT_HOME_APPRECIATION_RATE);
  });
});

describe('getVehicleAnnualDepreciationRate', () => {
  describe('medium profile (default)', () => {
    it('returns first-year rate at year 0', () => {
      const rate = getVehicleAnnualDepreciationRate('medium', 0);
      // Tapered rate = 6 + (16 - 6) * 0.55^0 = 6 + 10 = 16
      // min(16, max(6, 16)) = 16
      expect(rate).toBeCloseTo(PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES.medium, 2);
    });

    it('returns mature floor rate after many years', () => {
      const rate = getVehicleAnnualDepreciationRate('medium', 50);
      // After many years, 0.55^50 is essentially 0
      // Tapered = 6 + 10 * ~0 = 6
      expect(rate).toBeCloseTo(PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS.medium, 1);
    });

    it('decreases over time (tapering)', () => {
      const rateYear0 = getVehicleAnnualDepreciationRate('medium', 0);
      const rateYear5 = getVehicleAnnualDepreciationRate('medium', 5);
      const rateYear10 = getVehicleAnnualDepreciationRate('medium', 10);
      expect(rateYear0).toBeGreaterThan(rateYear5);
      expect(rateYear5).toBeGreaterThan(rateYear10);
    });
  });

  describe('low profile', () => {
    it('returns low first-year rate at year 0', () => {
      const rate = getVehicleAnnualDepreciationRate('low', 0);
      expect(rate).toBeCloseTo(PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES.low, 2);
    });

    it('converges to low mature floor', () => {
      const rate = getVehicleAnnualDepreciationRate('low', 50);
      expect(rate).toBeCloseTo(PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS.low, 1);
    });
  });

  describe('high profile', () => {
    it('returns high first-year rate at year 0', () => {
      const rate = getVehicleAnnualDepreciationRate('high', 0);
      expect(rate).toBeCloseTo(PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES.high, 2);
    });

    it('converges to high mature floor', () => {
      const rate = getVehicleAnnualDepreciationRate('high', 50);
      expect(rate).toBeCloseTo(PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS.high, 1);
    });
  });

  describe('custom profile', () => {
    it('returns custom rate when provided', () => {
      expect(getVehicleAnnualDepreciationRate('custom', 5, 12)).toBe(12);
    });

    it('falls back to default when no custom rate', () => {
      expect(getVehicleAnnualDepreciationRate('custom', 5)).toBe(
        PLANNER_DEFAULT_VEHICLE_DEPRECIATION_RATE,
      );
    });
  });

  it('uses medium as default for undefined profile', () => {
    const rate = getVehicleAnnualDepreciationRate(undefined, 0);
    expect(rate).toBeCloseTo(PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES.medium, 2);
  });

  it('rate is always between mature floor and first-year rate', () => {
    for (const profile of ['low', 'medium', 'high'] as const) {
      for (let year = 0; year <= 20; year++) {
        const rate = getVehicleAnnualDepreciationRate(profile, year);
        const floor = PLANNER_VEHICLE_DEPRECIATION_MATURE_RATE_FLOORS[profile];
        const ceiling = PLANNER_VEHICLE_DEPRECIATION_FIRST_YEAR_RATES[profile];
        expect(rate).toBeGreaterThanOrEqual(floor - 0.01);
        expect(rate).toBeLessThanOrEqual(ceiling + 0.01);
      }
    }
  });
});
