import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { Prisma, Phase } from "@prisma/client";

const MAX_ROWS = 20_000;
const CSV_HEADER = [
  "Timestamp",
  "Device",
  "Phase",
  "Voltage (V)",
  "Current (A)",
  "Active Power (W)",
  "Apparent Power (VA)",
  "Reactive Power (VAR)",
  "Power Factor",
  "Frequency (Hz)",
  "Energy (kWh)",
];

function escapeCsv(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const params = req.nextUrl.searchParams;

  const deviceId = params.get("deviceId");
  const phase = params.get("phase") as Phase | null;
  const from = params.get("from");
  const to = params.get("to");

  const where: Prisma.SensorReadingWhereInput = {
    device: user.role === "ADMIN" ? {} : { utilityNode: { ownerId: user.id } },
    ...(deviceId ? { deviceId } : {}),
    ...(phase ? { phase } : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const readings = await prisma.sensorReading.findMany({
    where,
    include: { device: { select: { name: true } } },
    orderBy: { timestamp: "desc" },
    take: MAX_ROWS,
  });

  const rows = [
    CSV_HEADER.join(","),
    ...readings.map((r) =>
      [
        r.timestamp.toISOString(),
        escapeCsv(r.device.name),
        r.phase,
        r.voltage,
        r.current,
        r.activePower,
        r.apparentPower,
        r.reactivePower,
        r.powerFactor,
        r.frequency,
        r.energy,
      ].join(",")
    ),
  ];

  const csv = rows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="smartgrid-readings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
