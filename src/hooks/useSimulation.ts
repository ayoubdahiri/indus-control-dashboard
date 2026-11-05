import { useCallback, useEffect, useMemo, useState } from 'react';
import { acknowledgeAlarm, createInitialState, DEFAULT_THRESHOLDS, injectFault, updateSimulation } from '../simulation';
import { loadStoredReadings, persistReadings } from '../history';
import type { SimulationState, Thresholds } from '../types';

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() => {
    const initial = createInitialState();
    return { ...initial, readings: loadStoredReadings(initial.readings) };
  });
  const [running, setRunning] = useState(true);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setState((current) => updateSimulation(current, Date.now(), thresholds)), 2000);
    return () => window.clearInterval(interval);
  }, [running, thresholds]);
  useEffect(() => {
    persistReadings(state.readings);
  }, [state.readings]);

  const reset = useCallback(() => setState(createInitialState()), []);
  const clearHistory = useCallback(() => setState((current) => {
    const latestByMachine = [...new Map(current.readings.map((reading) => [reading.machineId, reading])).values()]
      .map((reading) => ({ ...reading, productionDelta: 0, energyKwh: 0 }));
    return { ...current, readings: latestByMachine };
  }), []);
  const fault = useCallback((machineId: string) => setState((current) => injectFault(current, machineId, Date.now())), []);
  const acknowledge = useCallback((id: string) => setState((current) => ({ ...current, alarms: acknowledgeAlarm(current.alarms, id) })), []);
  const activeAlarms = useMemo(() => state.alarms.filter((alarm) => alarm.active && !alarm.acknowledged), [state.alarms]);

  return { ...state, running, setRunning, reset, clearHistory, fault, acknowledge, activeAlarms, thresholds, setThresholds };
}
