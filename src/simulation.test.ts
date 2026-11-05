import { describe, expect, it } from 'vitest';
import { createInitialState, DEFAULT_THRESHOLDS, HISTORY_LIMIT, injectFault, updateSimulation } from './simulation';

describe('simulation engine', () => {
  it('starts with deterministic machine telemetry', () => {
    const first = createInitialState(1000);
    const second = createInitialState(1000);
    expect(first.machines).toEqual(second.machines);
    expect(first.machines).toHaveLength(6);
  });

  it('keeps history bounded while updating readings', () => {
    let state = createInitialState(1000);
    for (let tick = 1; tick < 100; tick += 1) state = updateSimulation(state, 1000 + tick * 2000);
    expect(state.readings.length).toBeLessThanOrEqual(HISTORY_LIMIT * state.machines.length);
  });

  it('does not duplicate an open alarm for the same threshold', () => {
    let state = injectFault(createInitialState(1000), 'CNC-01', 1000);
    state = updateSimulation(state, 3000, { ...DEFAULT_THRESHOLDS, temperature: 50, vibration: 1 });
    const updated = updateSimulation(state, 5000, { ...DEFAULT_THRESHOLDS, temperature: 50, vibration: 1 });
    const alarms = updated.alarms.filter((alarm) => alarm.machineId === 'CNC-01' && alarm.metric === 'temperature');
    expect(alarms).toHaveLength(1);
  });

  it('raises a fault machine above critical sensor thresholds', () => {
    const state = injectFault(createInitialState(1000), 'ROB-02', 1000);
    const machine = state.machines.find((item) => item.id === 'ROB-02');
    expect(machine?.status).toBe('Fault');
    expect(machine?.temperature).toBeGreaterThan(DEFAULT_THRESHOLDS.temperature);
  });
});
