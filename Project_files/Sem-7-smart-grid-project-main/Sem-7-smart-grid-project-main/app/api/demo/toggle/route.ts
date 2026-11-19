import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedDevice } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const bodySchema = z.object({ deviceId: z.string(), enabled: z.boolean() });

export async function POST(req: NextRequest) {
  try {
    const { deviceId, enabled } = bodySchema.parse(await req.json());
    const { device } = await requireOwnedDevice(deviceId);

    const updated = await prisma.device.update({
      where: { id: device.id },
      data: {
        demoMode: enabled,
        status: enabled ? "ONLINE" : device.status,
        lastSeenAt: enabled ? new Date() : device.lastSeenAt,
      },
    });

    return apiSuccess({ device: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
