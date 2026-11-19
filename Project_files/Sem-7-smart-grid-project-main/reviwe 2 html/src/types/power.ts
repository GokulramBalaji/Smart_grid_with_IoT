// Types for Three-Phase Smart Power Monitoring & Power Quality Analysis System

export type PhaseId = 'R' | 'Y' | 'B';

export type DataOrigin = 'MEASURED' | 'CALCULATED' | 'DERIVED' | 'PREDICTED';

export interface PhaseMeasurement {
  phase: PhaseId;
  name: string;
  voltage: number;        // Volts (V L-N)
  current: number;        // Amperes (A)
  activePower: number;    // Watts (W)
  powerFactor: number;    // Dimensionless 0.00 - 1.00
  frequency: number;      // Hertz (Hz)
  energy: number;         // Kilowatt-hours (kWh)
  timestamp: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface ThreePhaseCalculated {
  // Line-to-Neutral (Single-Phase Basis)
  averageVoltage: number;       // Vavg = (VR + VY + VB) / 3
  averageCurrent: number;       // Iavg = (IR + IY + IB) / 3
  
  // Line-to-Line (Three-Phase Basis)
  voltageRY: number;            // V_RY = sqrt(VR^2 + VY^2 + VR*VY)
  voltageYB: number;            // V_YB = sqrt(VY^2 + VB^2 + VY*VB)
  voltageBR: number;            // V_BR = sqrt(VB^2 + VR^2 + VB*VR)
  averageLineLineVoltage: number;// V_LL,avg = (V_RY + V_YB + V_BR) / 3
  lineLineImbalancePercent: number;// (Max Dev from V_LL,avg / V_LL,avg) * 100

  // Power Calculations
  totalActivePower: number;     // Ptotal = PR + PY + PB (W)
  totalActivePowerKW: number;   // kW
  apparentPowerR: number;       // SR = VR * IR (VA)
  apparentPowerY: number;       // SY = VY * IY (VA)
  apparentPowerB: number;       // SB = VB * IB (VA)
  totalApparentPower: number;   // Stotal = SR + SY + SB (VA)
  totalApparentPowerKVA: number;// kVA
  totalReactivePower: number;   // Qtotal = sqrt(Stotal^2 - Ptotal^2) (VAR)
  totalReactivePowerKVAR: number;// kVAR
  totalPowerFactor: number;     // PFtotal = Ptotal / Stotal
  totalEnergy: number;          // Etotal = ER + EY + EB (kWh)
  
  // Imbalance & Grid Quality
  voltageImbalancePercent: number; // (Max Dev / Vavg) * 100
  currentImbalancePercent: number; // (Max Dev / Iavg) * 100
  frequencyDeviation: number;   // f - fnominal
  neutralCurrentEstimated: number; // Estimated IN for 4-wire star system
  voltageDeviationPercent: number; // Deviation from nominal voltage
  lineLineDeviationPercent: number; // Deviation from nominal L-L voltage
}

export interface HealthScoreBreakdown {
  overallScore: number;         // 0 - 100
  voltageScore: number;         // 0 - 100 (weight: 25%)
  frequencyScore: number;       // 0 - 100 (weight: 15%)
  powerFactorScore: number;     // 0 - 100 (weight: 20%)
  imbalanceScore: number;       // 0 - 100 (weight: 20%)
  stabilityScore: number;       // 0 - 100 (weight: 10%)
  communicationScore: number;   // 0 - 100 (weight: 10%)
  conditionRating: 'Excellent' | 'Good' | 'Attention Required' | 'Poor' | 'Critical';
  description: string;
  recommendations: string[];
}

export type GridStandardId = 'INDIA_CEA' | 'IEC_61000' | 'IEEE_519' | 'UK_GRID' | 'US_ANSI' | 'CUSTOM';

export type SystemInstallationType = 'Residential' | 'Commercial' | 'Industrial' | 'Distribution' | 'Generation' | 'Custom';

export interface PowerQualityStandard {
  id: GridStandardId;
  name: string;
  authority: string;
  systemType: SystemInstallationType;
  
  // Single-Phase (Line-to-Neutral) Standard Limits
  nominalVoltage: number;        // e.g. 230V L-N (or 120V)
  voltageToleranceLower: number; // % e.g. -6%
  voltageToleranceUpper: number; // % e.g. +6%
  
  // Three-Phase (Line-to-Line) Standard Limits
  nominalLineLineVoltage: number; // e.g. 400V or 415V (or 480V)
  lineLineToleranceLower: number; // % e.g. -6% (376V)
  lineLineToleranceUpper: number; // % e.g. +6% (424V)
  
  // Frequency & Power Quality
  nominalFrequency: number;      // e.g. 50.0 Hz or 60.0 Hz
  frequencyToleranceLower: number; // Hz e.g. -0.5 Hz
  frequencyToleranceUpper: number; // Hz e.g. +0.5 Hz
  minimumPowerFactor: number;    // e.g. 0.90 or 0.95
  maxVoltageImbalance: number;   // % e.g. 2.0% (CEA / IEC 61000)
  maxCurrentImbalance: number;   // % e.g. 10.0%
  thdVoltageLimit: number;       // % e.g. 5.0% (IEEE 519 / CEA 2019)
  thdCurrentLimit: number;       // % e.g. 8.0%
  neutralSizingRule: string;     // e.g. 'IS 3043 / CEA Safety 2010 (100% or 200% neutral for triplen harmonics)'
  
  sourceRegulation: string;
  citationUrl: string;
  isEditable?: boolean;
}

export interface AlertEvent {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  phase?: PhaseId | 'ALL';
  parameter: string;
  measuredValue: string;
  limitValue: string;
  message: string;
  recommendedAction: string;
  acknowledged: boolean;
}

export interface SensorTelemetryStatus {
  phase: PhaseId;
  deviceId: string;
  modbusAddress: number;
  online: boolean;
  packetSuccessRate: number;
  lastSeenMs: number;
  voltageStatus: 'HEALTHY' | 'WARNING' | 'FAULT';
  currentStatus: 'HEALTHY' | 'WARNING' | 'FAULT';
  firmwareVersion: string;
}

export interface HistoricalDataPoint {
  timestamp: number;
  timeString: string;
  voltageR: number;
  voltageY: number;
  voltageB: number;
  voltageRY: number;
  voltageYB: number;
  voltageBR: number;
  currentR: number;
  currentY: number;
  currentB: number;
  powerR: number;
  powerY: number;
  powerB: number;
  totalActivePowerKW: number;
  totalApparentPowerKVA: number;
  totalReactivePowerKVAR: number;
  powerFactorTotal: number;
  frequency: number;
  voltageImbalance: number;
  currentImbalance: number;
  healthScore: number;
}

export interface PredictionDataPoint {
  timeOffset: string;
  timeMinutes: number;
  predictedVoltage: number;
  upperConfidenceBound: number;
  lowerConfidenceBound: number;
  predictedImbalance: number;
  predictedPowerKW: number;
  confidenceScore: number;
}

export type FaultSimulationType = 
  | 'NONE'
  | 'SAG_R'
  | 'SWELL_Y'
  | 'UNBALANCE_LOAD'
  | 'LOW_PF_INDUCTIVE'
  | 'FREQ_DRIFT'
  | 'PHASE_B_OUTAGE'
  | 'LOOSE_NEUTRAL';
