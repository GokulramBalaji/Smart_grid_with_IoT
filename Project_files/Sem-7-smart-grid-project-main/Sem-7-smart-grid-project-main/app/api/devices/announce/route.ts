import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { announceDeviceSchema } from "@/lib/validations/discovery";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Bootstrap "announce" endpoint an ESP32 calls before it has been claimed
 * into any user's utility tree — e.g. on every boot, alongside the Wi-Fi
 * connect handshake. Authenticated with the shared DEVICE_API_SECRET (baked
 * into firmware), not a per-device key, since no per-device key exists yet.
 *
 * The reported Wi-Fi SSID is what "map by scanning the connected network"
 * is built on: claiming the resulting pending device (see
 * /api/devices/pending/[id]/claim) auto-creates or attaches to a utility
 * node named after that network.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.DEVICE_API_SECRET;
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!secret) {
      return apiError("Server is not configured with DEVICE_API_SECRET.", 500);
    }
    if (!token || token !== secret) {
      return apiError("Invalid or missing device bootstrap secret.", 401);
    }

    const { allowed } = rateLimit("announce", 300, 60_000);
    if (!allowed) {
      return apiError("Rate limit exceeded.", 429);
    }

    const data = announceDeviceSchema.parse(await req.json());

    const existingDevice = await prisma.device.findUnique({ where: { deviceIdentifier: data.deviceIdentifier } });
    if (existingDevice) {
      // Already claimed and provisioned — nothing to announce, the ESP32
      // should be using its real per-device API key against /api/iot/readings.
      return apiSuccess({ claimed: true });
    }

    const pending = await prisma.pendingDevice.upsert({
      where: { deviceIdentifier: data.deviceIdentifier },
      update: {
        wifiSsid: data.wifiSsid,
        firmwareVersion: data.firmwareVersion,
        lastAnnouncedAt: new Date(),
      },
      create: {
        deviceIdentifier: data.deviceIdentifier,
        wifiSsid: data.wifiSsid,
        firmwareVersion: data.firmwareVersion,
      },
    });

    return apiSuccess({ claimed: pending.claimed });
  } catch (error) {
    return handleApiError(error);
  }
}
