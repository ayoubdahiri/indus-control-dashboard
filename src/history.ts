import type { SensorReading } from './types';

export const HISTORY_STORAGE_KEY = 'indus-control-history-v2';
export const STORAGE_HISTORY_LIMIT = 288;

export function limitReadings(readings: SensorReading[]): SensorReading[] {
  return readings.slice(-STORAGE_HISTORY_LIMIT);
}

export function loadStoredReadings(fallback: SensorReading[]): SensorReading[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return fallback;
    const valid = parsed.filter((reading): reading is SensorReading => typeof reading === 'object' && reading !== null && typeof (reading as SensorReading).timestamp === 'number' && typeof (reading as SensorReading).machineId === 'string' && typeof (reading as SensorReading).temperature === 'number' && typeof (reading as SensorReading).status === 'string');
    return limitReadings(valid);
  } catch {
    return fallback;
  }
}

export function persistReadings(readings: SensorReading[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitReadings(readings)));
  } catch {
    // Browser storage is optional; the in-memory simulation remains usable.
  }
}
