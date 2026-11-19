import { prisma } from "@/lib/prisma";
import { round, imbalancePercent } from "@/lib/calculations/electrical";
import type { PhaseKey } from "@/types";

export type ReportPeriod = "daily" | "weekly" | "monthly" | "custom";

export function resolveReportRange(period: ReportPeriod, from?: string | null, to?: string | null) {
  const now = new Date();
  if (period === "custom" && from && to) {
    return { from: new Date(from), to: new Date(to), label: "Custom Range" };
  }
  const to_ = now;
  if (period === "weekly") {
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: to_, label: "Last 7 Days" };
  }
  if (period === "monthly") {
    return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: to_, label: "Last 30 Days" };
  }
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  return { from: dayStart, to: to_, label: "Today" };
}

export interface ReportSummary {
  deviceId: string;
  deviceName: string;
  period: string;
  from: string;
  to: string;
  totalEnergy: number;
  phaseEnergy: Record<PhaseKey, number>;
  maxVoltage: number;
  minVoltage: number;
  maxCurrent: number;
  peakPower: number;
  avgPowerFactor: number;
  alertCount: number;
  criticalAlertCount: number;
  loadImbalancePercent: number;
}

export async function buildReportSummary(
  deviceId: string,
  deviceName: string,
  range: { from: Date; to: Date; label: string }
): Promise<ReportSummary> {
  const [readings, alertCount, criticalAlertCount] = await Promise.all([
    prisma.sensorReading.findMany({
      where: { deviceId, timestamp: { gte: range.from, lte: range.to } },
      select: { phase: true, voltage: true, current: true, activePower: true, powerFactor: true, energyDelta: true },
    }),
    prisma.alert.count({ where: { deviceId, timestamp: { gte: range.from, lte: range.to } } }),
    prisma.alert.count({ where: { deviceId, timestamp: { gte: range.from, lte: range.to }, severity: "CRITICAL" } }),
  ]);

  const phaseEnergy: Record<PhaseKey, number> = { R: 0, Y: 0, B: 0 };
  const currentByPhase: Record<PhaseKey, number[]> = { R: [], Y: [], B: [] };
  let maxVoltage = -Infinity;
  let minVoltage = Infinity;
  let maxCurrent = 0;
  let peakPower = 0;
  const powerFactors: number[] = [];

  for (const r of readings) {
    const phase = r.phase as PhaseKey;
    phaseEnergy[phase] += r.energyDelta;
    currentByPhase[phase].push(r.current);
    maxVoltage = Math.max(maxVoltage, r.voltage);
    minVoltage = Math.min(minVoltage, r.voltage);
    maxCurrent = Math.max(maxCurrent, r.current);
    peakPower = Math.max(peakPower, r.activePower);
    powerFactors.push(r.powerFactor);
  }

  const avgCurrentByPhase = (["R", "Y", "B"] as PhaseKey[]).map((k) => {
    const arr = currentByPhase[k];
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  });

  return {
    deviceId,
    deviceName,
    period: range.label,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    totalEnergy: round(phaseEnergy.R + phaseEnergy.Y + phaseEnergy.B, 3),
    phaseEnergy: {
      R: round(phaseEnergy.R, 3),
      Y: round(phaseEnergy.Y, 3),
      B: round(phaseEnergy.B, 3),
    },
    maxVoltage: readings.length ? round(maxVoltage, 2) : 0,
    minVoltage: readings.length ? round(minVoltage, 2) : 0,
    maxCurrent: round(maxCurrent, 2),
    peakPower: round(peakPower, 2),
    avgPowerFactor: powerFactors.length ? round(powerFactors.reduce((a, b) => a + b, 0) / powerFactors.length, 3) : 0,
    alertCount,
    criticalAlertCount,
    loadImbalancePercent: imbalancePercent(avgCurrentByPhase),
  };
}
