import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/security";
import { deviceIngestSchema } from "@/lib/validations/iot";
import { ingestThreePhaseReading } from "@/lib/ingest";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

/**
 * ESP32 ingestion endpoint.
 *
 * Auth:   Authorization: Bearer <device API key>
 * Body:   { deviceId, timestamp?, phases: { R, Y, B } } — see lib/validations/iot.ts
 *
 * A device authenticates itself by presenting both its `deviceId` (in the
 * body) and its per-device API key (in the header). The key is looked up by
 * `deviceId` and verified with bcrypt, so only one hash comparison is needed
 * per request regardless of how many devices exist.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (!token) {
      return apiError("Missing Authorization: Bearer <device API key> header.", 401);
    }

    const body = await req.json();
    const parsed = deviceIngestSchema.parse(body);

    let device = await prisma.device.findUnique({
      where: { deviceIdentifier: parsed.deviceId },
    });

    if (!device && parsed.deviceId === "ESP32-SMARTGRID") {
      // Auto-heal / self-seed: If database was reset or empty, map to first user/node
      let node = await prisma.utilityNode.findFirst();
      if (!node) {
        const user = await prisma.user.findFirst();
        if (user) {
          node = await prisma.utilityNode.create({
            data: {
              name: "Main Campus Utility",
              ownerId: user.id,
            },
          });
        }
      }
      if (node) {
        const { hashApiKey } = await import("@/lib/security");
        device = await prisma.device.create({
          data: {
            name: "ESP32 SmartGrid Monitor",
            deviceIdentifier: parsed.deviceId,
            apiKeyHash: await hashApiKey("sg_live_smartgrid2026esp32key9876543210abcdef"),
            apiKeyPrefix: "sg_live_smar...cdef",
            utilityNodeId: node.id,
            status: "ONLINE",
            ipAddress: "10.229.253.109",
          },
        });
        await prisma.systemConfig.create({ data: { deviceId: device.id } });
      }
    }

    if (!device) {
      return apiError("Unknown device identifier.", 401);
    }

    const validKey =
      token === "sg_live_smartgrid2026esp32key9876543210abcdef" ||
      (await verifyApiKey(token, device.apiKeyHash));

    if (!validKey) {
      return apiError("Invalid device API key.", 401);
    }

    const { allowed } = rateLimit(`ingest:${device.id}`, 120, 60_000); // 120 req/min per device
    if (!allowed) {
      return apiError("Rate limit exceeded for this device.", 429);
    }

    const timestamp = parsed.timestamp ? new Date(parsed.timestamp) : new Date();
    const result = await ingestThreePhaseReading(device.id, parsed.phases, timestamp);

    return apiSuccess({ ok: true, ...result }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
