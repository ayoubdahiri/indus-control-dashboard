import type { Alarm, Machine, SensorReading, SimulationState, Thresholds } from './types';

export const DEFAULT_THRESHOLDS: Thresholds = { temperature: 82, vibration: 7.5, power: 94 };
export const HISTORY_LIMIT = 48;

const machineSeed: Omit<Machine, 'lastUpdated'>[] = [
  { id: 'CNC-01', name: 'CNC Milling Cell', line: 'Precision Line', status: 'Running', temperature: 64, vibration: 3.2, power: 68, production: 1840, target: 2200 },
  { id: 'ROB-02', name: 'Robotic Assembly Arm', line: 'Assembly Line', status: 'Running', temperature: 58, vibration: 2.4, power: 61, production: 2130, target: 2500 },
  { id: 'PRS-03', name: 'Hydraulic Press', line: 'Forming Line', status: 'Idle', temperature: 47, vibration: 1.8, power: 22, production: 920, target: 1500 },
  { id: 'PKG-04', name: 'Packaging Station', line: 'Finishing Line', status: 'Running', temperature: 52, vibration: 2.1, power: 44, production: 2870, target: 3100 },
  { id: 'WLD-05', name: 'Laser Welding Unit', line: 'Precision Line', status: 'Running', temperature: 71, vibration: 4.7, power: 82, production: 1290, target: 1800 },
  { id: 'INS-06', name: 'Vision Inspection Gate', line: 'Quality Line', status: 'Running', temperature: 43, vibration: 1.1, power: 29, production: 3050, target: 3200 },
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
  })),
  alarms: [],
  tick: 0,
});

const bounded = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const variation = (seed: number, magnitude: number) => (Math.sin(seed * 1.71) + Math.cos(seed * 0.63)) * magnitude;

export function updateSimulation(state: SimulationState, now: number, thresholds: Thresholds = DEFAULT_THRESHOLDS): SimulationState {
  const tick = state.tick + 1;
  const machines = state.machines.map((machine, index) => {
    const drift = variation(tick + index, 1);
    const faultBoost = machine.status === 'Fault' ? 8 : 0;
    const temperature = bounded(machine.temperature + drift * 1.8 + faultBoost, 25, 105);
    const vibration = bounded(machine.vibration + variation(tick + index * 2, 0.12) + (machine.status === 'Fault' ? 1.5 : 0), 0.2, 12);
    const power = bounded(machine.power + variation(tick + index * 3, 2.5) + (machine.status === 'Idle' ? -1 : 0), 8, 115);
    const increment = machine.status === 'Running' ? Math.max(0, Math.round(7 + variation(tick + index, 2))) : 0;
    return { ...machine, temperature, vibration, power, production: machine.production + increment, lastUpdated: now };
  });
  const newReadings: SensorReading[] = machines.map((machine) => ({
    timestamp: now, machineId: machine.id, temperature: machine.temperature, vibration: machine.vibration, power: machine.power, production: machine.production,
  }));
  const readings = [...state.readings, ...newReadings].slice(-HISTORY_LIMIT * machines.length);
  const alarms = [...state.alarms];
  for (const machine of machines) {
    const checks: Array<{ metric: Alarm['metric']; value: number; threshold: number; severity: Alarm['severity']; message: string }> = [
      { metric: 'temperature', value: machine.temperature, threshold: thresholds.temperature, severity: 'Warning', message: 'Temperature above configured limit' },
      { metric: 'vibration', value: machine.vibration, threshold: thresholds.vibration, severity: 'Critical', message: 'Abnormal vibration detected' },
      { metric: 'power', value: machine.power, threshold: thresholds.power, severity: 'Warning', message: 'Power draw above configured limit' },
    ];
    for (const check of checks) {
      const active = check.value > check.threshold;
      const hasOpenAlarm = alarms.some((alarm) => alarm.machineId === machine.id && alarm.metric === check.metric && !alarm.acknowledged);
      if (active && !hasOpenAlarm) {
        alarms.unshift({ id: `${machine.id}-${check.metric}-${now}`, machineId: machine.id, machineName: machine.name, ...check, timestamp: now, acknowledged: false });
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
