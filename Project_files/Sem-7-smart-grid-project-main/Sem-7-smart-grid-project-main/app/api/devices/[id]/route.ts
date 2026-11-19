import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedDevice } from "@/lib/session";
import { updateDeviceSchema } from "@/lib/validations/device";
import { computeConnectionStatus } from "@/lib/calculations/dashboard";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const SENSOR_STALE_MS = 90 * 1000;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { device } = await requireOwnedDevice(id);

    const [config, latestByPhase] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { deviceId: device.id } }),
      prisma.sensorReading.findMany({
        where: { deviceId: device.id },
        orderBy: [{ phase: "asc" }, { timestamp: "desc" }],
        distinct: ["phase"],
      }),
    ]);

    const now = Date.now();
    const sensorStatus = ["R", "Y", "B"].map((phase) => {
      const reading = latestByPhase.find((r) => r.phase === phase);
      const connected = !!reading && now - reading.timestamp.getTime() < SENSOR_STALE_MS;
      return { phase, connected, lastReading: reading?.timestamp.toISOString() ?? null };
    });

    return apiSuccess({
      device: { ...device, connectionStatus: computeConnectionStatus(device) },
      config,
      sensorStatus,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { device } = await requireOwnedDevice(id);
    const data = updateDeviceSchema.parse(await req.json());

    const updated = await prisma.device.update({
      where: { id: device.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.location !== undefined ? { location: data.location || null } : {}),
        ...(data.demoMode !== undefined ? { demoMode: data.demoMode } : {}),
        ...(data.ipAddress !== undefined ? { ipAddress: data.ipAddress || null } : {}),
        ...(data.pollInterval !== undefined ? { pollInterval: data.pollInterval } : {}),
      },
    });

    return apiSuccess({ device: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { device } = await requireOwnedDevice(id);
    await prisma.device.delete({ where: { id: device.id } });
    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
