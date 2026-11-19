import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchDeviceKeySchema } from "@/lib/validations/discovery";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

/**
 * One-time pickup for a freshly (re)generated plaintext device API key.
 *
 * Closes the loop on auto-provisioning: after an operator claims a
 * self-announced ESP32 in the web UI (see /api/devices/pending/[id]/claim),
 * the device itself — still only holding the shared bootstrap
 * DEVICE_API_SECRET — polls this endpoint by its own deviceIdentifier to
 * pick up the real per-device API key it was just issued, with no manual
 * key entry required. The same handoff also fires on a key rotation
 * (/api/devices/[id]/regenerate-key), letting an already-deployed device
 * recover on its own after a 401.
 *
 * The plaintext is cleared the instant it's picked up (or once
 * pendingKeyExpiresAt passes), so — like the one-time view shown in the
 * claim/rotate UI — it is only ever readable once.
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

    const { allowed } = rateLimit("fetch-key", 300, 60_000);
    if (!allowed) {
      return apiError("Rate limit exceeded.", 429);
    }

    const { deviceIdentifier } = fetchDeviceKeySchema.parse(await req.json());

    const device = await prisma.device.findUnique({ where: { deviceIdentifier } });
    if (!device) {
      // Not claimed yet (or the identifier is wrong) — not an error, just
      // nothing to hand over yet.
      return apiSuccess({ apiKey: null, claimed: false });
    }

    const hasPendingKey =
      device.pendingKeyPlaintext !== null &&
      device.pendingKeyExpiresAt !== null &&
      device.pendingKeyExpiresAt.getTime() > Date.now();

    if (!hasPendingKey) {
      return apiSuccess({ apiKey: null, claimed: true });
    }

    const apiKey = device.pendingKeyPlaintext;
    await prisma.device.update({
      where: { id: device.id },
      data: { pendingKeyPlaintext: null, pendingKeyExpiresAt: null },
    });

    return apiSuccess({ apiKey, claimed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
