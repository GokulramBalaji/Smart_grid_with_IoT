import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { bucketPowerReadings, bucketSizeMs, rangeToMs, type ChartRange } from "@/lib/analytics/bucket";
import { bucketDemand, computeDemandStats } from "@/lib/analytics/demand";
import { round } from "@/lib/calculations/electrical";

const VALID_RANGES: ChartRange[] = ["1h", "6h", "24h", "7d", "30d"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const range = (req.nextUrl.searchParams.get("range") ?? "24h") as ChartRange;
    if (!VALID_RANGES.includes(range)) {
      return apiError(`Invalid range. Expected one of: ${VALID_RANGES.join(", ")}`, 400);
    }

    const { node } = await requireOwnedUtilityNode(id);
    if (!node.device) return apiSuccess({ device: null });

    const since = new Date(Date.now() - rangeToMs(range));
    const rows = await prisma.sensorReading.findMany({
      where: { deviceId: node.device.id, timestamp: { gte: since } },
      select: { timestamp: true, phase: true, activePower: true, apparentPower: true },
      orderBy: { timestamp: "asc" },
    });

    const loadCurve = bucketPowerReadings(rows, bucketSizeMs(range));

    // Load duration curve: total power at each timestamp, sorted descending,
    // plotted against the % of the period that power level was equalled or
    // exceeded — the standard way utilities visualize how "peaky" a load is.
    const sortedTotals = loadCurve.map((p) => p.total).sort((a, b) => b - a);
    const durationCurve = sortedTotals.map((power, i) => ({
      percentOfTime: round(((i + 1) / sortedTotals.length) * 100, 2),
      power: round(power, 1),
    }));

    const demandPoints = bucketDemand(rows.map((r) => ({ timestamp: r.timestamp, apparentPower: r.apparentPower })));
    const demandStats = computeDemandStats(demandPoints, node.contractDemandKva);

    return apiSuccess({
      device: { id: node.device.id, name: node.device.name },
      range,
      loadCurve,
      durationCurve,
      demandPoints,
      demandStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
