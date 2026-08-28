import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedDevice } from "@/lib/session";
import { generateThreePhaseSnapshot } from "@/lib/demo/simulator";
import { ingestThreePhaseReading } from "@/lib/ingest";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import type { PhaseKey, RawPhaseInput } from "@/types";

const bodySchema = z.object({ deviceId: z.string() });
const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];
const MAX_ELAPSED_HOURS = 0.1; // clamp so a long client idle doesn't inject a huge energy jump

/**
 * Advances Demo Mode by one tick: generates a realistic three-phase reading
 * and ingests it through the same pipeline a real ESP32 payload would use
 * (threshold checks, alert generation, derived calculations included).
 * Called on an interval by the dashboard client while Demo Mode is on.
 */
export async function POST(req: NextRequest) {
  try {
    const { deviceId } = bodySchema.parse(await req.json());
    const { device } = await requireOwnedDevice(deviceId);

    if (!device.demoMode) {
      return apiError("Demo mode is not enabled for this device.", 400);
    }

    const lastReadings = await prisma.sensorReading.findMany({
      where: { deviceId: device.id },
      orderBy: { timestamp: "desc" },
      take: 3,
    });

    const now = new Date();
    const lastByPhase = new Map(lastReadings.map((r) => [r.phase, r]));
    const snapshot = generateThreePhaseSnapshot({ hour: now.getHours() });

    const phases = {} as Record<PhaseKey, RawPhaseInput>;
    for (const key of PHASE_KEYS) {
      const last = lastByPhase.get(key);
      const elapsedHours = last
        ? Math.min(MAX_ELAPSED_HOURS, (now.getTime() - last.timestamp.getTime()) / 3_600_000)
        : 0;
      const base = snapshot[key];
      const cumulativeEnergy = (last?.energy ?? 1200) + (base.power * elapsedHours) / 1000;
      phases[key] = { ...base, energy: cumulativeEnergy };
    }

    const result = await ingestThreePhaseReading(device.id, phases, now);

    return apiSuccess({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
