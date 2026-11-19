import { round } from "@/lib/calculations/electrical";
import type { DemandStats } from "./demand";

export interface DailyEfficiencyInput {
  date: string;
  avgPowerFactor: number;
  voltageImbalance: number;
  currentImbalance: number;
}

export interface DailyEfficiencyPoint extends DailyEfficiencyInput {
  efficiencyScore: number; // 0-100 composite
}

/**
 * Composite efficiency score: rewards high power factor and penalizes phase
 * imbalance. Weights are intentionally simple/explainable rather than a
 * black-box model — 60% power factor, 40% balance (avg of V & I imbalance,
 * capped at 20% imbalance = 0 contribution).
 */
export function scoreDay(input: DailyEfficiencyInput): number {
  const pfScore = Math.max(0, Math.min(1, input.avgPowerFactor)) * 100;
  const avgImbalance = (input.voltageImbalance + input.currentImbalance) / 2;
  const balanceScore = Math.max(0, 1 - avgImbalance / 20) * 100;
  return round(pfScore * 0.6 + balanceScore * 0.4, 1);
}

export function buildEfficiencyTrend(days: DailyEfficiencyInput[]): DailyEfficiencyPoint[] {
  return days.map((d) => ({ ...d, efficiencyScore: scoreDay(d) }));
}

export interface EfficiencyRecommendation {
  title: string;
  detail: string;
  severity: "info" | "suggestion" | "action";
}

/**
 * Rule-based demand-reduction and efficiency recommendations. Every rule is
 * a plain, inspectable threshold on a measured quantity — no opaque model.
 */
export function buildRecommendations(params: {
  demand: DemandStats;
  avgPowerFactor: number;
  currentImbalancePercent: number;
  trend: DailyEfficiencyPoint[];
}): EfficiencyRecommendation[] {
  const { demand, avgPowerFactor, currentImbalancePercent, trend } = params;
  const recs: EfficiencyRecommendation[] = [];

  if (demand.loadFactor > 0 && demand.loadFactor < 0.4) {
    recs.push({
      title: "Low load factor — demand is spiky",
      detail: `Load factor is ${(demand.loadFactor * 100).toFixed(0)}% (average demand is only ${(demand.loadFactor * 100).toFixed(0)}% of peak demand). Short, high-power spikes are driving your peak-demand charges more than sustained consumption. Stagger the start times of high-power equipment (motors, compressors, HVAC) to flatten the demand curve.`,
      severity: "action",
    });
  } else if (demand.loadFactor >= 0.4 && demand.loadFactor < 0.6) {
    recs.push({
      title: "Moderate load factor",
      detail: `Load factor is ${(demand.loadFactor * 100).toFixed(0)}%. There is room to flatten demand further — consider shifting deferrable loads to off-peak hours.`,
      severity: "suggestion",
    });
  }

  if (demand.contractDemandKva && demand.utilizationPercent !== null) {
    if (demand.exceededContract) {
      recs.push({
        title: "Peak demand exceeded contracted capacity",
        detail: `Peak demand of ${demand.peakKva} kVA exceeded the contracted ${demand.contractDemandKva} kVA. This typically triggers a contract-demand penalty. Review the largest loads active at ${demand.peakAt ? new Date(demand.peakAt).toLocaleString() : "the peak interval"} and shift or shed load during that window.`,
        severity: "action",
      });
    } else if (demand.utilizationPercent > 90) {
      recs.push({
        title: "Peak demand near contracted capacity",
        detail: `Peak demand is at ${demand.utilizationPercent}% of the contracted ${demand.contractDemandKva} kVA. Schedule non-critical loads outside the peak window to avoid crossing into penalty territory.`,
        severity: "suggestion",
      });
    }
  }

  if (avgPowerFactor < 0.8) {
    recs.push({
      title: "Poor power factor",
      detail: `Average power factor is ${avgPowerFactor.toFixed(2)}, well below the 0.9+ most utilities require to avoid penalties. Install capacitor banks sized to the reactive load, or inspect large inductive loads (motors, transformers) for inefficiency.`,
      severity: "action",
    });
  } else if (avgPowerFactor < 0.9) {
    recs.push({
      title: "Power factor below optimal",
      detail: `Average power factor is ${avgPowerFactor.toFixed(2)}. Adding local power-factor correction capacitors would reduce reactive power draw and free up apparent-power capacity.`,
      severity: "suggestion",
    });
  }

  if (currentImbalancePercent > 15) {
    recs.push({
      title: "Significant phase current imbalance",
      detail: `Current imbalance is ${currentImbalancePercent}%, well above the 10% comfort threshold. Sustained imbalance causes uneven heating, reduced transformer/cable life, and wasted capacity on the lighter phases. Redistribute single-phase loads across phases R/Y/B.`,
      severity: "action",
    });
  }

  if (trend.length >= 4) {
    const half = Math.floor(trend.length / 2);
    const earlier = trend.slice(0, half).reduce((s, d) => s + d.efficiencyScore, 0) / half;
    const recent = trend.slice(half).reduce((s, d) => s + d.efficiencyScore, 0) / (trend.length - half);
    const delta = round(recent - earlier, 1);
    if (delta <= -5) {
      recs.push({
        title: "Efficiency trending down",
        detail: `The efficiency score has dropped ${Math.abs(delta)} points over the observed period (${earlier.toFixed(1)} → ${recent.toFixed(1)}). Investigate recent load or configuration changes.`,
        severity: "action",
      });
    } else if (delta >= 5) {
      recs.push({
        title: "Efficiency trending up",
        detail: `The efficiency score has improved ${delta} points over the observed period (${earlier.toFixed(1)} → ${recent.toFixed(1)}). Whatever changed recently is working — worth documenting as a standard practice.`,
        severity: "info",
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      title: "Operating within healthy parameters",
      detail: "Load factor, power factor and phase balance are all within comfortable ranges. No demand-reduction action is currently indicated.",
      severity: "info",
    });
  }

  return recs;
}
