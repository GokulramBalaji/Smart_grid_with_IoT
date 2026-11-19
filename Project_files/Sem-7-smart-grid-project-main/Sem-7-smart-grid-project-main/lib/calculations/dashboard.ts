import type { SensorReading, SystemConfig, Device } from "@prisma/client";
import type { DashboardSummary, PhaseKey, DeviceConnectionStatus } from "@/types";
import {
  average,
  calculateLineToLineVoltages,
  calculateThreePhaseEquivalentVoltage,
  imbalancePercent,
  imbalanceStatus,
  powerFactorStatus,
  round,
  totalActivePower,
} from "./electrical";

const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];
const OFFLINE_THRESHOLD_MS = 90 * 1000;

export function computeConnectionStatus(device: Pick<Device, "lastSeenAt" | "status">): DeviceConnectionStatus {
  if (!device.lastSeenAt) return "provisioning";
  const age = Date.now() - device.lastSeenAt.getTime();
  if (age > OFFLINE_THRESHOLD_MS) return "offline";
  return "online";
}

export function buildDashboardSummary(
  device: Device,
  latestByPhase: SensorReading[],
  config: SystemConfig,
  todayEnergyTotal: number
): DashboardSummary {
  const byPhase = new Map(latestByPhase.map((r) => [r.phase as PhaseKey, r]));

  const phases = Object.fromEntries(
    PHASE_KEYS.map((key) => {
      const r = byPhase.get(key);
      return [
        key,
        {
          voltage: r?.voltage ?? 0,
          current: r?.current ?? 0,
          activePower: r?.activePower ?? 0,
          apparentPower: r?.apparentPower ?? 0,
          reactivePower: r?.reactivePower ?? 0,
          powerFactor: r?.powerFactor ?? 0,
          frequency: r?.frequency ?? 0,
          energy: r?.energy ?? 0,
          isCalculated: r?.isCalculated ?? false,
        },
      ];
    })
  ) as DashboardSummary["phases"];

  const voltages = PHASE_KEYS.map((k) => phases[k].voltage);
  const currents = PHASE_KEYS.map((k) => phases[k].current);
  const powerFactors = PHASE_KEYS.map((k) => phases[k].powerFactor);
  const activePowers = PHASE_KEYS.map((k) => phases[k].activePower);

  const voltageImbalance = imbalancePercent(voltages);
  const currentImbalance = imbalancePercent(currents);

  const lineCalc = calculateLineToLineVoltages(phases.R.voltage, phases.Y.voltage, phases.B.voltage);
  const threePhaseEqVoltage = calculateThreePhaseEquivalentVoltage(
    phases.R.voltage,
    phases.Y.voltage,
    phases.B.voltage
  );

  const latestTimestamp = latestByPhase.length
    ? latestByPhase.reduce((max, r) => (r.timestamp > max ? r.timestamp : max), latestByPhase[0].timestamp)
    : null;

  return {
    device: {
      id: device.id,
      name: device.name,
      status: computeConnectionStatus(device),
      lastSeenAt: device.lastSeenAt ? device.lastSeenAt.toISOString() : null,
      demoMode: device.demoMode,
    },
    totals: {
      avgVoltage: round(average(voltages)),
      threePhaseEquivalentVoltage: threePhaseEqVoltage,
      totalCurrent: round(currents.reduce((a, b) => a + b, 0)),
      totalActivePower: round(totalActivePower(...(activePowers as [number, number, number]))),
      totalEnergyToday: round(todayEnergyTotal, 2),
    },
    phases,
    voltage: {
      avg: round(average(voltages)),
      min: round(Math.min(...voltages)),
      max: round(Math.max(...voltages)),
      threePhaseEquivalent: threePhaseEqVoltage,
      lineToLine: {
        RY: lineCalc.RY,
        YB: lineCalc.YB,
        BR: lineCalc.BR,
      },
      imbalancePercent: voltageImbalance,
      status: imbalanceStatus(voltageImbalance, 5, config.maxImbalance),
    },
    current: {
      avg: round(average(currents)),
      max: round(Math.max(...currents)),
      imbalancePercent: currentImbalance,
      status: imbalanceStatus(currentImbalance, 5, config.maxImbalance),
    },
    powerFactor: {
      avg: round(average(powerFactors), 3),
      status: powerFactorStatus(average(powerFactors)),
      perPhase: Object.fromEntries(PHASE_KEYS.map((k) => [k, phases[k].powerFactor])) as Record<PhaseKey, number>,
    },
    timestamp: latestTimestamp ? latestTimestamp.toISOString() : null,
  };
}
