import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOwnedUtilityNode, NotFoundError, ForbiddenError } from "@/lib/session";
import { claimPendingDeviceSchema } from "@/lib/validations/discovery";
import { generateDeviceApiKey, hashApiKey, KEY_HANDOFF_TTL_MS } from "@/lib/security";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";

/**
 * Claims a discovered (announced-but-unmapped) ESP32: maps it onto the
 * utility tree either by creating a new utility/sub-utility node (typically
 * named after the Wi-Fi network it announced) or by attaching it to an
 * existing node that doesn't have a device yet, then provisions real device
 * credentials for it.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const data = claimPendingDeviceSchema.parse(await req.json());

    const pending = await prisma.pendingDevice.findUnique({ where: { id } });
    if (!pending) throw new NotFoundError("Discovered device not found.");
    if (pending.claimed) throw new ForbiddenError("This device has already been claimed.");

    let utilityNodeId: string;

    if (data.mode === "new") {
      if (data.parentId) await requireOwnedUtilityNode(data.parentId);
      const node = await prisma.utilityNode.create({
        data: { name: data.name, ownerId: user.id, parentId: data.parentId ?? null },
      });
      utilityNodeId = node.id;
    } else {
      const { node } = await requireOwnedUtilityNode(data.utilityNodeId);
      if (node.device) {
        return apiError("This utility already has a device attached.", 409);
      }
      utilityNodeId = node.id;
    }

    const { plaintext, prefix } = generateDeviceApiKey();
    const apiKeyHash = await hashApiKey(plaintext);

    const device = await prisma.device.create({
      data: {
        name: data.deviceName,
        deviceIdentifier: pending.deviceIdentifier,
        apiKeyHash,
        apiKeyPrefix: prefix,
        location: data.location || null,
        firmwareVersion: pending.firmwareVersion,
        utilityNodeId,
        status: "PROVISIONING",
        // Lets the ESP32 itself pull this same plaintext key via
        // POST /api/devices/fetch-key instead of a human re-typing it.
        pendingKeyPlaintext: plaintext,
        pendingKeyExpiresAt: new Date(Date.now() + KEY_HANDOFF_TTL_MS),
      },
    });
    await prisma.systemConfig.create({ data: { deviceId: device.id } });

    await prisma.pendingDevice.update({
      where: { id: pending.id },
      data: {
        claimed: true,
        claimedByUserId: user.id,
        claimedUtilityNodeId: utilityNodeId,
        claimedAt: new Date(),
      },
    });

    return apiSuccess({ device, apiKey: plaintext, utilityNodeId }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
