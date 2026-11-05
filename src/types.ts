export type MachineStatus = 'Running' | 'Idle' | 'Fault';
export type AlarmSeverity = 'Critical' | 'Warning' | 'Info';

export interface Machine {
  id: string;
  name: string;
  line: string;
  status: MachineStatus;
  temperature: number;
  vibration: number;
  power: number;
  production: number;
  target: number;
  lastUpdated: number;
}

export interface SensorReading {
  timestamp: number;
  machineId: string;
  temperature: number;
  vibration: number;
  power: number;
  production: number;
  productionDelta: number;
  energyKwh: number;
}

export interface Alarm {
  id: string;
  machineId: string;
  machineName: string;
  severity: AlarmSeverity;
  message: string;
  metric: 'temperature' | 'vibration' | 'power' | 'status';
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  active: boolean;
  clearedAt?: number;
}

export interface SimulationState {
  machines: Machine[];
  readings: SensorReading[];
  alarms: Alarm[];
  tick: number;
}

export interface Thresholds {
  temperature: number;
  vibration: number;
  power: number;
}
