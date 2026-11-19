import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedUtilityNode } from "@/lib/session";
import { generateMatlabScript } from "@/lib/matlab/generate";
import type { PhaseKey } from "@/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { node } = await requireOwnedUtilityNode(id);

  if (!node.device) {
    return new Response("This utility has no device attached yet.", { status: 404 });
  }

  const latestByPhase = await prisma.sensorReading.findMany({
    where: { deviceId: node.device.id },
    orderBy: [{ phase: "asc" }, { timestamp: "desc" }],
    distinct: ["phase"],
  });

  if (latestByPhase.length < 3) {
    return new Response("Not enough sensor data yet to export a MATLAB model — wait for all three phases to report.", {
      status: 404,
    });
  }

  const byPhase = new Map(latestByPhase.map((r) => [r.phase as PhaseKey, r]));
  const phases = Object.fromEntries(
    (["R", "Y", "B"] as PhaseKey[]).map((key) => {
      const r = byPhase.get(key)!;
      return [
        key,
        {
          voltage: r.voltage,
          current: r.current,
          activePower: r.activePower,
          powerFactor: r.powerFactor,
          frequency: r.frequency,
        },
      ];
    })
  ) as Record<PhaseKey, { voltage: number; current: number; activePower: number; powerFactor: number; frequency: number }>;

  const script = generateMatlabScript({ utilityName: node.name, generatedAt: new Date(), phases });
  const safeName = node.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  return new Response(script, {
    headers: {
      "Content-Type": "text/x-matlab; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName || "utility"}_model.m"`,
    },
  });
}
