import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { computeConnectionStatus } from "@/lib/calculations/dashboard";

export async function GET() {
  try {
    await requireAdmin();

    const [totalUsers, devices, totalReadings, recentAlerts] = await Promise.all([
      prisma.user.count(),
      prisma.device.findMany({ select: { lastSeenAt: true, status: true } }),
      prisma.sensorReading.count(),
      prisma.alert.findMany({
        orderBy: { timestamp: "desc" },
        take: 10,
        include: { device: { select: { name: true } } },
      }),
    ]);

    const onlineDevices = devices.filter((d) => computeConnectionStatus(d) === "online").length;

    return apiSuccess({
      totalUsers,
      totalDevices: devices.length,
      onlineDevices,
      offlineDevices: devices.length - onlineDevices,
      totalReadings,
      recentAlerts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
