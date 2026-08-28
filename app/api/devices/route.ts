import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createDeviceSchema } from "@/lib/validations/device";
import { generateDeviceApiKey, hashApiKey } from "@/lib/security";
import { computeConnectionStatus } from "@/lib/calculations/dashboard";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const devices = await prisma.device.findMany({
      where: user.role === "ADMIN" ? {} : { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { readings: true, alerts: true } } },
    });

    return apiSuccess({
      devices: devices.map((d) => ({ ...d, connectionStatus: computeConnectionStatus(d) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = createDeviceSchema.parse(await req.json());

    const existing = await prisma.device.findUnique({ where: { deviceIdentifier: data.deviceIdentifier } });
    if (existing) {
      return apiError("A device with this identifier already exists.", 409);
    }

    const { plaintext, prefix } = generateDeviceApiKey();
    const apiKeyHash = await hashApiKey(plaintext);

    const device = await prisma.device.create({
      data: {
        name: data.name,
        deviceIdentifier: data.deviceIdentifier,
        location: data.location || null,
        apiKeyHash,
        apiKeyPrefix: prefix,
        ownerId: user.id,
        status: "PROVISIONING",
      },
    });

    await prisma.systemConfig.create({ data: { deviceId: device.id } });

    return apiSuccess({ device, apiKey: plaintext }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
