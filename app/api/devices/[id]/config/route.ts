import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedDevice } from "@/lib/session";
import { systemConfigSchema } from "@/lib/validations/device";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { device } = await requireOwnedDevice(id);
    const data = systemConfigSchema.parse(await req.json());

    const config = await prisma.systemConfig.upsert({
      where: { deviceId: device.id },
      update: data,
      create: { deviceId: device.id, ...data },
    });

    return apiSuccess({ config });
  } catch (error) {
    return handleApiError(error);
  }
}
