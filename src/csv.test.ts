import { describe, expect, it } from 'vitest';
import { readingsToCsv } from './csv';
import type { Machine, SensorReading } from './types';

const machine: Machine = {
  id: 'TEST-01', name: 'Cell, "Alpha"', line: 'Test', status: 'Running', temperature: 50, vibration: 2, power: 10, production: 42, target: 50,
  plannedProductionTimeSeconds: 100, runTimeSeconds: 80, idealCycleTimeSeconds: 2, goodUnits: 40, totalUnits: 42, lastUpdated: 0,
};
const reading: SensorReading = {
  timestamp: Date.UTC(2026, 0, 2, 3, 4, 5), machineId: machine.id, temperature: 50, vibration: 2, power: 10, production: 42, productionDelta: 2, energyKwh: 0.01, status: 'Running',
};

describe('CSV export', () => {
  it('writes an Excel-compatible BOM, headers with units, escaped values, and real readings', () => {
    const csv = readingsToCsv([reading], [machine]);
    expect(csv.startsWith('\uFEFFTimestamp (ISO),Machine ID')).toBe(true);
    expect(csv).toContain('"Cell, ""Alpha"""');
    expect(csv).toContain('Temperature (°C)');
    expect(csv).toContain('2026-01-02T03:04:05.000Z');
    expect(csv.split('\r\n')).toHaveLength(3);
  });
});
