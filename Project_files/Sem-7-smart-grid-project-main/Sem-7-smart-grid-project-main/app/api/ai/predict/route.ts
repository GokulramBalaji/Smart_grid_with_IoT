import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestDevice } from "@/lib/session";
import { buildDashboardSummary } from "@/lib/calculations/dashboard";
import { runAIPredictionPipeline } from "@/lib/ai/predictor";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const { device } = await resolveRequestDevice(deviceId);

    if (!device) {
      return apiError("No device found or unauthorized", 404);
    }

    // Fetch latest readings per phase
    const [latestByPhase, config, todayReadings, recentSamples] = await Promise.all([
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
      prisma.sensorReading.findMany({
        where: { deviceId: device.id },
        orderBy: { timestamp: "desc" },
        take: 30,
        select: { timestamp: true, voltage: true, current: true, activePower: true },
      }),
    ]);

    const todayEnergyTotal = todayReadings.reduce((sum, r) => sum + r.energyDelta, 0);
    const resolvedConfig = config ?? (await prisma.systemConfig.create({ data: { deviceId: device.id } }));

    const summary = buildDashboardSummary(device, latestByPhase, resolvedConfig, todayEnergyTotal);

    const historySamples = recentSamples.reverse().map((r) => ({
      timestamp: r.timestamp,
      voltage: r.voltage,
      current: r.current,
      activePower: r.activePower,
    }));

    const aiResult = runAIPredictionPipeline(device.id, summary, historySamples);

    return apiSuccess(aiResult);
  } catch (error) {
    return handleApiError(error);
  }
}
