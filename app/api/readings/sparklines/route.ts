import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestDevice } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { round } from "@/lib/calculations/electrical";

const POINTS = 20;

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const { device } = await resolveRequestDevice(deviceId);
    if (!device) return apiSuccess({ voltage: [], current: [], power: [], energy: [] });

    const rows = await prisma.sensorReading.findMany({
      where: { deviceId: device.id },
      orderBy: { timestamp: "desc" },
      take: POINTS * 3,
      select: { timestamp: true, voltage: true, current: true, activePower: true, energy: true },
    });

    const byTimestamp = new Map<number, { voltage: number[]; current: number[]; power: number[]; energy: number[] }>();
    for (const r of rows) {
      const key = r.timestamp.getTime();
      if (!byTimestamp.has(key)) byTimestamp.set(key, { voltage: [], current: [], power: [], energy: [] });
      const bucket = byTimestamp.get(key)!;
      bucket.voltage.push(r.voltage);
      bucket.current.push(r.current);
      bucket.power.push(r.activePower);
      bucket.energy.push(r.energy);
    }

    const sorted = Array.from(byTimestamp.entries()).sort(([a], [b]) => a - b);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    return apiSuccess({
      voltage: sorted.map(([, b]) => round(avg(b.voltage))),
      current: sorted.map(([, b]) => round(sum(b.current))),
      power: sorted.map(([, b]) => round(sum(b.power))),
      energy: sorted.map(([, b]) => round(sum(b.energy))),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
