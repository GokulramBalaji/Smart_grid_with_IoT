import { round, calculateThreePhaseEquivalentVoltage } from "@/lib/calculations/electrical";

export type ChartRange = "1h" | "6h" | "24h" | "7d" | "30d";

export const RANGE_LABELS: Record<ChartRange, string> = {
  "1h": "Last 1 hour",
  "6h": "Last 6 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export function rangeToMs(range: ChartRange): number {
  switch (range) {
    case "1h":
      return 60 * 60 * 1000;
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

/** Bucket granularity so the chart payload stays a reasonable size at longer ranges. */
export function bucketSizeMs(range: ChartRange): number {
  switch (range) {
    case "1h":
    case "6h":
    case "24h":
      return 0; // raw points, no bucketing
    case "7d":
      return 60 * 60 * 1000; // hourly
    case "30d":
      return 24 * 60 * 60 * 1000; // daily
  }
}

export interface GridDataPoint {
  timestamp: string;
  // Power (W)
  R: number;
  Y: number;
  B: number;
  total: number;
  // Voltage (V)
  voltageR: number;
  voltageY: number;
  voltageB: number;
  voltageAvg: number;
  voltageThreePhase: number; // (voltageR + voltageY + voltageB) / sqrt(3)
  // Current (A)
  currentR: number;
  currentY: number;
  currentB: number;
  currentTotal: number;
}

// Backward-compatible alias for existing chart consumers
export type PowerPoint = GridDataPoint;

export interface RawReadingRow {
  timestamp: Date;
  phase: string;
  activePower: number;
  voltage?: number;
  current?: number;
}

export function bucketPowerReadings(rows: RawReadingRow[], bucketMs: number): GridDataPoint[] {
  if (bucketMs === 0) {
    const byTimestamp = new Map<number, GridDataPoint>();
    for (const row of rows) {
      const key = row.timestamp.getTime();
      if (!byTimestamp.has(key)) {
        byTimestamp.set(key, {
          timestamp: row.timestamp.toISOString(),
          R: 0,
          Y: 0,
          B: 0,
          total: 0,
          voltageR: 0,
          voltageY: 0,
          voltageB: 0,
          voltageAvg: 0,
          voltageThreePhase: 0,
          currentR: 0,
          currentY: 0,
          currentB: 0,
          currentTotal: 0,
        });
      }
      const point = byTimestamp.get(key)!;
      const phase = row.phase as "R" | "Y" | "B";
      point[phase] = round(row.activePower);
      point.total = round(point.R + point.Y + point.B);

      if (row.voltage !== undefined) {
        if (phase === "R") point.voltageR = round(row.voltage, 1);
        if (phase === "Y") point.voltageY = round(row.voltage, 1);
        if (phase === "B") point.voltageB = round(row.voltage, 1);
        const vSum = point.voltageR + point.voltageY + point.voltageB;
        point.voltageAvg = round(vSum / 3, 1);
        point.voltageThreePhase = calculateThreePhaseEquivalentVoltage(
          point.voltageR,
          point.voltageY,
          point.voltageB
        );
      }

      if (row.current !== undefined) {
        if (phase === "R") point.currentR = round(row.current, 2);
        if (phase === "Y") point.currentY = round(row.current, 2);
        if (phase === "B") point.currentB = round(row.current, 2);
        point.currentTotal = round(point.currentR + point.currentY + point.currentB, 2);
      }
    }
    return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  interface PhaseStats {
    power: number[];
    voltage: number[];
    current: number[];
  }

  const buckets = new Map<number, Record<"R" | "Y" | "B", PhaseStats>>();
  for (const row of rows) {
    const bucketKey = Math.floor(row.timestamp.getTime() / bucketMs) * bucketMs;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        R: { power: [], voltage: [], current: [] },
        Y: { power: [], voltage: [], current: [] },
        B: { power: [], voltage: [], current: [] },
      });
    }
    const b = buckets.get(bucketKey)!;
    const p = row.phase as "R" | "Y" | "B";
    if (b[p]) {
      b[p].power.push(row.activePower);
      if (row.voltage !== undefined) b[p].voltage.push(row.voltage);
      if (row.current !== undefined) b[p].current.push(row.current);
    }
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([key, group]) => {
      const pR = round(avg(group.R.power));
      const pY = round(avg(group.Y.power));
      const pB = round(avg(group.B.power));

      const vR = round(avg(group.R.voltage), 1);
      const vY = round(avg(group.Y.voltage), 1);
      const vB = round(avg(group.B.voltage), 1);

      const iR = round(avg(group.R.current), 2);
      const iY = round(avg(group.Y.current), 2);
      const iB = round(avg(group.B.current), 2);

      return {
        timestamp: new Date(key).toISOString(),
        R: pR,
        Y: pY,
        B: pB,
        total: round(pR + pY + pB),
        voltageR: vR,
        voltageY: vY,
        voltageB: vB,
        voltageAvg: round((vR + vY + vB) / 3, 1),
        voltageThreePhase: calculateThreePhaseEquivalentVoltage(vR, vY, vB),
        currentR: iR,
        currentY: iY,
        currentB: iB,
        currentTotal: round(iR + iY + iB, 2),
      };
    });
}

