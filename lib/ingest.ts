import { prisma } from "@/lib/prisma";
import type { Phase } from "@prisma/client";
import type { PhaseKey, RawPhaseInput } from "@/types";
import { energyDelta, calculateApparentPower, calculateReactivePower, round } from "@/lib/calculations/electrical";
import { evaluateThresholds } from "@/lib/calculations/alerts";

const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];
const DUPLICATE_ALERT_WINDOW_MS = 15 * 60 * 1000; // don't re-fire the same alert within 15 minutes

export interface IngestResult {
  readingsCreated: number;
  alertsCreated: number;
}

export async function ingestThreePhaseReading(
  deviceId: string,
  phases: Record<PhaseKey, RawPhaseInput>,
  timestamp: Date = new Date()
): Promise<IngestResult> {
  const device = await prisma.device.findUniqueOrThrow({
    where: { id: deviceId },
    include: { config: true },
  });

  const config =
    device.config ??
    (await prisma.systemConfig.create({ data: { deviceId: device.id } }));

  const lastReadings = await prisma.sensorReading.findMany({
    where: { deviceId: device.id },
    orderBy: { timestamp: "desc" },
    take: 3,
    select: { phase: true, energy: true },
  });
  const lastEnergyByPhase = new Map<Phase, number>();
  for (const r of lastReadings) {
    if (!lastEnergyByPhase.has(r.phase)) lastEnergyByPhase.set(r.phase, r.energy);
  }

  const readingRows = PHASE_KEYS.map((key) => {
    const p = phases[key];
    const apparentPower = p.apparentPower ?? round(calculateApparentPower(p.voltage, p.current), 2);
    const reactivePower =
      p.reactivePower ?? round(calculateReactivePower(apparentPower, p.power), 2);
    const isCalculated = p.apparentPower === undefined || p.reactivePower === undefined;
    const previousEnergy = lastEnergyByPhase.get(key as Phase) ?? null;

    return {
      deviceId: device.id,
      timestamp,
      phase: key as Phase,
      voltage: p.voltage,
      current: p.current,
      activePower: p.power,
      apparentPower,
      reactivePower,
      powerFactor: p.powerFactor,
      frequency: p.frequency,
      energy: p.energy,
      energyDelta: energyDelta(previousEnergy, p.energy),
      isCalculated,
    };
  });

  const alerts = evaluateThresholds(phases, config);

  await prisma.$transaction(async (tx) => {
    await tx.sensorReading.createMany({ data: readingRows });
    await tx.device.update({
      where: { id: device.id },
      data: {
        lastSeenAt: timestamp,
        status: "ONLINE",
        wifiSignal: device.wifiSignal ?? -55,
      },
    });

    for (const alert of alerts) {
      const recentDuplicate = await tx.alert.findFirst({
        where: {
          deviceId: device.id,
          type: alert.type,
          phase: alert.phase ?? null,
          status: "ACTIVE",
          timestamp: { gte: new Date(timestamp.getTime() - DUPLICATE_ALERT_WINDOW_MS) },
        },
      });
      if (recentDuplicate) continue;

      await tx.alert.create({
        data: {
          deviceId: device.id,
          type: alert.type,
          severity: alert.severity,
          phase: alert.phase as Phase | undefined,
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold,
          timestamp,
        },
      });
    }
  });

  return { readingsCreated: readingRows.length, alertsCreated: alerts.length };
}
