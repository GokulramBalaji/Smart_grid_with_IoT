import { round } from "@/lib/calculations/electrical";

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

export interface PowerPoint {
  timestamp: string;
  R: number;
  Y: number;
  B: number;
  total: number;
}

interface RawRow {
  timestamp: Date;
  phase: string;
  activePower: number;
}

export function bucketPowerReadings(rows: RawRow[], bucketMs: number): PowerPoint[] {
  if (bucketMs === 0) {
    const byTimestamp = new Map<number, PowerPoint>();
    for (const row of rows) {
      const key = row.timestamp.getTime();
      if (!byTimestamp.has(key)) {
        byTimestamp.set(key, { timestamp: row.timestamp.toISOString(), R: 0, Y: 0, B: 0, total: 0 });
      }
      const point = byTimestamp.get(key)!;
      point[row.phase as "R" | "Y" | "B"] = round(row.activePower);
      point.total = round(point.R + point.Y + point.B);
    }
    return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  const buckets = new Map<number, { R: number[]; Y: number[]; B: number[] }>();
  for (const row of rows) {
    const bucketKey = Math.floor(row.timestamp.getTime() / bucketMs) * bucketMs;
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, { R: [], Y: [], B: [] });
    buckets.get(bucketKey)![row.phase as "R" | "Y" | "B"].push(row.activePower);
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([key, group]) => {
      const R = round(avg(group.R));
      const Y = round(avg(group.Y));
      const B = round(avg(group.B));
      return { timestamp: new Date(key).toISOString(), R, Y, B, total: round(R + Y + B) };
    });
}
