import type { PhaseKey } from "@/types";

export interface PhaseSnapshot {
  voltage: number;
  current: number;
  activePower: number;
  powerFactor: number;
  frequency: number;
}

export interface MatlabExportInput {
  utilityName: string;
  generatedAt: Date;
  phases: Record<PhaseKey, PhaseSnapshot>;
}

function loadParams(p: PhaseSnapshot) {
  const apparentPower = p.powerFactor > 0 ? p.activePower / p.powerFactor : p.voltage * p.current;
  const reactivePower = Math.sqrt(Math.max(0, apparentPower ** 2 - p.activePower ** 2));
  const impedance = apparentPower > 0 ? p.voltage ** 2 / apparentPower : 0;
  const resistance = impedance * p.powerFactor;
  const reactance = impedance * Math.sqrt(Math.max(0, 1 - p.powerFactor ** 2));
  const inductanceH = p.frequency > 0 ? reactance / (2 * Math.PI * p.frequency) : 0;
  return { apparentPower, reactivePower, impedance, resistance, reactance, inductanceH };
}

const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];

/**
 * Generates a runnable MATLAB (.m) script that parametrizes a three
 * single-phase Simscape Electrical (Specialized Power Systems) circuit
 * model from this utility's latest measured V/I/P/PF per phase — one AC
 * voltage source + series R-L load per phase, matching the physical 3x
 * PZEM-004T + ESP32 wiring. This is a real, executable MATLAB script (base
 * workspace variables + a bar chart + a printed summary table); it does not
 * fabricate a binary .slx model, since that proprietary format can't be
 * hand-authored reliably. The header comments tell the user exactly which
 * Simscape blocks to drop into a new model and which variables to bind to
 * their parameters.
 */
export function generateMatlabScript(input: MatlabExportInput): string {
  const { utilityName, generatedAt, phases } = input;
  const perPhase = Object.fromEntries(PHASE_KEYS.map((k) => [k, loadParams(phases[k])])) as Record<
    PhaseKey,
    ReturnType<typeof loadParams>
  >;

  const totalP = PHASE_KEYS.reduce((s, k) => s + phases[k].activePower, 0);
  const totalQ = PHASE_KEYS.reduce((s, k) => s + perPhase[k].reactivePower, 0);
  const totalS = Math.sqrt(totalP ** 2 + totalQ ** 2);
  const overallPF = totalS > 0 ? totalP / totalS : 0;

  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`%% SmartGrid Monitor — MATLAB / Simulink export`);
  push(`% Utility: ${utilityName}`);
  push(`% Generated: ${generatedAt.toISOString()}`);
  push(`%`);
  push(`% This script initializes base-workspace variables for a three single-phase`);
  push(`% Simscape Electrical (Specialized Power Systems) circuit model that`);
  push(`% reproduces this utility's measured operating point at export time.`);
  push(`%`);
  push(`% To build the matching Simulink model:`);
  push(`%   1. Run this script first (loads the variables below into the workspace).`);
  push(`%   2. New model > add a "Powergui" block (Discrete, sample time = Ts).`);
  push(`%   3. For each phase {R, Y, B}, add:`);
  push(`%        - "AC Voltage Source"  (Amplitude = V<phase>_peak, Frequency = f_hz, Phase = 0)`);
  push(`%        - "Series RLC Branch"  (R = R_<phase>, L = L_<phase>, C = inf i.e. disabled)`);
  push(`%        - "Voltage Measurement" + "Current Measurement" across the branch`);
  push(`%   4. Add a "Scope" fed by the three current/voltage measurements.`);
  push(`%   5. Set the model solver to a fixed-step discrete solver with Ts below.`);
  push(``);
  push(`clear; clc;`);
  push(``);
  push(`%% Simulation parameters`);
  push(`f_hz = ${phases.R.frequency.toFixed(3)};        % supply frequency, Hz`);
  push(`Ts   = 1 / (f_hz * 200);   % fixed-step solver sample time (200 samples/cycle)`);
  push(``);
  push(`%% Per-phase measured operating point (from live SmartGrid Monitor readings)`);

  for (const key of PHASE_KEYS) {
    const p = phases[key];
    const lp = perPhase[key];
    push(`% --- Phase ${key} ---`);
    push(`V_${key}_rms    = ${p.voltage.toFixed(3)};      % V`);
    push(`V_${key}_peak   = sqrt(2) * V_${key}_rms;`);
    push(`I_${key}_rms    = ${p.current.toFixed(3)};      % A`);
    push(`P_${key}        = ${p.activePower.toFixed(2)};  % W  (active power)`);
    push(`Q_${key}        = ${lp.reactivePower.toFixed(2)};  % VAR (reactive power)`);
    push(`S_${key}        = ${lp.apparentPower.toFixed(2)};  % VA  (apparent power)`);
    push(`PF_${key}       = ${p.powerFactor.toFixed(4)};`);
    push(`R_${key}        = ${lp.resistance.toFixed(4)};   % ohm — series resistance of equivalent load`);
    push(`L_${key}        = ${lp.inductanceH.toFixed(6)};  % H   — series inductance of equivalent load`);
    push(``);
  }

  push(`%% Three-phase totals`);
  push(`P_total  = P_R + P_Y + P_B;                 % W`);
  push(`Q_total  = Q_R + Q_Y + Q_B;                 % VAR`);
  push(`S_total  = sqrt(P_total^2 + Q_total^2);     % VA`);
  push(`PF_total = P_total / S_total;`);
  push(``);
  push(`%% Summary table`);
  push(`fprintf('%s — MATLAB export summary\\n', '${utilityName.replace(/'/g, "''")}');`);
  push(`fprintf('%-8s %10s %10s %10s %8s\\n', 'Phase', 'V (rms)', 'I (rms)', 'P (W)', 'PF');`);
  push(`fprintf('%-8s %10.2f %10.2f %10.2f %8.3f\\n', 'R', V_R_rms, I_R_rms, P_R, PF_R);`);
  push(`fprintf('%-8s %10.2f %10.2f %10.2f %8.3f\\n', 'Y', V_Y_rms, I_Y_rms, P_Y, PF_Y);`);
  push(`fprintf('%-8s %10.2f %10.2f %10.2f %8.3f\\n', 'B', V_B_rms, I_B_rms, P_B, PF_B);`);
  push(`fprintf('%-8s %10s %10s %10.2f %8.3f\\n', 'TOTAL', '-', '-', P_total, PF_total);`);
  push(``);
  push(`%% Load bar chart`);
  push(`figure('Name', 'Per-Phase Active Power');`);
  push(`bar(categorical({'Phase R','Phase Y','Phase B'}), [P_R, P_Y, P_B]);`);
  push(`ylabel('Active Power (W)');`);
  push(`title('${utilityName.replace(/'/g, "''")} — Per-Phase Active Power');`);
  push(`grid on;`);
  push(``);
  push(`% Overall power factor: ${overallPF.toFixed(4)}  |  Total apparent power: ${totalS.toFixed(2)} VA`);

  return lines.join("\n");
}
