import type { Machine, SensorReading } from './types';

const escapeCsv = (value: string | number) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function readingsToCsv(readings: SensorReading[], machines: Machine[]): string {
  const machinesById = new Map(machines.map((machine) => [machine.id, machine]));
  const header = ['Timestamp (ISO)', 'Machine ID', 'Machine Name', 'Status', 'Temperature (°C)', 'Vibration (mm/s)', 'Power (kW)', 'Production Count (units)'];
  const rows = readings.map((reading) => {
    const machine = machinesById.get(reading.machineId);
    return [new Date(reading.timestamp).toISOString(), reading.machineId, machine?.name ?? 'Unknown machine', reading.status, reading.temperature.toFixed(2), reading.vibration.toFixed(2), reading.power.toFixed(2), reading.production.toString()];
  });
  return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n')}\r\n`;
}
