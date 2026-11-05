import type { Alarm, Machine, SensorReading, SimulationState, Thresholds } from './types';

export const DEFAULT_THRESHOLDS: Thresholds = { temperature: 82, vibration: 7.5, power: 94 };
export const HISTORY_LIMIT = 48;

const machineSeed: Omit<Machine, 'lastUpdated'>[] = [
  { id: 'CNC-01', name: 'CNC Milling Cell', line: 'Precision Line', status: 'Running', temperature: 64, vibration: 3.2, power: 68, production: 1840, target: 2200, plannedProductionTimeSeconds: 28800, runTimeSeconds: 21600, idealCycleTimeSeconds: 8, goodUnits: 1803, totalUnits: 1840 },
  { id: 'ROB-02', name: 'Robotic Assembly Arm', line: 'Assembly Line', status: 'Running', temperature: 58, vibration: 2.4, power: 61, production: 2130, target: 2500, plannedProductionTimeSeconds: 28800, runTimeSeconds: 23400, idealCycleTimeSeconds: 7, goodUnits: 2087, totalUnits: 2130 },
  { id: 'PRS-03', name: 'Hydraulic Press', line: 'Forming Line', status: 'Idle', temperature: 47, vibration: 1.8, power: 22, production: 920, target: 1500, plannedProductionTimeSeconds: 28800, runTimeSeconds: 14400, idealCycleTimeSeconds: 10, goodUnits: 902, totalUnits: 920 },
  { id: 'PKG-04', name: 'Packaging Station', line: 'Finishing Line', status: 'Running', temperature: 52, vibration: 2.1, power: 44, production: 2870, target: 3100, plannedProductionTimeSeconds: 28800, runTimeSeconds: 25200, idealCycleTimeSeconds: 5, goodUnits: 2813, totalUnits: 2870 },
  { id: 'WLD-05', name: 'Laser Welding Unit', line: 'Precision Line', status: 'Running', temperature: 71, vibration: 4.7, power: 82, production: 1290, target: 1800, plannedProductionTimeSeconds: 28800, runTimeSeconds: 19800, idealCycleTimeSeconds: 12, goodUnits: 1251, totalUnits: 1290 },
  { id: 'INS-06', name: 'Vision Inspection Gate', line: 'Quality Line', status: 'Running', temperature: 43, vibration: 1.1, power: 29, production: 3050, target: 3200, plannedProductionTimeSeconds: 28800, runTimeSeconds: 27000, idealCycleTimeSeconds: 4, goodUnits: 2990, totalUnits: 3050 },
];

export const initialMachines = (now = Date.now()): Machine[] =>
  machineSeed.map((machine) => ({ ...machine, lastUpdated: now }));

export const createInitialState = (now = Date.now()): SimulationState => ({
  machines: initialMachines(now),
  readings: initialMachines(now).map((machine) => ({
    timestamp: now,
    machineId: machine.id,
    temperature: machine.temperature,
    vibration: machine.vibration,
    power: machine.power,
    production: machine.production,
    productionDelta: 0,
    energyKwh: 0,
    status: machine.status,
  })),
  alarms: [],
  tick: 0,
});

const bounded = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const variation = (seed: number, magnitude: number) => (Math.sin(seed * 1.71) + Math.cos(seed * 0.63)) * magnitude;

export function updateSimulation(state: SimulationState, now: number, thresholds: Thresholds = DEFAULT_THRESHOLDS): SimulationState {
  const tick = state.tick + 1;
  const previousReadings = new Map(state.readings.filter((reading) => reading.timestamp === state.readings[state.readings.length - 1]?.timestamp).map((reading) => [reading.machineId, reading]));
  const elapsedHours = Math.max(0, (now - (state.readings[state.readings.length - 1]?.timestamp ?? now)) / 3_600_000);
  const machines = state.machines.map((machine, index) => {
    const drift = variation(tick + index, 1);
    const faultBoost = machine.status === 'Fault' ? 8 : 0;
    const temperature = bounded(machine.temperature + drift * 1.8 + faultBoost, 25, 105);
    const vibration = bounded(machine.vibration + variation(tick + index * 2, 0.12) + (machine.status === 'Fault' ? 1.5 : 0), 0.2, 12);
    const power = bounded(machine.power + variation(tick + index * 3, 2.5) + (machine.status === 'Idle' ? -1 : 0), 8, 115);
    const increment = machine.status === 'Running' ? Math.max(0, Math.round(7 + variation(tick + index, 2))) : 0;
    const elapsedSeconds = Math.max(0, (now - machine.lastUpdated) / 1000);
    const runTimeSeconds = bounded(machine.runTimeSeconds + (machine.status === 'Running' ? elapsedSeconds : 0), 0, machine.plannedProductionTimeSeconds);
    const rejectedUnits = increment > 0 && (tick + index) % 17 === 0 ? 1 : 0;
    return { ...machine, temperature, vibration, power, production: machine.production + increment, totalUnits: machine.totalUnits + increment, goodUnits: machine.goodUnits + increment - rejectedUnits, runTimeSeconds, lastUpdated: now };
  });
  const newReadings: SensorReading[] = machines.map((machine) => ({
    timestamp: now,
    machineId: machine.id,
    temperature: machine.temperature,
    vibration: machine.vibration,
    power: machine.power,
    production: machine.production,
    productionDelta: Math.max(0, machine.production - (previousReadings.get(machine.id)?.production ?? machine.production)),
    energyKwh: machine.power * elapsedHours,
    status: machine.status,
  }));
  const readings = [...state.readings, ...newReadings].slice(-HISTORY_LIMIT * machines.length);
  const alarms = state.alarms.map((alarm) => {
    const machine = machines.find((item) => item.id === alarm.machineId);
    if (!machine || !alarm.active) return alarm;
    const metric = alarm.metric === 'status' ? 'temperature' : alarm.metric;
    const currentValue = machine[metric];
    const currentThreshold = thresholds[metric];
    if (currentValue <= currentThreshold) return { ...alarm, active: false, clearedAt: now };
    return alarm;
  });
  for (const machine of machines) {
    const checks: Array<{ metric: Alarm['metric']; value: number; threshold: number; severity: Alarm['severity']; message: string }> = [
      { metric: 'temperature', value: machine.temperature, threshold: thresholds.temperature, severity: 'Warning', message: 'Temperature above configured limit' },
      { metric: 'vibration', value: machine.vibration, threshold: thresholds.vibration, severity: 'Critical', message: 'Abnormal vibration detected' },
      { metric: 'power', value: machine.power, threshold: thresholds.power, severity: 'Warning', message: 'Power draw above configured limit' },
    ];
    for (const check of checks) {
      const active = check.value > check.threshold;
      const hasOpenAlarm = alarms.some((alarm) => alarm.machineId === machine.id && alarm.metric === check.metric && alarm.active);
      if (active && !hasOpenAlarm) {
        alarms.unshift({ id: `${machine.id}-${check.metric}-${now}`, machineId: machine.id, machineName: machine.name, ...check, timestamp: now, acknowledged: false, active: true });
      }
    }
  }
  return { machines, readings, alarms: alarms.slice(0, 40), tick };
}

export function injectFault(state: SimulationState, machineId: string, now: number): SimulationState {
  return {
    ...state,
    machines: state.machines.map((machine) => machine.id === machineId ? { ...machine, status: 'Fault', temperature: Math.max(machine.temperature, 91), vibration: Math.max(machine.vibration, 8.8), lastUpdated: now } : machine),
  };
}

export function acknowledgeAlarm(alarms: Alarm[], id: string): Alarm[] {
  return alarms.map((alarm) => alarm.id === id ? { ...alarm, acknowledged: true } : alarm);
}
