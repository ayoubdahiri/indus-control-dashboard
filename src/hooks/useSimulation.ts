import { useCallback, useEffect, useMemo, useState } from 'react';
import { acknowledgeAlarm, createInitialState, DEFAULT_THRESHOLDS, injectFault, updateSimulation } from '../simulation';
import type { SimulationState, Thresholds } from '../types';

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() => createInitialState());
  const [running, setRunning] = useState(true);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setState((current) => updateSimulation(current, Date.now(), thresholds)), 2000);
    return () => window.clearInterval(interval);
  }, [running, thresholds]);

  const reset = useCallback(() => setState(createInitialState()), []);
  const fault = useCallback((machineId: string) => setState((current) => injectFault(current, machineId, Date.now())), []);
  const acknowledge = useCallback((id: string) => setState((current) => ({ ...current, alarms: acknowledgeAlarm(current.alarms, id) })), []);
  const activeAlarms = useMemo(() => state.alarms.filter((alarm) => !alarm.acknowledged), [state.alarms]);

  return { ...state, running, setRunning, reset, fault, acknowledge, activeAlarms, thresholds, setThresholds };
}
