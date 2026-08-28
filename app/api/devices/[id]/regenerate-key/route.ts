import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedDevice } from "@/lib/session";
import { generateDeviceApiKey, hashApiKey } from "@/lib/security";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { device } = await requireOwnedDevice(id);

    const { plaintext, prefix } = generateDeviceApiKey();
    const apiKeyHash = await hashApiKey(plaintext);

    await prisma.device.update({
      where: { id: device.id },
      data: { apiKeyHash, apiKeyPrefix: prefix },
    });

    return apiSuccess({ apiKey: plaintext });
  } catch (error) {
    return handleApiError(error);
  }
}
