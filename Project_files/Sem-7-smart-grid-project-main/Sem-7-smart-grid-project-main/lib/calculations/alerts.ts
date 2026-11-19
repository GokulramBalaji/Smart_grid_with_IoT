import type { SystemConfig } from "@prisma/client";
import type { PhaseKey, RawPhaseInput } from "@/types";
import { imbalancePercent, round } from "./electrical";

export interface CandidateAlert {
  type:
    | "HIGH_VOLTAGE"
    | "LOW_VOLTAGE"
    | "OVERCURRENT"
    | "PHASE_IMBALANCE"
    | "POOR_POWER_FACTOR"
    | "FREQUENCY_ABNORMAL";
  severity: "INFO" | "WARNING" | "CRITICAL";
  phase?: PhaseKey;
  message: string;
  value: number;
  threshold: number;
}

const FREQUENCY_MIN = 47.5;
const FREQUENCY_MAX = 52.5;

export function evaluateThresholds(
  phases: Record<PhaseKey, RawPhaseInput>,
  config: Pick<
    SystemConfig,
    "maxVoltage" | "minVoltage" | "maxCurrent" | "maxImbalance" | "minPowerFactor"
  >
): CandidateAlert[] {
  const alerts: CandidateAlert[] = [];
  const keys: PhaseKey[] = ["R", "Y", "B"];

  for (const key of keys) {
    const p = phases[key];

    if (p.voltage > config.maxVoltage) {
      const overPercent = ((p.voltage - config.maxVoltage) / config.maxVoltage) * 100;
      alerts.push({
        type: "HIGH_VOLTAGE",
        severity: overPercent > 8 ? "CRITICAL" : "WARNING",
        phase: key,
        message: `Phase ${key} voltage of ${round(p.voltage)} V exceeds the configured maximum of ${config.maxVoltage} V.`,
        value: p.voltage,
        threshold: config.maxVoltage,
      });
    } else if (p.voltage < config.minVoltage) {
      const underPercent = ((config.minVoltage - p.voltage) / config.minVoltage) * 100;
      alerts.push({
        type: "LOW_VOLTAGE",
        severity: underPercent > 8 ? "CRITICAL" : "WARNING",
        phase: key,
        message: `Phase ${key} voltage of ${round(p.voltage)} V is below the configured minimum of ${config.minVoltage} V.`,
        value: p.voltage,
        threshold: config.minVoltage,
      });
    }

    if (p.current > config.maxCurrent) {
      const overPercent = ((p.current - config.maxCurrent) / config.maxCurrent) * 100;
      alerts.push({
        type: "OVERCURRENT",
        severity: overPercent > 15 ? "CRITICAL" : "WARNING",
        phase: key,
        message: `Phase ${key} current of ${round(p.current)} A exceeds the configured maximum of ${config.maxCurrent} A.`,
        value: p.current,
        threshold: config.maxCurrent,
      });
    }

    if (p.powerFactor < config.minPowerFactor) {
      alerts.push({
        type: "POOR_POWER_FACTOR",
        severity: p.powerFactor < 0.8 ? "WARNING" : "INFO",
        phase: key,
        message: `Phase ${key} power factor of ${p.powerFactor.toFixed(2)} is below the configured minimum of ${config.minPowerFactor}.`,
        value: p.powerFactor,
        threshold: config.minPowerFactor,
      });
    }

    if (p.frequency < FREQUENCY_MIN || p.frequency > FREQUENCY_MAX) {
      alerts.push({
        type: "FREQUENCY_ABNORMAL",
        severity: "CRITICAL",
        phase: key,
        message: `Phase ${key} frequency of ${round(p.frequency)} Hz is outside the normal 47.5-52.5 Hz range.`,
        value: p.frequency,
        threshold: p.frequency < FREQUENCY_MIN ? FREQUENCY_MIN : FREQUENCY_MAX,
      });
    }
  }

  const voltageImbalance = imbalancePercent(keys.map((k) => phases[k].voltage));
  if (voltageImbalance > config.maxImbalance) {
    alerts.push({
      type: "PHASE_IMBALANCE",
      severity: voltageImbalance > config.maxImbalance * 2 ? "CRITICAL" : "WARNING",
      message: `Voltage imbalance of ${voltageImbalance}% exceeds the configured maximum of ${config.maxImbalance}%.`,
      value: voltageImbalance,
      threshold: config.maxImbalance,
    });
  }

  const currentImbalance = imbalancePercent(keys.map((k) => phases[k].current));
  if (currentImbalance > config.maxImbalance) {
    alerts.push({
      type: "PHASE_IMBALANCE",
      severity: currentImbalance > config.maxImbalance * 2 ? "CRITICAL" : "WARNING",
      message: `Current (load) imbalance of ${currentImbalance}% exceeds the configured maximum of ${config.maxImbalance}%.`,
      value: currentImbalance,
      threshold: config.maxImbalance,
    });
  }

  return alerts;
}
