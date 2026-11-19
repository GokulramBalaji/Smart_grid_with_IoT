import type { AIGridState, AIRiskLevel } from "@/types";

export interface ClassifierInput {
  vR: number;
  vY: number;
  vB: number;
  v3Phase: number;
  vImbalance: number;
  iR: number;
  iY: number;
  iB: number;
  iTotal: number;
  iImbalance: number;
  pfAvg: number;
  frequency: number;
  totalPower: number;
  vDriftPerMin?: number;
  iDriftPerMin?: number;
  maxCapacityCurrent?: number; // default 32A or rated
}

export interface ClassificationResult {
  state: AIGridState;
  label: string;
  confidencePercent: number;
  healthScore: number; // 0 - 100
  riskLevel: AIRiskLevel;
  description: string;
}

/**
 * Multi-criteria Grid Health State Classifier based on IEEE 519 / IEEE 1159 / EN 50160 power quality standards.
 */
export function classifyGridState(input: ClassifierInput): ClassificationResult {
  const {
    vR,
    vY,
    vB,
    v3Phase,
    vImbalance,
    iR,
    iY,
    iB,
    iTotal,
    iImbalance,
    pfAvg,
    frequency,
    vDriftPerMin = 0,
    maxCapacityCurrent = 32,
  } = input;

  const minV = Math.min(vR, vY, vB);
  const maxV = Math.max(vR, vY, vB);
  const maxI = Math.max(iR, iY, iB);

  // 1. Check for extreme or impending voltage issues
  if (minV < 205 || (minV < 216 && vDriftPerMin < -0.35)) {
    const confidence = Math.min(99, Math.round(80 + (216 - minV) * 1.5 + Math.abs(vDriftPerMin) * 10));
    return {
      state: "VOLTAGE_SAG_RISK",
      label: "Voltage Sag / Undervoltage Risk",
      confidencePercent: confidence,
      healthScore: Math.max(15, Math.round(60 - (215 - minV) * 2.5)),
      riskLevel: minV < 200 ? "CRITICAL" : "ELEVATED",
      description: `Phase voltage dropped to ${minV.toFixed(1)}V (3-Phase equivalent ${v3Phase.toFixed(1)}V) with negative drift of ${vDriftPerMin.toFixed(2)} V/min, creating equipment trip risk.`,
    };
  }

  if (maxV > 248 || (maxV > 242 && vDriftPerMin > 0.4)) {
    const confidence = Math.min(99, Math.round(78 + (maxV - 240) * 2 + vDriftPerMin * 8));
    return {
      state: "VOLTAGE_SWELL_RISK",
      label: "Voltage Swell / Overvoltage Risk",
      confidencePercent: confidence,
      healthScore: Math.max(20, Math.round(65 - (maxV - 245) * 2.5)),
      riskLevel: maxV > 253 ? "CRITICAL" : "ELEVATED",
      description: `Phase voltage peaked at ${maxV.toFixed(1)}V exceeding optimal threshold. Risk of insulation thermal degradation and overvoltage trips.`,
    };
  }

  // 2. Check for severe phase asymmetry
  if (vImbalance >= 4.0 || iImbalance >= 20.0) {
    const confidence = Math.min(98, Math.round(75 + vImbalance * 3 + iImbalance * 0.5));
    return {
      state: "PHASE_IMBALANCE_WARNING",
      label: "Phase Asymmetry / Load Imbalance",
      confidencePercent: confidence,
      healthScore: Math.max(30, Math.round(75 - vImbalance * 4 - iImbalance * 0.8)),
      riskLevel: vImbalance >= 6.0 || iImbalance >= 30.0 ? "CRITICAL" : "MODERATE",
      description: `Grid exhibits ${vImbalance.toFixed(1)}% voltage imbalance and ${iImbalance.toFixed(1)}% load current imbalance, causing excessive neutral current and 3-phase motor heating.`,
    };
  }

  // 3. Check for feeder overload
  if (maxI >= maxCapacityCurrent * 0.85) {
    const loadFactor = maxI / maxCapacityCurrent;
    const confidence = Math.min(99, Math.round(70 + loadFactor * 25));
    return {
      state: "FEEDER_OVERLOAD_PREDICTED",
      label: "Feeder Overload Predicted",
      confidencePercent: confidence,
      healthScore: Math.max(25, Math.round(80 - (loadFactor - 0.85) * 150)),
      riskLevel: loadFactor >= 1.0 ? "CRITICAL" : "ELEVATED",
      description: `Peak phase current is at ${(loadFactor * 100).toFixed(0)}% of feeder capacity (${maxI.toFixed(1)}A / ${maxCapacityCurrent}A). Thermal trip imminent under continued peak demand.`,
    };
  }

  // 4. Check for poor power factor
  if (pfAvg < 0.85) {
    const confidence = Math.min(98, Math.round(82 + (0.85 - pfAvg) * 80));
    return {
      state: "POOR_POWER_FACTOR_PENALTY",
      label: "Low Power Factor / Reactive Surge",
      confidencePercent: confidence,
      healthScore: Math.max(40, Math.round(70 - (0.85 - pfAvg) * 100)),
      riskLevel: pfAvg < 0.75 ? "MODERATE" : "LOW",
      description: `Power factor is ${pfAvg.toFixed(2)}, below the 0.85 utility threshold. Heavy reactive power circulation increases losses and incurs billing surcharges.`,
    };
  }

  // 5. Check for frequency drift
  if (frequency < 49.5 || frequency > 50.5) {
    const delta = Math.abs(frequency - 50);
    const confidence = Math.min(99, Math.round(85 + delta * 20));
    return {
      state: "FREQUENCY_DRIFT",
      label: "Supply Frequency Instability",
      confidencePercent: confidence,
      healthScore: Math.max(35, Math.round(75 - delta * 40)),
      riskLevel: delta > 0.8 ? "CRITICAL" : "MODERATE",
      description: `Frequency deviation detected (${frequency.toFixed(2)} Hz vs 50.00 Hz nominal). Indicates bulk grid generation-demand imbalance or local generator hunting.`,
    };
  }

  // 6. Check for neutral displacement (when V3Phase vs phase voltages show skew)
  const theoreticalBalancedLine = Math.sqrt(3) * ((vR + vY + vB) / 3);
  const skew = Math.abs(v3Phase - theoreticalBalancedLine);
  if (skew > 4.5 && vImbalance > 2.5) {
    return {
      state: "NEUTRAL_INSTABILITY",
      label: "Neutral Point Shift / Float",
      confidencePercent: 88,
      healthScore: 62,
      riskLevel: "MODERATE",
      description: `Neutral point displacement detected (${skew.toFixed(1)}V skew). Check neutral wire termination and ground bonding at the distribution board.`,
    };
  }

  // 7. Optimal Normal Grid
  const healthScore = Math.min(100, Math.round(92 + (pfAvg - 0.9) * 20 - vImbalance * 1.5 - iImbalance * 0.2));
  return {
    state: "NORMAL_STABLE",
    label: "Optimal & Symmetric",
    confidencePercent: 96,
    healthScore: Math.max(85, healthScore),
    riskLevel: "LOW",
    description: `3-phase voltages are balanced (V_3phi = ${v3Phase.toFixed(1)}V) with stable frequency (${frequency.toFixed(2)}Hz) and healthy power factor (${pfAvg.toFixed(2)}). All parameters within IEEE standards.`,
  };
}
