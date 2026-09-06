import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { rangeToMs, type ChartRange } from "@/lib/analytics/bucket";
import { round } from "@/lib/calculations/electrical";
import type { PhaseKey } from "@/types";

const VALID_RANGES: ChartRange[] = ["1h", "6h", "24h", "7d", "30d"];
const NOMINAL_FREQUENCY = 50;
const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];

interface PhaseSeries {
  timestamp: string;
  voltage: number;
  current: number;
  frequency: number;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const range = (req.nextUrl.searchParams.get("range") ?? "24h") as ChartRange;
    if (!VALID_RANGES.includes(range)) {
      return apiError(`Invalid range. Expected one of: ${VALID_RANGES.join(", ")}`, 400);
    }

    const { node } = await requireOwnedUtilityNode(id);
    if (!node.device) return apiSuccess({ device: null });

    const config = await prisma.systemConfig.findUnique({ where: { deviceId: node.device.id } });
    const maxVoltage = config?.maxVoltage ?? 250;
    const minVoltage = config?.minVoltage ?? 200;
    const maxCurrent = config?.maxCurrent ?? 32;

    const since = new Date(Date.now() - rangeToMs(range));
    const rows = await prisma.sensorReading.findMany({
      where: { deviceId: node.device.id, timestamp: { gte: since } },
      select: { timestamp: true, phase: true, voltage: true, current: true, frequency: true },
      orderBy: { timestamp: "asc" },
    });

    const series: Record<PhaseKey, PhaseSeries[]> = { R: [], Y: [], B: [] };
    const stats: Record<
      PhaseKey,
      {
        minVoltage: number;
        maxVoltage: number;
        avgVoltage: number;
        overVoltageEvents: number;
        underVoltageEvents: number;
        minCurrent: number;
        maxCurrent: number;
        avgCurrent: number;
        overCurrentEvents: number;
        minFrequency: number;
        maxFrequency: number;
        maxFrequencyDeviation: number;
        frequencyOutOfBandEvents: number;
      }
    > = {} as never;

    for (const phase of PHASE_KEYS) {
      const phaseRows = rows.filter((r) => r.phase === phase);
      for (const r of phaseRows) {
        series[phase].push({
          timestamp: r.timestamp.toISOString(),
          voltage: round(r.voltage, 2),
          current: round(r.current, 3),
          frequency: round(r.frequency, 3),
        });
      }

      const voltages = phaseRows.map((r) => r.voltage);
      const currents = phaseRows.map((r) => r.current);
      const frequencies = phaseRows.map((r) => r.frequency);

      stats[phase] = {
        minVoltage: voltages.length ? round(Math.min(...voltages), 2) : 0,
        maxVoltage: voltages.length ? round(Math.max(...voltages), 2) : 0,
        avgVoltage: voltages.length ? round(voltages.reduce((a, b) => a + b, 0) / voltages.length, 2) : 0,
        overVoltageEvents: voltages.filter((v) => v > maxVoltage).length,
        underVoltageEvents: voltages.filter((v) => v < minVoltage).length,
        minCurrent: currents.length ? round(Math.min(...currents), 3) : 0,
        maxCurrent: currents.length ? round(Math.max(...currents), 3) : 0,
        avgCurrent: currents.length ? round(currents.reduce((a, b) => a + b, 0) / currents.length, 3) : 0,
        overCurrentEvents: currents.filter((i) => i > maxCurrent).length,
        minFrequency: frequencies.length ? round(Math.min(...frequencies), 3) : 0,
        maxFrequency: frequencies.length ? round(Math.max(...frequencies), 3) : 0,
        maxFrequencyDeviation: frequencies.length
          ? round(Math.max(...frequencies.map((f) => Math.abs(f - NOMINAL_FREQUENCY))), 3)
          : 0,
        frequencyOutOfBandEvents: frequencies.filter((f) => Math.abs(f - NOMINAL_FREQUENCY) > 2.5).length,
      };
    }

    return apiSuccess({
      device: { id: node.device.id, name: node.device.name },
      range,
      thresholds: { maxVoltage, minVoltage, maxCurrent, nominalFrequency: NOMINAL_FREQUENCY },
      series,
      stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
