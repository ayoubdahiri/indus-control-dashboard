import { describe, expect, it } from 'vitest';
import { calculateOee } from './oee';

describe('simulated OEE calculations', () => {
  it('calculates availability, performance, quality, and OEE', () => {
    const metrics = calculateOee({
      plannedProductionTimeSeconds: 100,
      runTimeSeconds: 80,
      idealCycleTimeSeconds: 2,
      goodUnits: 30,
      totalUnits: 32,
    });
    expect(metrics.availability).toBeCloseTo(0.8);
    expect(metrics.performance).toBeCloseTo(0.8);
    expect(metrics.quality).toBeCloseTo(30 / 32);
    expect(metrics.oee).toBeCloseTo(0.8 * 0.8 * (30 / 32));
  });

  it('safely returns zero for invalid denominators and bounds counters', () => {
    const metrics = calculateOee({
      plannedProductionTimeSeconds: 0,
      runTimeSeconds: 20,
      idealCycleTimeSeconds: 0,
      goodUnits: 50,
      totalUnits: 10,
    });
    expect(metrics).toEqual({ availability: 0, performance: 0, quality: 1, oee: 0 });
  });
});
