import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { imbalancePercent, round } from "@/lib/calculations/electrical";
import { bucketDemand, computeDemandStats } from "@/lib/analytics/demand";
import { buildEfficiencyTrend, buildRecommendations, type DailyEfficiencyInput } from "@/lib/analytics/efficiency";
import type { PhaseKey } from "@/types";

const DAYS = 30;
const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { node } = await requireOwnedUtilityNode(id);
    if (!node.device) return apiSuccess({ device: null });

    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    const rows = await prisma.sensorReading.findMany({
      where: { deviceId: node.device.id, timestamp: { gte: since } },
      select: { timestamp: true, phase: true, voltage: true, current: true, powerFactor: true, apparentPower: true },
      orderBy: { timestamp: "asc" },
    });

    // Group by exact timestamp (all 3 phases share one) to compute per-sample
    // imbalance, then aggregate those samples into daily figures.
    const byTimestamp = new Map<number, { voltage: Partial<Record<PhaseKey, number>>; current: Partial<Record<PhaseKey, number>>; pf: number[] }>();
    for (const r of rows) {
      const key = r.timestamp.getTime();
      if (!byTimestamp.has(key)) byTimestamp.set(key, { voltage: {}, current: {}, pf: [] });
      const bucket = byTimestamp.get(key)!;
      bucket.voltage[r.phase as PhaseKey] = r.voltage;
      bucket.current[r.phase as PhaseKey] = r.current;
      bucket.pf.push(r.powerFactor);
    }

    const byDay = new Map<string, { pf: number[]; vImbalance: number[]; iImbalance: number[] }>();
    for (const [ts, sample] of byTimestamp) {
      const dayKey = new Date(ts).toISOString().slice(0, 10);
      if (!byDay.has(dayKey)) byDay.set(dayKey, { pf: [], vImbalance: [], iImbalance: [] });
      const bucket = byDay.get(dayKey)!;
      const voltages = PHASE_KEYS.map((k) => sample.voltage[k]).filter((v): v is number => v !== undefined);
      const currents = PHASE_KEYS.map((k) => sample.current[k]).filter((v): v is number => v !== undefined);
      if (voltages.length === 3) bucket.vImbalance.push(imbalancePercent(voltages));
      if (currents.length === 3) bucket.iImbalance.push(imbalancePercent(currents));
      bucket.pf.push(...sample.pf);
    }

    const dailyInputs: DailyEfficiencyInput[] = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({
        date,
        avgPowerFactor: bucket.pf.length ? round(bucket.pf.reduce((a, b) => a + b, 0) / bucket.pf.length, 3) : 0,
        voltageImbalance: bucket.vImbalance.length
          ? round(bucket.vImbalance.reduce((a, b) => a + b, 0) / bucket.vImbalance.length, 2)
          : 0,
        currentImbalance: bucket.iImbalance.length
          ? round(bucket.iImbalance.reduce((a, b) => a + b, 0) / bucket.iImbalance.length, 2)
          : 0,
      }));

    const trend = buildEfficiencyTrend(dailyInputs);

    const demandPoints = bucketDemand(rows.map((r) => ({ timestamp: r.timestamp, apparentPower: r.apparentPower })));
    const demandStats = computeDemandStats(demandPoints, node.contractDemandKva);

    const recentPf = dailyInputs.slice(-7);
    const avgPowerFactor = recentPf.length
      ? round(recentPf.reduce((s, d) => s + d.avgPowerFactor, 0) / recentPf.length, 3)
      : 0;
    const recentCurrentImbalance = recentPf.length
      ? round(recentPf.reduce((s, d) => s + d.currentImbalance, 0) / recentPf.length, 2)
      : 0;

    const recommendations = buildRecommendations({
      demand: demandStats,
      avgPowerFactor,
      currentImbalancePercent: recentCurrentImbalance,
      trend,
    });

    return apiSuccess({
      device: { id: node.device.id, name: node.device.name },
      trend,
      demandStats,
      recommendations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
