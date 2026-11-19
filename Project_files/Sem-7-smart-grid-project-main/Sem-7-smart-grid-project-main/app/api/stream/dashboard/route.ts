import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestDevice } from "@/lib/session";
import { buildDashboardSummary } from "@/lib/calculations/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 4000;

/**
 * Server-Sent Events stream that pushes the dashboard summary to the client
 * whenever it changes. This polls the database on the server (cheap — a
 * handful of indexed queries) rather than the client polling the API, so the
 * dashboard updates the instant a new reading lands, without a manual
 * refresh, regardless of whether that reading came from a real ESP32 or
 * Demo Mode.
 */
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");

  let device;
  try {
    ({ device } = await resolveRequestDevice(deviceId));
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastTimestamp: string | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const timer: { interval?: ReturnType<typeof setInterval> } = {};

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller was closed by the client aborting mid-tick — stop the interval too.
          closed = true;
          if (timer.interval) clearInterval(timer.interval);
        }
      };

      const tick = async () => {
        if (closed || !device) return;
        try {
          const [latestByPhase, config, todayReadings] = await Promise.all([
            prisma.sensorReading.findMany({
              where: { deviceId: device.id },
              orderBy: [{ phase: "asc" }, { timestamp: "desc" }],
              distinct: ["phase"],
            }),
            prisma.systemConfig.findUnique({ where: { deviceId: device.id } }),
            prisma.sensorReading.findMany({
              where: {
                deviceId: device.id,
                timestamp: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
              },
              select: { energyDelta: true },
            }),
          ]);

          const freshDevice = await prisma.device.findUnique({ where: { id: device.id } });
          if (!freshDevice) return;

          const todayEnergyTotal = todayReadings.reduce((sum, r) => sum + r.energyDelta, 0);
          const resolvedConfig =
            config ?? (await prisma.systemConfig.create({ data: { deviceId: device.id } }));

          const summary = buildDashboardSummary(freshDevice, latestByPhase, resolvedConfig, todayEnergyTotal);

          if (summary.timestamp !== lastTimestamp) {
            lastTimestamp = summary.timestamp;
            send("dashboard", summary);
          } else {
            send("heartbeat", { at: new Date().toISOString() });
          }
        } catch (err) {
          console.error("SSE tick error", err);
        }
      };

      if (!device) {
        send("dashboard", { device: null });
      } else {
        await tick();
      }

      timer.interval = setInterval(tick, POLL_INTERVAL_MS);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(timer.interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
