import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestDevice } from "@/lib/session";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { bucketPowerReadings, bucketSizeMs, rangeToMs, type ChartRange } from "@/lib/analytics/bucket";

const VALID_RANGES: ChartRange[] = ["1h", "6h", "24h", "7d", "30d"];

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const range = (req.nextUrl.searchParams.get("range") ?? "24h") as ChartRange;

    if (!VALID_RANGES.includes(range)) {
      return apiError(`Invalid range. Expected one of: ${VALID_RANGES.join(", ")}`, 400);
    }

    const { device } = await resolveRequestDevice(deviceId);
    if (!device) return apiSuccess({ points: [] });

    const since = new Date(Date.now() - rangeToMs(range));
    const rows = await prisma.sensorReading.findMany({
      where: { deviceId: device.id, timestamp: { gte: since } },
      select: { timestamp: true, phase: true, activePower: true, voltage: true, current: true },
      orderBy: { timestamp: "asc" },
    });

    const points = bucketPowerReadings(rows, bucketSizeMs(range));
    return apiSuccess({ points, range });
  } catch (error) {
    return handleApiError(error);
  }
}
