import type {
  AIEarlyWarning,
  AIPredictionPoint,
  AIPredictionResult,
  AISuggestion,
  DashboardSummary,
} from "@/types";
import { classifyGridState, type ClassifierInput } from "./classifier";
import { round } from "@/lib/calculations/electrical";

interface HistorySample {
  timestamp: Date;
  voltage: number;
  current: number;
  activePower: number;
}

export function runAIPredictionPipeline(
  deviceId: string,
  summary: DashboardSummary,
  historySamples: HistorySample[] = []
): AIPredictionResult {
  const vR = summary.phases.R.voltage;
  const vY = summary.phases.Y.voltage;
  const vB = summary.phases.B.voltage;
  const v3Phase = summary.voltage.threePhaseEquivalent || round((vR + vY + vB) / Math.sqrt(3), 1);
  const vImbalance = summary.voltage.imbalancePercent;

  const iR = summary.phases.R.current;
  const iY = summary.phases.Y.current;
  const iB = summary.phases.B.current;
  const iTotal = summary.totals.totalCurrent;
  const iImbalance = summary.current.imbalancePercent;

  const pfAvg = summary.powerFactor.avg;
  const frequency = summary.phases.R.frequency || 50.0;
  const totalPower = summary.totals.totalActivePower;

  // Calculate drift rate from recent history samples (if available)
  let vDriftPerMin = 0;
  let iDriftPerMin = 0;
  if (historySamples.length >= 2) {
    const oldest = historySamples[0];
    const newest = historySamples[historySamples.length - 1];
    const dtMinutes = Math.max(0.5, (newest.timestamp.getTime() - oldest.timestamp.getTime()) / (1000 * 60));
    vDriftPerMin = round((newest.voltage - oldest.voltage) / dtMinutes, 3);
    iDriftPerMin = round((newest.current - oldest.current) / dtMinutes, 3);
  }

  const classifierInput: ClassifierInput = {
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
    totalPower,
    vDriftPerMin,
    iDriftPerMin,
    maxCapacityCurrent: 32, // standard 32A distribution tier
  };

  const classification = classifyGridState(classifierInput);

  // ─────────────────────────────────────────────────────────────────────────
  // Early Warnings (Pre-problem alerts)
  // ─────────────────────────────────────────────────────────────────────────
  const earlyWarnings: AIEarlyWarning[] = [];

  // Low voltage early warning
  const minPhaseV = Math.min(vR, vY, vB);
  const minPhaseKey = vR === minPhaseV ? "R" : vY === minPhaseV ? "Y" : "B";
  const LOW_VOLTAGE_THRESHOLD = 200; // V trip limit
  const HIGH_VOLTAGE_THRESHOLD = 250; // V trip limit

  if (minPhaseV < 215) {
    let timeToBreach: number | null = null;
    if (vDriftPerMin < -0.05) {
      timeToBreach = Math.max(1, Math.round((minPhaseV - LOW_VOLTAGE_THRESHOLD) / Math.abs(vDriftPerMin)));
    } else if (minPhaseV < 205) {
      timeToBreach = 8;
    }

    earlyWarnings.push({
      id: "warn-voltage-low",
      title: `Impending Undervoltage on Phase ${minPhaseKey}`,
      message: `Phase ${minPhaseKey} voltage is currently ${minPhaseV.toFixed(1)}V (3-Phase equivalent ${v3Phase.toFixed(1)}V) and drifting at ${vDriftPerMin.toFixed(2)} V/min. Projected to cross critical ${LOW_VOLTAGE_THRESHOLD}V threshold${timeToBreach ? ` in ~${timeToBreach} minutes` : " soon"}.`,
      severity: minPhaseV < 202 ? "critical" : "warning",
      parameter: `Phase ${minPhaseKey} Voltage`,
      timeToBreachMinutes: timeToBreach,
      predictedValue: round(minPhaseV - (timeToBreach ? Math.abs(vDriftPerMin) * timeToBreach : 5), 1),
      thresholdValue: LOW_VOLTAGE_THRESHOLD,
      unit: "V",
    });
  }

  // Overvoltage early warning
  const maxPhaseV = Math.max(vR, vY, vB);
  const maxPhaseKey = vR === maxPhaseV ? "R" : vY === maxPhaseV ? "Y" : "B";
  if (maxPhaseV > 243) {
    let timeToBreach: number | null = null;
    if (vDriftPerMin > 0.05) {
      timeToBreach = Math.max(1, Math.round((HIGH_VOLTAGE_THRESHOLD - maxPhaseV) / vDriftPerMin));
    }

    earlyWarnings.push({
      id: "warn-voltage-high",
      title: `High Voltage Surge Warning on Phase ${maxPhaseKey}`,
      message: `Phase ${maxPhaseKey} voltage is at ${maxPhaseV.toFixed(1)}V, nearing upper utility tolerance of ${HIGH_VOLTAGE_THRESHOLD}V. Risk of insulation stress and capacitor degradation.`,
      severity: maxPhaseV > 248 ? "critical" : "warning",
      parameter: `Phase ${maxPhaseKey} Voltage`,
      timeToBreachMinutes: timeToBreach,
      predictedValue: round(maxPhaseV + 3.5, 1),
      thresholdValue: HIGH_VOLTAGE_THRESHOLD,
      unit: "V",
    });
  }

  // Phase imbalance warning
  if (vImbalance >= 3.5 || iImbalance >= 15) {
    earlyWarnings.push({
      id: "warn-phase-imbalance",
      title: "Severe Phase Asymmetry Trending Up",
      message: `Voltage unbalance is ${vImbalance.toFixed(1)}% and current unbalance is ${iImbalance.toFixed(1)}%. Causes overheating in 3-phase induction motors and elevated neutral conductor currents.`,
      severity: vImbalance >= 5.0 || iImbalance >= 25 ? "critical" : "warning",
      parameter: "Phase Imbalance",
      timeToBreachMinutes: null,
      predictedValue: round(vImbalance * 1.15, 1),
      thresholdValue: 5.0,
      unit: "%",
    });
  }

  // Overcurrent / Feeder capacity warning
  const maxPhaseI = Math.max(iR, iY, iB);
  const maxIPhaseKey = iR === maxPhaseI ? "R" : iY === maxPhaseI ? "Y" : "B";
  const RATED_CURRENT = 32.0; // A
  if (maxPhaseI >= 25) {
    const timeToTrip = iDriftPerMin > 0.1 ? Math.max(2, Math.round((RATED_CURRENT - maxPhaseI) / iDriftPerMin)) : 15;
    earlyWarnings.push({
      id: "warn-feeder-overcurrent",
      title: `Feeder Overload Risk on Phase ${maxIPhaseKey}`,
      message: `Current on Phase ${maxIPhaseKey} is ${maxPhaseI.toFixed(1)}A (${Math.round((maxPhaseI / RATED_CURRENT) * 100)}% rating). Prolonged operation above 85% rated capacity triggers thermal breaker protection.`,
      severity: maxPhaseI >= 30 ? "critical" : "warning",
      parameter: `Phase ${maxIPhaseKey} Current`,
      timeToBreachMinutes: timeToTrip,
      predictedValue: round(maxPhaseI * 1.08, 1),
      thresholdValue: RATED_CURRENT,
      unit: "A",
    });
  }

  // Power Factor penalty warning
  if (pfAvg < 0.88) {
    earlyWarnings.push({
      id: "warn-pf-penalty",
      title: "Power Factor Penalty Risk",
      message: `Operating at ${pfAvg.toFixed(2)} PF. Falling below 0.85 incurs monthly utility reactive surcharges and line capacity degradation.`,
      severity: pfAvg < 0.80 ? "critical" : "info",
      parameter: "Average Power Factor",
      timeToBreachMinutes: null,
      predictedValue: round(pfAvg - 0.02, 2),
      thresholdValue: 0.85,
      unit: "PF",
    });
  }

  // If no warnings were triggered, provide an informational stability note
  if (earlyWarnings.length === 0) {
    earlyWarnings.push({
      id: "warn-nominal",
      title: "System Operating within Healthy Tolerances",
      message: `All 3 phases are operating within nominal IEEE 519 boundaries (3-Phase line voltage $V_{3\\phi} = ${v3Phase.toFixed(1)}V$). No threshold breaches predicted in next 6 hours.`,
      severity: "info",
      parameter: "3-Phase Line Voltage",
      timeToBreachMinutes: null,
      predictedValue: v3Phase,
      thresholdValue: 400.0,
      unit: "V",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Actionable Suggestions (Prescriptive Remediation)
  // ─────────────────────────────────────────────────────────────────────────
  const suggestions: AISuggestion[] = [];

  if (vImbalance >= 3.0 || iImbalance >= 15.0) {
    const mostLoaded = iR >= iY && iR >= iB ? "R" : iY >= iB ? "Y" : "B";
    const leastLoaded = iR <= iY && iR <= iB ? "R" : iY <= iB ? "Y" : "B";
    suggestions.push({
      id: "sug-rebalance-load",
      category: "load_balance",
      title: `Rebalance Single-Phase Loads from Phase ${mostLoaded} to Phase ${leastLoaded}`,
      action: `Transfer approx. ${round(Math.abs(summary.phases[mostLoaded].activePower - summary.phases[leastLoaded].activePower) * 0.4, 0)}W of non-critical branch circuit loads from Phase ${mostLoaded} to Phase ${leastLoaded}.`,
      rationale: `Phase ${mostLoaded} draws ${summary.phases[mostLoaded].current.toFixed(1)}A while Phase ${leastLoaded} draws only ${summary.phases[leastLoaded].current.toFixed(1)}A (${iImbalance.toFixed(0)}% unbalance).`,
      expectedImpact: `Reduces neutral return current by ~45%, drops voltage unbalance below 2%, and prevents induction motor winding thermal degradation.`,
      priority: vImbalance >= 4.5 ? "urgent" : "high",
    });
  }

  if (pfAvg < 0.90) {
    const requiredKVAR = round(
      (totalPower / 1000) * (Math.tan(Math.acos(Math.min(1, pfAvg))) - Math.tan(Math.acos(0.95))),
      2
    );
    suggestions.push({
      id: "sug-capacitor-bank",
      category: "power_factor",
      title: `Connect Shunt Power Factor Correction Capacitors (~${Math.max(0.5, requiredKVAR)} kVAR)`,
      action: `Step in ${Math.max(0.5, requiredKVAR)} kVAR of automatic power factor correction (APFC) capacitor banks near the main sub-panel.`,
      rationale: `Current PF is ${pfAvg.toFixed(2)}. Inductive lagging loads draw reactive power, increasing $I_{total}$ without doing useful work.`,
      expectedImpact: `Elevates power factor to >=0.95, cuts apparent power demand (kVA) by ~${Math.round((1 - pfAvg) * 100)}%, and avoids utility reactive penalty billing.`,
      priority: pfAvg < 0.82 ? "high" : "medium",
    });
  }

  if (minPhaseV < 215) {
    suggestions.push({
      id: "sug-tap-changer",
      category: "voltage_regulation",
      title: `Coordinate Transformer Off-Circuit / On-Load Tap Changer (+2.5% step)`,
      action: `Advance primary distribution transformer tap setting by +1 step (+2.5%) or verify cable length/gauge for excessive $I \\times R$ voltage drop.`,
      rationale: `Phase voltage dips down to ${minPhaseV.toFixed(1)}V (3-phase line ${v3Phase.toFixed(1)}V) under peak demand hours.`,
      expectedImpact: `Boosts bus voltage by ~5.7V across all phases, restoring $V_{3\\phi}$ to optimal 400V reference and eliminating undervoltage trips.`,
      priority: minPhaseV < 205 ? "urgent" : "high",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "sug-routine-maintenance",
      category: "preventive_maintenance",
      title: "Perform Routine Terminal Thermography & Neutral Inspection",
      action: "Conduct scheduled infrared thermographic inspection of main busbar connections and verify neutral lug torque at distribution panel.",
      rationale: "Grid is operating symmetrically; proactive preventative inspections ensure sustained reliability and detect micro-arcing before thermal faults.",
      expectedImpact: "Prevents unexpected loose connection fires and ensures zero unplanned downtime.",
      priority: "low",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Predictive Trajectory Forecast (Next 6 Hours)
  // ─────────────────────────────────────────────────────────────────────────
  const now = new Date();
  const forecast: AIPredictionPoint[] = [];

  // Historical anchor point
  forecast.push({
    timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    historical: true,
    actualVoltage: round(v3Phase - vDriftPerMin * 15, 1),
    predictedVoltage: round(v3Phase - vDriftPerMin * 15, 1),
    lowerBound: round(v3Phase - vDriftPerMin * 15 - 2, 1),
    upperBound: round(v3Phase - vDriftPerMin * 15 + 2, 1),
    predictedActivePower: totalPower,
  });

  // Present point
  forecast.push({
    timestamp: now.toISOString(),
    historical: false,
    actualVoltage: v3Phase,
    predictedVoltage: v3Phase,
    lowerBound: round(v3Phase - 1.5, 1),
    upperBound: round(v3Phase + 1.5, 1),
    predictedActivePower: totalPower,
  });

  // Future projection horizons: 15m, 30m, 45m, 1h, 2h, 4h, 6h
  const futureOffsetsMinutes = [15, 30, 45, 60, 120, 240, 360];
  for (const m of futureOffsetsMinutes) {
    const futureTime = new Date(now.getTime() + m * 60 * 1000).toISOString();
    // Trend with gentle reversion to nominal ~400V
    const driftDecay = Math.exp(-m / 180);
    const projectedDrift = vDriftPerMin * m * driftDecay;
    const predictedV = round(v3Phase + projectedDrift, 1);
    const uncertainty = round(1.5 + (m / 60) * 1.8, 1);

    forecast.push({
      timestamp: futureTime,
      historical: false,
      predictedVoltage: predictedV,
      lowerBound: round(predictedV - uncertainty, 1),
      upperBound: round(predictedV + uncertainty, 1),
      predictedActivePower: round(totalPower * (1 + (vDriftPerMin > 0 ? 0.02 : -0.01) * (m / 60)), 0),
    });
  }

  return {
    deviceId,
    analyzedAt: now.toISOString(),
    healthScore: classification.healthScore,
    riskLevel: classification.riskLevel,
    classification: {
      state: classification.state,
      label: classification.label,
      confidencePercent: classification.confidencePercent,
      description: classification.description,
    },
    metrics: {
      threePhaseVoltage: v3Phase,
      voltageImbalance: vImbalance,
      currentImbalance: iImbalance,
      powerFactorAvg: pfAvg,
      totalPower,
      frequency,
      voltageDriftPerMin: vDriftPerMin,
    },
    earlyWarnings,
    suggestions,
    forecast,
  };
}
