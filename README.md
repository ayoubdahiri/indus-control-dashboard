# Indus Control

Indus Control is a responsive SCADA-inspired smart factory supervision dashboard built with React, TypeScript, Vite, Tailwind CSS, Recharts, and Lucide React. It is a front-end-only demonstration: all telemetry, alarms, and production values are synthetic and generated locally.

## Run locally

```bash
npm install
npm run dev
```

Other scripts:

- `npm run build` — type-check and create the production bundle.
- `npm test` — run the simulation and alarm threshold tests.

## Architecture

- `src/types.ts` contains the typed `Machine`, `SensorReading`, `Alarm`, and simulation contracts.
- `src/simulation.ts` is a deterministic simulation engine. It generates bounded readings, applies configured thresholds, de-duplicates open alarms, supports fault injection, and exposes acknowledgement as UI state.
- `src/hooks/useSimulation.ts` owns the two-second update loop, pause/reset controls, thresholds, and simulation actions.
- `src/App.tsx` contains reusable dashboard panels, metric cards, charts, fleet cards, alarm rows, filters, and the selected-machine detail view.

The initial seed is stable for a given timestamp, while each update uses bounded deterministic drift to look realistic. History is capped at 48 readings per machine. Production charts use units produced during each simulation interval, while energy is calculated as `power (kW) × elapsed hours` and displayed in kWh. Temperature, vibration, and power thresholds default to 82°C, 7.5 mm/s, and 94 kW respectively. An alarm is created once per threshold excursion, remains stable after acknowledgement, and can be recreated only after the threshold clears and is exceeded again.

## Simulation assumptions and limitations

This project does not connect to PLCs, industrial networks, sensors, APIs, or physical controls. “Acknowledge” only changes local UI state and does not imply a repair. “Inject fault” is provided for demonstrations and testing. OEE-style efficiency, production targets, energy, and alarms are illustrative values rather than safety, maintenance, or operational guidance.
