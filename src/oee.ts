import type { Machine, OeeMetrics } from './types';

const clamp = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

export function calculateOee(machine: Pick<Machine, 'plannedProductionTimeSeconds' | 'runTimeSeconds' | 'idealCycleTimeSeconds' | 'goodUnits' | 'totalUnits'>): OeeMetrics {
  const planned = Math.max(0, machine.plannedProductionTimeSeconds);
  const runtime = Math.min(planned, Math.max(0, machine.runTimeSeconds));
  const totalUnits = Math.max(0, machine.totalUnits);
  const goodUnits = Math.min(totalUnits, Math.max(0, machine.goodUnits));
  const idealCycle = Math.max(0, machine.idealCycleTimeSeconds);
  const theoreticalProduction = idealCycle > 0 ? runtime / idealCycle : 0;
  const availability = planned > 0 ? runtime / planned : 0;
  const performance = theoreticalProduction > 0 ? totalUnits / theoreticalProduction : 0;
  const quality = totalUnits > 0 ? goodUnits / totalUnits : 0;
  return { availability: clamp(availability), performance: clamp(performance), quality: clamp(quality), oee: clamp(availability) * clamp(performance) * clamp(quality) };
}

export function calculateFleetOee(machines: Machine[]): OeeMetrics {
  if (machines.length === 0) return { availability: 0, performance: 0, quality: 0, oee: 0 };
  const totals = machines.reduce((sum, machine) => ({
    plannedProductionTimeSeconds: sum.plannedProductionTimeSeconds + machine.plannedProductionTimeSeconds,
    runTimeSeconds: sum.runTimeSeconds + machine.runTimeSeconds,
    idealCycleTimeSeconds: 0,
    goodUnits: sum.goodUnits + machine.goodUnits,
    totalUnits: sum.totalUnits + machine.totalUnits,
  }), { plannedProductionTimeSeconds: 0, runTimeSeconds: 0, idealCycleTimeSeconds: 0, goodUnits: 0, totalUnits: 0 });
  const theoretical = machines.reduce((sum, machine) => sum + (Math.max(0, machine.runTimeSeconds) / Math.max(0, machine.idealCycleTimeSeconds)), 0);
  const availability = totals.plannedProductionTimeSeconds > 0 ? totals.runTimeSeconds / totals.plannedProductionTimeSeconds : 0;
  const performance = theoretical > 0 ? totals.totalUnits / theoretical : 0;
  const quality = totals.totalUnits > 0 ? totals.goodUnits / totals.totalUnits : 0;
  const boundedAvailability = clamp(availability);
  const boundedPerformance = clamp(performance);
  const boundedQuality = clamp(quality);
  return { availability: boundedAvailability, performance: boundedPerformance, quality: boundedQuality, oee: boundedAvailability * boundedPerformance * boundedQuality };
}
