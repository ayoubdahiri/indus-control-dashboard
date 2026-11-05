import { describe, expect, it } from 'vitest';
import { limitReadings, STORAGE_HISTORY_LIMIT } from './history';
import type { SensorReading } from './types';

describe('history retention', () => {
  it('defines a bounded browser retention limit', () => {
    const records = Array.from({ length: STORAGE_HISTORY_LIMIT + 10 }, (_, index) => ({ timestamp: index, machineId: 'CNC-01', temperature: 50, vibration: 2, power: 10, production: index, productionDelta: 1, energyKwh: 0.01, status: 'Running' as const } satisfies SensorReading));
    expect(limitReadings(records)).toHaveLength(STORAGE_HISTORY_LIMIT);
    expect(limitReadings(records)[0].timestamp).toBe(10);
  });
});
