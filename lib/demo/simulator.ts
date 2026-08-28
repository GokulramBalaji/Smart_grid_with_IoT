import type { PhaseKey, RawPhaseInput } from "@/types";
import { calculateApparentPower, calculateReactivePower, round } from "@/lib/calculations/electrical";

/**
 * Realistic three-phase load simulation for Demo Mode and database seeding.
 * Values are generated from physically consistent base loads rather than
 * pure randomness: voltage wanders slightly around 230V, current follows a
 * diurnal load curve, and power/energy/power-factor are derived from those
 * two rather than sampled independently.
 */

export interface SimulatorOptions {
  /** Hour of day (0-23), drives the diurnal load curve. */
  hour?: number;
  /** Injects a temporary imbalance/spike on one phase, for demoing alerts. */
  forceAnomaly?: "voltage-spike" | "overcurrent" | "imbalance" | null;
  seedOffset?: number;
}

const BASE_VOLTAGE = 230;
const PHASE_BASE_LOAD: Record<PhaseKey, number> = { R: 6, Y: 5.4, B: 6.8 }; // amps at peak

function diurnalFactor(hour: number): number {
  // Two peaks: morning (~8am) and evening (~19-21h), trough overnight.
  const morning = Math.exp(-((hour - 8) ** 2) / 8) * 0.6;
  const evening = Math.exp(-((hour - 20) ** 2) / 10) * 1;
  const base = 0.35;
  return Math.min(1.15, base + morning + evening);
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generatePhaseReading(
  phase: PhaseKey,
  options: SimulatorOptions = {}
): RawPhaseInput {
  const hour = options.hour ?? new Date().getHours();
  const load = diurnalFactor(hour);

  let voltage = BASE_VOLTAGE + randomBetween(-3, 3);
  let current = PHASE_BASE_LOAD[phase] * load * randomBetween(0.9, 1.1);
  const powerFactor = randomBetween(0.88, 0.98);
  const frequency = 50 + randomBetween(-0.15, 0.15);

  if (options.forceAnomaly === "voltage-spike" && phase === "B") {
    voltage += randomBetween(20, 35);
  }
  if (options.forceAnomaly === "overcurrent" && phase === "B") {
    current *= randomBetween(1.6, 2.2);
  }
  if (options.forceAnomaly === "imbalance" && phase === "B") {
    current *= randomBetween(1.3, 1.6);
  }
  if (options.forceAnomaly === "imbalance" && phase === "R") {
    current *= randomBetween(0.5, 0.7);
  }

  const activePower = round(voltage * current * powerFactor, 2);
  const apparentPower = round(calculateApparentPower(voltage, current), 2);
  const reactivePower = round(calculateReactivePower(apparentPower, activePower), 2);

  return {
    voltage: round(voltage, 2),
    current: round(current, 3),
    power: activePower,
    apparentPower,
    reactivePower,
    powerFactor: round(powerFactor, 3),
    frequency: round(frequency, 2),
    energy: 0, // cumulative energy is tracked by the caller (previous + delta)
  };
}

export function generateThreePhaseSnapshot(
  options: SimulatorOptions = {}
): Record<PhaseKey, RawPhaseInput> {
  return {
    R: generatePhaseReading("R", options),
    Y: generatePhaseReading("Y", options),
    B: generatePhaseReading("B", options),
  };
}
