import { PhaseMeasurement, ThreePhaseCalculated, HealthScoreBreakdown, PowerQualityStandard } from '../types/power';

/**
 * Calculates Three-Phase electrical parameters from individual phase measurements.
 * Follows IEC, IEEE, and CEA 3-phase calculation conventions.
 */
export function calculateThreePhaseParameters(
  phaseR: PhaseMeasurement,
  phaseY: PhaseMeasurement,
  phaseB: PhaseMeasurement,
  standard: PowerQualityStandard
): ThreePhaseCalculated {
  // 1. Average Phase Voltage: Vavg = (VR + VY + VB) / 3
  const averageVoltage = (phaseR.voltage + phaseY.voltage + phaseB.voltage) / 3;

  // 2. Average Phase Current: Iavg = (IR + IY + IB) / 3
  const averageCurrent = (phaseR.current + phaseY.current + phaseB.current) / 3;

  // 3. Line-to-Line Three-Phase Voltages (Calculated from Phase Voltages under 120° fundamental displacement):
  // By law of cosines: V_RY = sqrt(VR^2 + VY^2 - 2*VR*VY*cos(120°)) = sqrt(VR^2 + VY^2 + VR*VY)
  const vr = phaseR.voltage;
  const vy = phaseY.voltage;
  const vb = phaseB.voltage;

  const voltageRY = Math.sqrt(Math.max(0, vr * vr + vy * vy + vr * vy));
  const voltageYB = Math.sqrt(Math.max(0, vy * vy + vb * vb + vy * vb));
  const voltageBR = Math.sqrt(Math.max(0, vb * vb + vr * vr + vb * vr));
  const averageLineLineVoltage = (voltageRY + voltageYB + voltageBR) / 3;

  // Line-to-Line Voltage Imbalance:
  const devVRY = Math.abs(voltageRY - averageLineLineVoltage);
  const devVYB = Math.abs(voltageYB - averageLineLineVoltage);
  const devVBR = Math.abs(voltageBR - averageLineLineVoltage);
  const maxLineDev = Math.max(devVRY, devVYB, devVBR);
  const lineLineImbalancePercent = averageLineLineVoltage > 0 ? (maxLineDev / averageLineLineVoltage) * 100 : 0;

  // 4. Total Active Power: Ptotal = PR + PY + PB
  const totalActivePower = phaseR.activePower + phaseY.activePower + phaseB.activePower;
  const totalActivePowerKW = totalActivePower / 1000;

  // 5. Apparent Power for each phase: S = V * I
  const apparentPowerR = phaseR.voltage * phaseR.current;
  const apparentPowerY = phaseY.voltage * phaseY.current;
  const apparentPowerB = phaseB.voltage * phaseB.current;
  const totalApparentPower = apparentPowerR + apparentPowerY + apparentPowerB;
  const totalApparentPowerKVA = totalApparentPower / 1000;

  // 6. Total Power Factor: PFtotal = Ptotal / Stotal
  // Must NOT be arithmetic average of PFR, PFY, PFB!
  let totalPowerFactor = 0;
  if (totalApparentPower > 0) {
    totalPowerFactor = totalActivePower / totalApparentPower;
    totalPowerFactor = Math.min(1.0, Math.max(0.0, totalPowerFactor));
  }

  // 7. Total Reactive Power: Qtotal = sqrt(Stotal^2 - Ptotal^2)
  let totalReactivePower = 0;
  if (totalApparentPower >= totalActivePower) {
    totalReactivePower = Math.sqrt(
      Math.max(0, Math.pow(totalApparentPower, 2) - Math.pow(totalActivePower, 2))
    );
  }
  const totalReactivePowerKVAR = totalReactivePower / 1000;

  // 8. Total Energy Consumption: Etotal = ER + EY + EB
  const totalEnergy = phaseR.energy + phaseY.energy + phaseB.energy;

  // 9. Single-Phase Line-to-Neutral Voltage Imbalance (NEMA / IEEE Definition):
  const devVR = Math.abs(phaseR.voltage - averageVoltage);
  const devVY = Math.abs(phaseY.voltage - averageVoltage);
  const devVB = Math.abs(phaseB.voltage - averageVoltage);
  const maxVoltageDev = Math.max(devVR, devVY, devVB);
  const voltageImbalancePercent = averageVoltage > 0 ? (maxVoltageDev / averageVoltage) * 100 : 0;

  // 10. Current Imbalance:
  const devIR = Math.abs(phaseR.current - averageCurrent);
  const devIY = Math.abs(phaseY.current - averageCurrent);
  const devIB = Math.abs(phaseB.current - averageCurrent);
  const maxCurrentDev = Math.max(devIR, devIY, devIB);
  const currentImbalancePercent = averageCurrent > 0 ? (maxCurrentDev / averageCurrent) * 100 : 0;

  // 11. Frequency Deviation: Measured average frequency - Nominal frequency
  const avgFrequency = (phaseR.frequency + phaseY.frequency + phaseB.frequency) / 3;
  const frequencyDeviation = avgFrequency - standard.nominalFrequency;

  // 12. Voltage deviations from standard:
  const voltageDeviationPercent = ((averageVoltage - standard.nominalVoltage) / standard.nominalVoltage) * 100;
  const lineLineDeviationPercent = ((averageLineLineVoltage - standard.nominalLineLineVoltage) / standard.nominalLineLineVoltage) * 100;

  // 13. Estimated Neutral Current in 4-wire star system:
  // IN = sqrt(IR^2 + IY^2 + IB^2 - (IR*IY + IY*IB + IB*IR))
  const ir = phaseR.current;
  const iy = phaseY.current;
  const ib = phaseB.current;
  const inSq = Math.max(0, ir*ir + iy*iy + ib*ib - (ir*iy + iy*ib + ib*ir));
  const neutralCurrentEstimated = Math.sqrt(inSq);

  return {
    averageVoltage,
    averageCurrent,
    voltageRY,
    voltageYB,
    voltageBR,
    averageLineLineVoltage,
    lineLineImbalancePercent,
    totalActivePower,
    totalActivePowerKW,
    apparentPowerR,
    apparentPowerY,
    apparentPowerB,
    totalApparentPower,
    totalApparentPowerKVA,
    totalReactivePower,
    totalReactivePowerKVAR,
    totalPowerFactor,
    totalEnergy,
    voltageImbalancePercent,
    currentImbalancePercent,
    frequencyDeviation,
    neutralCurrentEstimated,
    voltageDeviationPercent,
    lineLineDeviationPercent
  };
}

/**
 * Intelligent Power Quality Health Score Calculator (0 - 100)
 */
export function calculateHealthScore(
  calculated: ThreePhaseCalculated,
  standard: PowerQualityStandard,
  sensorSuccessRate: number = 100
): HealthScoreBreakdown {
  // 1. Voltage Score (Weight: 25%) - evaluates both L-N and L-L
  const absVDevPct = Math.abs(calculated.voltageDeviationPercent);
  const allowedVDevPct = Math.max(Math.abs(standard.voltageToleranceLower), standard.voltageToleranceUpper);
  let voltageScore = 100;
  if (absVDevPct > allowedVDevPct) {
    voltageScore = Math.max(0, 100 - (absVDevPct - allowedVDevPct) * 15);
  } else {
    voltageScore = 100 - (absVDevPct / allowedVDevPct) * 15;
  }

  // 2. Frequency Score (Weight: 15%)
  const absFDev = Math.abs(calculated.frequencyDeviation);
  const allowedFDev = Math.max(Math.abs(standard.frequencyToleranceLower), standard.frequencyToleranceUpper);
  let frequencyScore = 100;
  if (absFDev > allowedFDev) {
    frequencyScore = Math.max(0, 100 - (absFDev - allowedFDev) * 100);
  } else {
    frequencyScore = 100 - (absFDev / allowedFDev) * 15;
  }

  // 3. Power Factor Score (Weight: 20%)
  const pf = calculated.totalPowerFactor;
  let pfScore = 100;
  if (pf < standard.minimumPowerFactor) {
    const deficit = standard.minimumPowerFactor - pf;
    pfScore = Math.max(0, 100 - (deficit / (standard.minimumPowerFactor - 0.5)) * 80);
  } else {
    pfScore = 90 + ((pf - standard.minimumPowerFactor) / (1 - standard.minimumPowerFactor)) * 10;
  }

  // 4. Imbalance Score (Weight: 20%) - combines VIF and current asymmetry
  const vImb = Math.max(calculated.voltageImbalancePercent, calculated.lineLineImbalancePercent);
  const maxVImb = standard.maxVoltageImbalance;
  let vImbScore = 100;
  if (vImb > maxVImb) {
    vImbScore = Math.max(0, 100 - (vImb - maxVImb) * 25);
  } else {
    vImbScore = 100 - (vImb / maxVImb) * 15;
  }

  const iImb = calculated.currentImbalancePercent;
  const maxIImb = standard.maxCurrentImbalance;
  let iImbScore = 100;
  if (iImb > maxIImb) {
    iImbScore = Math.max(0, 100 - (iImb - maxIImb) * 3);
  } else {
    iImbScore = 100 - (iImb / maxIImb) * 15;
  }
  const imbalanceScore = vImbScore * 0.6 + iImbScore * 0.4;

  // 5. Stability Score (Weight: 10%)
  let stabilityScore = 95;
  if (calculated.neutralCurrentEstimated > calculated.averageCurrent * 0.3) {
    stabilityScore -= 20;
  }
  if (calculated.voltageImbalancePercent > 3.0) {
    stabilityScore -= 25;
  }

  // 6. Sensor Communication Score (Weight: 10%)
  const communicationScore = Math.min(100, Math.max(0, sensorSuccessRate));

  // Overall Weighted Score:
  const rawScore = 
    voltageScore * 0.25 +
    frequencyScore * 0.15 +
    pfScore * 0.20 +
    imbalanceScore * 0.20 +
    stabilityScore * 0.10 +
    communicationScore * 0.10;

  const overallScore = Math.round(Math.min(100, Math.max(0, rawScore)));

  // Determine Condition Rating:
  let conditionRating: HealthScoreBreakdown['conditionRating'] = 'Excellent';
  let description = '';
  const recommendations: string[] = [];

  if (overallScore >= 90) {
    conditionRating = 'Excellent';
    description = 'All three phases and line-to-line parameters are operating in optimal balance, high efficiency, and within configured standard limits.';
    recommendations.push('Maintain current load scheduling and capacitor bank operation.');
  } else if (overallScore >= 75) {
    conditionRating = 'Good';
    description = 'Minor electrical deviations detected. System is safe for operation, but trending parameters warrant periodic check.';
    if (pf < 0.92) recommendations.push('Inspect capacitor compensation bank to optimize system power factor.');
    if (vImb > 1.5) recommendations.push('Verify distribution of single-phase commercial loads across R, Y, and B phases.');
  } else if (overallScore >= 50) {
    conditionRating = 'Attention Required';
    description = 'Noticeable imbalance or power factor degradation. Motor winding temperatures may increase due to negative-sequence currents.';
    if (vImb > 2.0) recommendations.push('Critical: Three-phase voltage imbalance exceeds CEA grid standard limit (2.0%). Re-balance feeder loads.');
    if (pf < 0.85) recommendations.push('Substantial reactive power demand. Penalties likely under industrial tariff rules.');
    if (calculated.neutralCurrentEstimated > 4.0) recommendations.push('Elevated neutral current detected. Check for neutral bus heating and loose terminations.');
  } else if (overallScore >= 25) {
    conditionRating = 'Poor';
    description = 'Significant electrical parameter violations detected. Potential damage to sensitive electronic and induction motor loads.';
    recommendations.push('Perform immediate thermal scanning of feeder switchgear and neutral conductors.');
    recommendations.push('Investigate heavy single-phase inductive or non-linear loads.');
  } else {
    conditionRating = 'Critical';
    description = 'Dangerous grid conditions, extreme phase unbalance, or severe voltage collapse. Immediate intervention required.';
    recommendations.push('Initiate emergency load shedding or disconnect sensitive three-phase machinery.');
    recommendations.push('Inspect main distribution breaker and utility supply connection for missing phase or blown fuse.');
  }

  return {
    overallScore,
    voltageScore: Math.round(voltageScore),
    frequencyScore: Math.round(frequencyScore),
    powerFactorScore: Math.round(pfScore),
    imbalanceScore: Math.round(imbalanceScore),
    stabilityScore: Math.round(stabilityScore),
    communicationScore: Math.round(communicationScore),
    conditionRating,
    description,
    recommendations
  };
}
