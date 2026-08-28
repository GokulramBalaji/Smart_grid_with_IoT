import type { ImbalanceStatus, PowerFactorStatus } from "@/types";

/**
 * Core electrical-engineering derived calculations shared by the ingestion
 * pipeline, dashboard APIs, analytics, and reports. Kept dependency-free and
 * pure so the same logic runs identically on the server and in tests.
 */

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Apparent power S = V x I (VA). Only used when the sensor does not report it directly. */
export function calculateApparentPower(voltage: number, current: number): number {
  return voltage * current;
}

/**
 * Reactive power Q = sqrt(S^2 - P^2) (VAR), valid only when S >= P.
 * Returns 0 when the inputs are not physically consistent (measurement noise).
 */
export function calculateReactivePower(apparentPower: number, activePower: number): number {
  const diff = apparentPower ** 2 - activePower ** 2;
  return diff > 0 ? Math.sqrt(diff) : 0;
}

/** Total three-phase active power: Ptotal = PR + PY + PB */
export function totalActivePower(pR: number, pY: number, pB: number): number {
  return pR + pY + pB;
}

/**
 * Percentage imbalance relative to the average of a 3-phase quantity:
 * max(|x - avg|) / avg * 100
 */
export function imbalancePercent(values: number[]): number {
  const avg = average(values);
  if (avg === 0) return 0;
  const maxDeviation = Math.max(...values.map((v) => Math.abs(v - avg)));
  return round((maxDeviation / avg) * 100);
}

export function imbalanceStatus(percent: number, warningAt = 5, criticalAt: number = 10): ImbalanceStatus {
  if (percent >= criticalAt) return "critical";
  if (percent >= warningAt) return "warning";
  return "normal";
}

export function powerFactorStatus(pf: number): PowerFactorStatus {
  if (pf >= 0.95) return "excellent";
  if (pf >= 0.9) return "good";
  if (pf >= 0.8) return "warning";
  return "poor";
}

export function powerFactorRecommendation(pf: number): string | null {
  if (pf >= 0.9) return null;
  if (pf >= 0.8) {
    return "Power factor is below optimal. Consider inspecting inductive loads (motors, transformers) and adding local capacitor correction.";
  }
  return "Power factor is poor and likely incurring utility penalties. Install power factor correction capacitors and audit connected inductive loads.";
}

/**
 * Energy delta between two cumulative meter readings (kWh), guarding against
 * double-counting and meter resets/rollovers. If the new cumulative value is
 * lower than the previous one, the meter was reset — the new reading is
 * treated as the delta instead of a negative number.
 */
export function energyDelta(previousCumulative: number | null, newCumulative: number): number {
  if (previousCumulative === null) return 0;
  if (newCumulative < previousCumulative) return round(newCumulative, 4);
  return round(newCumulative - previousCumulative, 4);
}

export interface PhaseTriplet {
  R: number;
  Y: number;
  B: number;
}

export function mostAndLeastLoadedPhase(power: PhaseTriplet): {
  most: keyof PhaseTriplet;
  least: keyof PhaseTriplet;
} {
  const entries = Object.entries(power) as [keyof PhaseTriplet, number][];
  const most = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const least = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
  return { most: most[0], least: least[0] };
}

export function loadDistributionPercent(power: PhaseTriplet): PhaseTriplet {
  const total = power.R + power.Y + power.B;
  if (total === 0) return { R: 0, Y: 0, B: 0 };
  return {
    R: round((power.R / total) * 100),
    Y: round((power.Y / total) * 100),
    B: round((power.B / total) * 100),
  };
}
