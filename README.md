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
- `src/history.ts` persists at most 288 sensor readings in browser `localStorage`; the History section can clear that retained history or export filtered records as a UTF-8 BOM CSV.
- `src/csv.ts` produces escaped CSV rows from actual simulation readings, including machine identity, status, units, and ISO timestamps.
- `src/oee.ts` calculates bounded simulated OEE metrics for the fleet.
- `src/App.tsx` contains reusable dashboard panels, metric cards, charts, fleet cards, alarm rows, filters, and the selected-machine detail view.

The initial seed is stable for a given timestamp, while each update uses bounded deterministic drift to look realistic. In-memory history is capped at 48 readings per machine and browser storage is capped at 288 readings total. Production charts use units produced during each simulation interval, while energy is calculated as `power (kW) × elapsed hours` and displayed in kWh. Temperature, vibration, and power thresholds default to 82°C, 7.5 mm/s, and 94 kW respectively. An alarm is created once per threshold excursion, remains stable after acknowledgement, and can be recreated only after the threshold clears and is exceeded again.

## Simulated OEE / TRS

The OEE section is explicitly labelled **SIMULATED OEE** and is not a measured real-world KPI. Each machine has local counters for an 8-hour planned production window, simulated runtime, ideal cycle time, total units, and good units. The dashboard calculates:

- Availability = runtime / planned production time.
- Performance = total units / (runtime / ideal cycle time).
- Quality = good units / total units.
- OEE = Availability × Performance × Quality.

Counters are clamped to safe ranges and zero denominators return zero. Fault injection changes telemetry and state for demonstration only; it does not connect to or control physical equipment.

## History and export

The History section lets an operator select a machine and measurement (temperature, vibration, power, or cumulative production count), inspect timestamped records with seconds, clear local retained history, and export the selected machine or all retained records. CSV exports use real simulation readings, a clear unit-bearing header, RFC-style quote escaping, CRLF rows, and a UTF-8 BOM for spreadsheet compatibility. All data remains local and synthetic.

## Simulation assumptions and limitations

This project does not connect to PLCs, industrial networks, sensors, APIs, or physical controls. “Acknowledge” only changes local UI state and does not imply a repair. “Inject fault” is provided for demonstrations and testing. OEE-style efficiency, production targets, energy, and alarms are illustrative values rather than safety, maintenance, or operational guidance.
