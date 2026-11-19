import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestDevice } from "@/lib/session";
import { buildDashboardSummary } from "@/lib/calculations/dashboard";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const { device } = await resolveRequestDevice(deviceId);

    if (!device) {
      return apiSuccess({ device: null });
    }

    const [latestByPhase, config, todayReadings] = await Promise.all([
      prisma.sensorReading.findMany({
        where: { deviceId: device.id },
        orderBy: [{ phase: "asc" }, { timestamp: "desc" }],
        distinct: ["phase"],
      }),
      prisma.systemConfig.findUnique({ where: { deviceId: device.id } }),
      prisma.sensorReading.findMany({
        where: {
          deviceId: device.id,
          timestamp: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
        },
        select: { energyDelta: true },
      }),
    ]);

    const todayEnergyTotal = todayReadings.reduce((sum, r) => sum + r.energyDelta, 0);
    const resolvedConfig = config ?? (await prisma.systemConfig.create({ data: { deviceId: device.id } }));

    const summary = buildDashboardSummary(device, latestByPhase, resolvedConfig, todayEnergyTotal);

    return apiSuccess(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
