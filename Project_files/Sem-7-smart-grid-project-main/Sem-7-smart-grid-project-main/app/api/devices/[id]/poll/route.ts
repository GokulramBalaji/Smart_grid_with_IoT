import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedDevice } from "@/lib/session";
import { ingestThreePhaseReading } from "@/lib/ingest";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import type { PhaseKey, RawPhaseInput } from "@/types";

const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];

function normalizePhase(input: any): RawPhaseInput {
  if (!input || typeof input !== "object") {
    return { voltage: 230, current: 0, power: 0, energy: 0, frequency: 50, powerFactor: 1 };
  }
  return {
    voltage: Number(input.voltage ?? input.v ?? 230),
    current: Number(input.current ?? input.i ?? input.a ?? 0),
    power: Number(input.power ?? input.activePower ?? input.p ?? input.w ?? 0),
    apparentPower: input.apparentPower !== undefined ? Number(input.apparentPower) : undefined,
    reactivePower: input.reactivePower !== undefined ? Number(input.reactivePower) : undefined,
    powerFactor: Number(input.powerFactor ?? input.pf ?? 1),
    frequency: Number(input.frequency ?? input.hz ?? input.freq ?? 50),
    energy: Number(input.energy ?? input.kwh ?? 0),
  };
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { device } = await requireOwnedDevice(id);

    if (!device.ipAddress) {
      return apiError(
        `Device "${device.name}" does not have an IP address configured. Edit the device and assign its local IP address.`,
        400
      );
    }

    const ip = device.ipAddress.trim();
    const url = ip.startsWith("http://") || ip.startsWith("https://") ? `${ip}/readings` : `http://${ip}/readings`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    let rawData: any;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return apiError(`ESP32 at ${ip} returned HTTP status ${res.status}`, 502);
      }
      rawData = await res.json();
    } catch (err: any) {
      clearTimeout(timeout);

      // If simulated / demo device or mock test
      if (device.demoMode) {
        // In demo mode with IP, we can generate a realistic reading
        rawData = {
          phases: {
            R: { voltage: 231.4, current: 4.2, power: 970, energy: 12.5, frequency: 50.0, powerFactor: 0.98 },
            Y: { voltage: 229.8, current: 3.8, power: 865, energy: 11.2, frequency: 50.0, powerFactor: 0.97 },
            B: { voltage: 230.9, current: 4.0, power: 920, energy: 11.8, frequency: 50.0, powerFactor: 0.99 },
          },
        };
      } else {
        const errorMsg = err.name === "AbortError" ? "Connection timed out after 4 seconds" : (err.message || "Connection refused");
        return apiError(`Failed to reach ESP32 at ${url}: ${errorMsg}`, 504);
      }
    }

    // Extract phases from response
    const phasesObj = rawData.phases || rawData.data || rawData;
    const normalized: Record<PhaseKey, RawPhaseInput> = {
      R: normalizePhase(phasesObj.R ?? phasesObj.r ?? phasesObj[0]),
      Y: normalizePhase(phasesObj.Y ?? phasesObj.y ?? phasesObj[1]),
      B: normalizePhase(phasesObj.B ?? phasesObj.b ?? phasesObj[2]),
    };

    // Ingest the reading through the shared pipeline
    const result = await ingestThreePhaseReading(device.id, normalized);

    // Fetch latest reading for the response
    const latestReadings = await prisma.sensorReading.findMany({
      where: { deviceId: device.id },
      orderBy: { timestamp: "desc" },
      take: 3,
    });

    return apiSuccess({
      success: true,
      deviceId: device.id,
      ipAddress: device.ipAddress,
      ingested: result,
      readings: latestReadings,
      lastSeenAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
