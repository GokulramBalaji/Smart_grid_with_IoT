import { round } from "@/lib/calculations/electrical";

export interface DemandPoint {
  timestamp: string;
  kva: number;
}

interface RawApparentPowerRow {
  timestamp: Date;
  apparentPower: number;
}

/**
 * Buckets three-phase apparent-power readings into fixed demand intervals
 * (default 15 minutes, the standard utility demand-metering window) and sums
 * across phases within each interval to produce a kVA demand profile.
 */
export function bucketDemand(rows: RawApparentPowerRow[], intervalMs = 15 * 60 * 1000): DemandPoint[] {
  const buckets = new Map<number, number>();
  for (const row of rows) {
    const key = Math.floor(row.timestamp.getTime() / intervalMs) * intervalMs;
    buckets.set(key, (buckets.get(key) ?? 0) + row.apparentPower / 1000); // VA -> kVA
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([key, kva]) => ({ timestamp: new Date(key).toISOString(), kva: round(kva, 3) }));
}

export interface DemandStats {
  peakKva: number;
  peakAt: string | null;
  averageKva: number;
  loadFactor: number; // average / peak, 0..1 — higher is more efficient utilization
  contractDemandKva: number | null;
  utilizationPercent: number | null; // peak as % of contract demand
  exceededContract: boolean;
}

export function computeDemandStats(points: DemandPoint[], contractDemandKva: number | null): DemandStats {
  if (points.length === 0) {
    return {
      peakKva: 0,
      peakAt: null,
      averageKva: 0,
      loadFactor: 0,
      contractDemandKva,
      utilizationPercent: null,
      exceededContract: false,
    };
  }

  const peak = points.reduce((max, p) => (p.kva > max.kva ? p : max), points[0]);
  const average = points.reduce((sum, p) => sum + p.kva, 0) / points.length;

  return {
    peakKva: round(peak.kva, 3),
    peakAt: peak.timestamp,
    averageKva: round(average, 3),
    loadFactor: peak.kva > 0 ? round(average / peak.kva, 3) : 0,
    contractDemandKva,
    utilizationPercent: contractDemandKva ? round((peak.kva / contractDemandKva) * 100, 1) : null,
    exceededContract: contractDemandKva ? peak.kva > contractDemandKva : false,
  };
}
