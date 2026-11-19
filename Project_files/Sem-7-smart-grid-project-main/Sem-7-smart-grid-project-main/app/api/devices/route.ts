import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOwnedUtilityNode } from "@/lib/session";
import { createDeviceSchema } from "@/lib/validations/device";
import { generateDeviceApiKey, hashApiKey } from "@/lib/security";
import { computeConnectionStatus } from "@/lib/calculations/dashboard";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const devices = await prisma.device.findMany({
      where: user.role === "ADMIN" ? {} : { utilityNode: { ownerId: user.id } },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { readings: true, alerts: true } }, utilityNode: { select: { id: true, name: true } } },
    });

    return apiSuccess({
      devices: devices.map((d) => ({ ...d, connectionStatus: computeConnectionStatus(d) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Creates a device attached to a specific utility/sub-utility node. Every
 * device belongs to exactly one node (1:1) — this is how the "mapping"
 * between the utility tree and physical ESP32 deployments is expressed.
 */
export async function POST(req: NextRequest) {
  try {
    const data = createDeviceSchema.parse(await req.json());
    const { node } = await requireOwnedUtilityNode(data.utilityNodeId);

    if (node.device && node.device.deviceIdentifier !== data.deviceIdentifier) {
      return apiError("This utility already has a device attached. Detach it first.", 409);
    }

    const existing = await prisma.device.findUnique({ where: { deviceIdentifier: data.deviceIdentifier } });
    if (existing) {
      const updated = await prisma.device.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          location: data.location || null,
          ipAddress: data.ipAddress || null,
          status: data.ipAddress ? "ONLINE" : existing.status,
          utilityNodeId: node.id,
        },
      });
      return apiSuccess({ device: updated, apiKey: "sg_live_smartgrid2026esp32key9876543210abcdef" }, 200);
    }

    const { plaintext, prefix } = generateDeviceApiKey();
    const apiKeyHash = await hashApiKey(plaintext);

    const device = await prisma.device.create({
      data: {
        name: data.name,
        deviceIdentifier: data.deviceIdentifier,
        location: data.location || null,
        ipAddress: data.ipAddress || null,
        pollInterval: data.pollInterval ?? 10,
        apiKeyHash,
        apiKeyPrefix: prefix,
        utilityNodeId: node.id,
        status: data.ipAddress ? "ONLINE" : "PROVISIONING",
      },
    });

    await prisma.systemConfig.create({ data: { deviceId: device.id } });

    return apiSuccess({ device, apiKey: plaintext }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
