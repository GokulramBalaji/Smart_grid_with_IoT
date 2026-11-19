import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { resolveReportRange, type ReportPeriod } from "@/lib/analytics/report";
import { calculateEnergyCostBreakdown, type TariffPlanLike } from "@/lib/analytics/tariff";
import { bucketDemand, computeDemandStats } from "@/lib/analytics/demand";
import { round } from "@/lib/calculations/electrical";

const VALID_PERIODS: ReportPeriod[] = ["daily", "weekly", "monthly", "custom"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const period = (searchParams.get("period") ?? "monthly") as ReportPeriod;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!VALID_PERIODS.includes(period)) {
      return apiError(`Invalid period. Expected one of: ${VALID_PERIODS.join(", ")}`, 400);
    }

    const { node } = await requireOwnedUtilityNode(id);
    if (!node.device) return apiSuccess({ device: null, tariff: null });

    const tariff = await prisma.tariffPlan.findUnique({ where: { utilityNodeId: node.id } });
    if (!tariff) {
      return apiSuccess({ device: { id: node.device.id, name: node.device.name }, tariff: null });
    }

    const range = resolveReportRange(period, from, to);
    const rows = await prisma.sensorReading.findMany({
      where: { deviceId: node.device.id, timestamp: { gte: range.from, lte: range.to } },
      select: { timestamp: true, energyDelta: true, apparentPower: true },
    });

    const totalKwh = round(rows.reduce((sum, r) => sum + r.energyDelta, 0), 3);

    const hourlyKwh = new Array(24).fill(0);
    for (const r of rows) hourlyKwh[r.timestamp.getUTCHours()] += r.energyDelta;

    const demandPoints = bucketDemand(rows.map((r) => ({ timestamp: r.timestamp, apparentPower: r.apparentPower })));
    const demandStats = computeDemandStats(demandPoints, node.contractDemandKva);

    const tariffLike: TariffPlanLike = {
      type: tariff.type,
      currency: tariff.currency,
      flatRate: tariff.flatRate,
      touRates: (tariff.touRates as TariffPlanLike["touRates"]) ?? null,
      slabRates: (tariff.slabRates as TariffPlanLike["slabRates"]) ?? null,
      fixedChargeMonthly: tariff.fixedChargeMonthly,
      demandChargePerKva: tariff.demandChargePerKva,
    };

    const breakdown = calculateEnergyCostBreakdown(
      tariffLike,
      totalKwh,
      demandStats.peakKva,
      hourlyKwh.map((v) => round(v, 4))
    );

    return apiSuccess({
      device: { id: node.device.id, name: node.device.name },
      period: range.label,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      totalKwh,
      hourlyKwh: hourlyKwh.map((v) => round(v, 3)),
      peakKva: demandStats.peakKva,
      tariff: { name: tariff.name, type: tariff.type, currency: tariff.currency },
      breakdown,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
