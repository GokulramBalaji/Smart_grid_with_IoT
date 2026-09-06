import { PrismaClient, type Phase, type AlertSeverity, type AlertType } from "@prisma/client";
import { hashPassword, generateDeviceApiKey, hashApiKey } from "../lib/security";
import { generateThreePhaseSnapshot } from "../lib/demo/simulator";
import { round } from "../lib/calculations/electrical";
import type { PhaseKey } from "../types";

const prisma = new PrismaClient();

const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];
const INTERVAL_MINUTES = 15;
const MONTHS_OF_SUMMARY = 12;

async function main() {
  console.log("Seeding SmartGrid Monitor database...\n");

  const demoEmail = process.env.SEED_DEMO_EMAIL ?? "demo@smartgrid.io";
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "SmartGrid#2026";

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: "Alex Rivera",
      email: demoEmail,
      passwordHash: await hashPassword(demoPassword),
      role: "USER",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@smartgrid.io" },
    update: {},
    create: {
      name: "Grid Administrator",
      email: "admin@smartgrid.io",
      passwordHash: await hashPassword("Admin#2026"),
      role: "ADMIN",
    },
  });

  console.log(`Users ready: ${demoUser.email} / ${adminUser.email}`);

  // ── Utility tree ──────────────────────────────────────────────────────
  // Campus Main Utility (root, has its own device)
  //   ├─ Building A – HVAC Feeder (sub-utility, has its own device)
  //   └─ Building B – Lighting Feeder (sub-utility, no device yet — pure
  //                                    aggregation node, to demo the tree UI)
  const rootNode = await upsertUtilityNode("Campus Main Utility", demoUser.id, null);
  const buildingA = await upsertUtilityNode("Building A — HVAC Feeder", demoUser.id, rootNode.id);
  const buildingB = await upsertUtilityNode("Building B — Lighting Feeder", demoUser.id, rootNode.id);

  await prisma.utilityNode.update({ where: { id: rootNode.id }, data: { contractDemandKva: 10 } });

  const rootDevice = await upsertDevice(rootNode.id, "Main Distribution Panel", "ESP32-SMARTGRID-001", {
    location: "Building A - Utility Room",
    firmwareVersion: "1.4.2",
  });
  const buildingADevice = await upsertDevice(buildingA.id, "HVAC Feeder Panel", "ESP32-SMARTGRID-002", {
    location: "Building A - Rooftop HVAC",
    firmwareVersion: "1.4.2",
  });

  await prisma.systemConfig.upsert({
    where: { deviceId: rootDevice.id },
    update: {},
    create: { deviceId: rootDevice.id },
  });
  await prisma.systemConfig.upsert({
    where: { deviceId: buildingADevice.id },
    update: {},
    create: { deviceId: buildingADevice.id, maxCurrent: 20, maxPower: 4500 },
  });

  await seedTariffPlans(rootNode.id, buildingA.id);

  if (await prisma.sensorReading.count({ where: { deviceId: rootDevice.id } }) === 0) {
    await seedHistoricalReadings(rootDevice.id, 30, { R: 1180.4, Y: 1042.7, B: 1301.9 });
  } else {
    console.log("Root device already has readings — skipping historical generation.");
  }

  if (await prisma.sensorReading.count({ where: { deviceId: buildingADevice.id } }) === 0) {
    await seedHistoricalReadings(buildingADevice.id, 5, { R: 340.2, Y: 298.5, B: 361.7 });
  } else {
    console.log("Building A device already has readings — skipping historical generation.");
  }

  if (await prisma.energySummary.count({ where: { deviceId: rootDevice.id } }) === 0) {
    await seedEnergySummaries(rootDevice.id);
  }
  if (await prisma.energySummary.count({ where: { deviceId: buildingADevice.id } }) === 0) {
    await seedEnergySummaries(buildingADevice.id);
  }

  if (await prisma.alert.count({ where: { deviceId: rootDevice.id } }) === 0) {
    await seedAlerts(rootDevice.id, rootNode.id, adminUser.id);
  }

  await seedTicketsAndServiceRecords(rootNode.id, buildingA.id, buildingB.id, adminUser.id, demoUser.id);

  await prisma.pendingDevice.upsert({
    where: { deviceIdentifier: "ESP32-SMARTGRID-003" },
    update: {},
    create: {
      deviceIdentifier: "ESP32-SMARTGRID-003",
      wifiSsid: "Building-B-Lighting",
      firmwareVersion: "1.4.2",
    },
  });
  console.log("Discovered-but-unclaimed demo device ready (ESP32-SMARTGRID-003).");

  console.log("\nSeed complete.");
}

async function upsertUtilityNode(name: string, ownerId: string, parentId: string | null) {
  const existing = await prisma.utilityNode.findFirst({ where: { name, ownerId } });
  if (existing) return existing;
  return prisma.utilityNode.create({ data: { name, ownerId, parentId } });
}

async function upsertDevice(
  utilityNodeId: string,
  name: string,
  deviceIdentifier: string,
  extra: { location?: string; firmwareVersion?: string }
) {
  const existing = await prisma.device.findUnique({ where: { deviceIdentifier } });
  if (existing) return existing;

  const { plaintext, prefix } = generateDeviceApiKey();
  const apiKeyHash = await hashApiKey(plaintext);

  const device = await prisma.device.create({
    data: {
      name,
      deviceIdentifier,
      apiKeyHash,
      apiKeyPrefix: prefix,
      status: "ONLINE",
      demoMode: true,
      wifiSignal: -52,
      utilityNodeId,
      lastSeenAt: new Date(),
      ...extra,
    },
  });

  console.log(`\nDevice created: ${device.name} (${device.deviceIdentifier})`);
  console.log(`Device API key (shown once): ${plaintext}\n`);

  return device;
}

async function seedTariffPlans(rootNodeId: string, buildingANodeId: string) {
  await prisma.tariffPlan.upsert({
    where: { utilityNodeId: rootNodeId },
    update: {},
    create: {
      utilityNodeId: rootNodeId,
      name: "Campus Standard Flat Rate",
      type: "FLAT",
      currency: "USD",
      flatRate: 0.15,
      fixedChargeMonthly: 25,
      demandChargePerKva: 8,
    },
  });

  await prisma.tariffPlan.upsert({
    where: { utilityNodeId: buildingANodeId },
    update: {},
    create: {
      utilityNodeId: buildingANodeId,
      name: "HVAC Time-of-Use Plan",
      type: "TIME_OF_USE",
      currency: "USD",
      touRates: [
        { label: "Off-Peak", startHour: 0, endHour: 7, rate: 0.09 },
        { label: "Shoulder", startHour: 7, endHour: 17, rate: 0.14 },
        { label: "Peak", startHour: 17, endHour: 22, rate: 0.27 },
        { label: "Off-Peak", startHour: 22, endHour: 24, rate: 0.09 },
      ],
      fixedChargeMonthly: 15,
      demandChargePerKva: 6,
    },
  });

  console.log("Tariff plans ready (1 flat, 1 time-of-use).");
}

async function seedHistoricalReadings(deviceId: string, days: number, startEnergy: Record<PhaseKey, number>) {
  console.log(`Generating ${days} days of readings at ${INTERVAL_MINUTES}-minute resolution for device ${deviceId}...`);

  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const intervalMs = INTERVAL_MINUTES * 60 * 1000;
  const intervalHours = INTERVAL_MINUTES / 60;

  const cumulativeEnergy: Record<PhaseKey, number> = { ...startEnergy };

  const BATCH_SIZE = 1500;
  let batch: {
    deviceId: string;
    timestamp: Date;
    phase: Phase;
    voltage: number;
    current: number;
    activePower: number;
    apparentPower: number;
    reactivePower: number;
    powerFactor: number;
    frequency: number;
    energy: number;
    energyDelta: number;
    isCalculated: boolean;
  }[] = [];

  let totalInserted = 0;

  for (let t = start.getTime(); t <= now.getTime(); t += intervalMs) {
    const timestamp = new Date(t);
    const hour = timestamp.getHours();

    // Inject a few realistic anomaly windows so alerts + analytics have signal.
    const daysAgo = (now.getTime() - t) / (24 * 60 * 60 * 1000);
    let anomaly: "voltage-spike" | "overcurrent" | "imbalance" | null = null;
    if (days >= 30 && daysAgo > 21.9 && daysAgo < 22.05) anomaly = "voltage-spike";
    if (days >= 13 && daysAgo > 12.9 && daysAgo < 13.1) anomaly = "overcurrent";
    if (daysAgo > 3.9 && daysAgo < 4.2) anomaly = "imbalance";

    const snapshot = generateThreePhaseSnapshot({ hour, forceAnomaly: anomaly });

    for (const key of PHASE_KEYS) {
      const p = snapshot[key];
      const delta = round((p.power * intervalHours) / 1000, 4); // kWh
      cumulativeEnergy[key] = round(cumulativeEnergy[key] + delta, 4);

      batch.push({
        deviceId,
        timestamp,
        phase: key as Phase,
        voltage: p.voltage,
        current: p.current,
        activePower: p.power,
        apparentPower: p.apparentPower ?? 0,
        reactivePower: p.reactivePower ?? 0,
        powerFactor: p.powerFactor,
        frequency: p.frequency,
        energy: cumulativeEnergy[key],
        energyDelta: delta,
        isCalculated: false,
      });
    }

    if (batch.length >= BATCH_SIZE) {
      await prisma.sensorReading.createMany({ data: batch });
      totalInserted += batch.length;
      process.stdout.write(`\r  inserted ${totalInserted} readings...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await prisma.sensorReading.createMany({ data: batch });
    totalInserted += batch.length;
  }

  console.log(`\r  inserted ${totalInserted} readings total.          `);
}

async function seedEnergySummaries(deviceId: string) {
  console.log(`Aggregating daily summaries from raw readings for device ${deviceId}...`);

  const readings = await prisma.sensorReading.findMany({
    where: { deviceId },
    select: { timestamp: true, phase: true, energyDelta: true, powerFactor: true, voltage: true, current: true, activePower: true },
  });

  const byDay = new Map<
    string,
    { R: number; Y: number; B: number; pf: number[]; v: number[]; peak: number }
  >();

  for (const r of readings) {
    const dayKey = r.timestamp.toISOString().slice(0, 10);
    if (!byDay.has(dayKey)) byDay.set(dayKey, { R: 0, Y: 0, B: 0, pf: [], v: [], peak: 0 });
    const bucket = byDay.get(dayKey)!;
    bucket[r.phase as PhaseKey] += r.energyDelta;
    bucket.pf.push(r.powerFactor);
    bucket.v.push(r.voltage);
    bucket.peak = Math.max(bucket.peak, r.activePower);
  }

  const rows = Array.from(byDay.entries()).map(([dayKey, bucket]) => {
    const periodStart = new Date(`${dayKey}T00:00:00.000Z`);
    const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
    const total = bucket.R + bucket.Y + bucket.B;
    return {
      deviceId,
      period: "DAILY" as const,
      periodStart,
      periodEnd,
      energyR: round(bucket.R, 3),
      energyY: round(bucket.Y, 3),
      energyB: round(bucket.B, 3),
      totalEnergy: round(total, 3),
      avgPowerFactor: round(bucket.pf.reduce((a, b) => a + b, 0) / bucket.pf.length, 3),
      avgVoltage: round(bucket.v.reduce((a, b) => a + b, 0) / bucket.v.length, 2),
      avgCurrent: 0,
      peakPower: round(bucket.peak, 2),
      minVoltage: round(Math.min(...bucket.v), 2),
      maxVoltage: round(Math.max(...bucket.v), 2),
    };
  });

  await prisma.energySummary.createMany({ data: rows });

  // Longer-horizon monthly rollups beyond the raw-reading retention window,
  // used by the analytics page for month-over-month / yearly trend context.
  const monthlyRows = [];
  const now = new Date();
  for (let i = MONTHS_OF_SUMMARY; i >= 1; i--) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    // Scaled to roughly match the average daily consumption produced by the
    // 30-day raw-reading simulation (~60 kWh/day), so month-over-month
    // comparisons on the analytics page stay internally consistent.
    const seasonal = 1 + 0.15 * Math.sin((periodStart.getMonth() / 12) * Math.PI * 2);
    const base = 1850 * seasonal * (1 + i * 0.004);
    const r = base * 0.36,
      y = base * 0.31,
      b = base * 0.33;
    monthlyRows.push({
      deviceId,
      period: "MONTHLY" as const,
      periodStart,
      periodEnd,
      energyR: round(r, 2),
      energyY: round(y, 2),
      energyB: round(b, 2),
      totalEnergy: round(r + y + b, 2),
      avgPowerFactor: round(0.9 + Math.random() * 0.05, 3),
      avgVoltage: round(228 + Math.random() * 4, 2),
      avgCurrent: 0,
      peakPower: round(4200 + Math.random() * 900, 2),
      minVoltage: 218,
      maxVoltage: 241,
    });
  }
  await prisma.energySummary.createMany({ data: monthlyRows });

  console.log(`  created ${rows.length} daily summaries and ${monthlyRows.length} monthly rollups.`);
}

async function seedAlerts(deviceId: string, utilityNodeId: string, adminUserId: string) {
  console.log("Seeding alert history...");
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const alerts: {
    deviceId: string;
    type: AlertType;
    severity: AlertSeverity;
    phase?: Phase;
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
    status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
    acknowledgedById?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
  }[] = [
    {
      deviceId,
      type: "HIGH_VOLTAGE",
      severity: "CRITICAL",
      phase: "B" as Phase,
      message: "Phase B voltage of 258.4 V exceeds the configured maximum of 250 V.",
      value: 258.4,
      threshold: 250,
      timestamp: new Date(now - 22 * day),
      status: "RESOLVED",
      resolvedAt: new Date(now - 21.9 * day),
    },
    {
      deviceId,
      type: "OVERCURRENT",
      severity: "WARNING",
      phase: "B" as Phase,
      message: "Phase B current of 11.8 A exceeds the configured maximum of 32 A threshold margin.",
      value: 11.8,
      threshold: 10,
      timestamp: new Date(now - 13 * day),
      status: "ACKNOWLEDGED",
      acknowledgedById: adminUserId,
      acknowledgedAt: new Date(now - 12.8 * day),
    },
    {
      deviceId,
      type: "PHASE_IMBALANCE",
      severity: "WARNING",
      message: "Current (load) imbalance of 18.4% exceeds the configured maximum of 10%.",
      value: 18.4,
      threshold: 10,
      timestamp: new Date(now - 4 * day),
      status: "RESOLVED",
      resolvedAt: new Date(now - 3.9 * day),
    },
    {
      deviceId,
      type: "POOR_POWER_FACTOR",
      severity: "INFO",
      phase: "Y" as Phase,
      message: "Phase Y power factor of 0.79 is below the configured minimum of 0.85.",
      value: 0.79,
      threshold: 0.85,
      timestamp: new Date(now - 2 * day),
      status: "ACTIVE",
    },
    {
      deviceId,
      type: "COMMUNICATION_FAILURE",
      severity: "WARNING",
      message: "No data received from ESP32-SMARTGRID-001 for 12 minutes.",
      value: 12,
      threshold: 5,
      timestamp: new Date(now - 0.6 * day),
      status: "RESOLVED",
      resolvedAt: new Date(now - 0.58 * day),
    },
  ];

  await prisma.alert.createMany({ data: alerts });

  // Mirror the ingestion pipeline's behavior: a CRITICAL alert auto-opens a ticket.
  const criticalAlert = await prisma.alert.findFirst({ where: { deviceId, severity: "CRITICAL" } });
  if (criticalAlert) {
    await prisma.ticket.create({
      data: {
        utilityNodeId,
        title: "High Voltage — Phase B",
        description: criticalAlert.message,
        category: "MAINTENANCE",
        priority: "URGENT",
        status: "RESOLVED",
        sourceAlertId: criticalAlert.id,
        resolvedAt: criticalAlert.resolvedAt,
      },
    });
  }

  console.log(`  created ${alerts.length} alerts.`);
}

async function seedTicketsAndServiceRecords(
  rootNodeId: string,
  buildingANodeId: string,
  buildingBNodeId: string,
  adminUserId: string,
  demoUserId: string
) {
  const existingTickets = await prisma.ticket.count({
    where: { utilityNodeId: { in: [rootNodeId, buildingANodeId, buildingBNodeId] }, sourceAlertId: null },
  });
  if (existingTickets === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await prisma.ticket.createMany({
      data: [
        {
          utilityNodeId: buildingANodeId,
          title: "HVAC compressor short-cycling",
          description: "Facilities reported the rooftop HVAC unit cycling on/off every few minutes during peak afternoon hours.",
          category: "COMPLAINT",
          priority: "HIGH",
          status: "IN_PROGRESS",
          createdById: demoUserId,
          assignedTo: "Facilities — M. Chen",
          createdAt: new Date(now - 2 * day),
        },
        {
          utilityNodeId: rootNodeId,
          title: "Quarterly PZEM sensor calibration",
          description: "Scheduled quarterly calibration check for all three PZEM-004T sensors on the main panel.",
          category: "MAINTENANCE",
          priority: "MEDIUM",
          status: "OPEN",
          createdById: adminUserId,
          createdAt: new Date(now - 1 * day),
        },
        {
          utilityNodeId: buildingBNodeId,
          title: "Lighting feeder inspection request",
          description: "Requesting an inspection of the lighting sub-panel wiring before a device is provisioned here.",
          category: "INSPECTION",
          priority: "LOW",
          status: "OPEN",
          createdById: demoUserId,
          createdAt: new Date(now - 6 * 60 * 60 * 1000),
        },
      ],
    });
    console.log("  created 3 tickets.");
  }

  const existingRecords = await prisma.serviceRecord.count({ where: { utilityNodeId: { in: [rootNodeId, buildingANodeId] } } });
  if (existingRecords === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await prisma.serviceRecord.createMany({
      data: [
        {
          utilityNodeId: rootNodeId,
          type: "ROUTINE",
          description: "Routine panel inspection and terminal torque check.",
          performedBy: "J. Alvarez (Electrical Contractor)",
          performedAt: new Date(now - 45 * day),
          cost: 180,
        },
        {
          utilityNodeId: rootNodeId,
          type: "CALIBRATION",
          description: "Calibrated PZEM-004T sensors against a reference meter; all three within ±0.5% accuracy.",
          performedBy: "SmartGrid Field Services",
          performedAt: new Date(now - 20 * day),
          cost: 220,
          notes: "Next calibration due in 90 days.",
        },
        {
          utilityNodeId: buildingANodeId,
          type: "REPAIR",
          description: "Replaced a loose neutral connection on the HVAC feeder that was causing intermittent voltage sag.",
          performedBy: "J. Alvarez (Electrical Contractor)",
          performedAt: new Date(now - 8 * day),
          cost: 340,
        },
      ],
    });
    console.log("  created 3 service records.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
