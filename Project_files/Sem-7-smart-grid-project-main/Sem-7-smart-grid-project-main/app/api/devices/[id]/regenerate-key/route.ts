import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedDevice } from "@/lib/session";
import { generateDeviceApiKey, hashApiKey, KEY_HANDOFF_TTL_MS } from "@/lib/security";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { device } = await requireOwnedDevice(id);

    const { plaintext, prefix } = generateDeviceApiKey();
    const apiKeyHash = await hashApiKey(plaintext);

    await prisma.device.update({
      where: { id: device.id },
      data: {
        apiKeyHash,
        apiKeyPrefix: prefix,
        // Lets the already-deployed ESP32 auto-recover from a key rotation
        // by fetching the new plaintext itself instead of being reflashed.
        pendingKeyPlaintext: plaintext,
        pendingKeyExpiresAt: new Date(Date.now() + KEY_HANDOFF_TTL_MS),
      },
    });

    return apiSuccess({ apiKey: plaintext });
  } catch (error) {
    return handleApiError(error);
  }
}
