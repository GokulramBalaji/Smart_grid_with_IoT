export type PhaseKey = "R" | "Y" | "B";

export const PHASE_KEYS: PhaseKey[] = ["R", "Y", "B"];

export const PHASE_LABELS: Record<PhaseKey, string> = {
  R: "Phase R",
  Y: "Phase Y",
  B: "Phase B",
};

export const PHASE_COLORS: Record<PhaseKey, string> = {
  R: "var(--phase-r)",
  Y: "var(--phase-y)",
  B: "var(--phase-b)",
};

export interface PhaseElectricalData {
  voltage: number;
  current: number;
  activePower: number;
  apparentPower: number;
  reactivePower: number;
  powerFactor: number;
  frequency: number;
  energy: number;
  isCalculated?: boolean;
}

export interface DeviceIngestPayload {
  deviceId: string;
  timestamp: string;
  phases: {
    R: RawPhaseInput;
    Y: RawPhaseInput;
    B: RawPhaseInput;
  };
}

export interface RawPhaseInput {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  apparentPower?: number;
  reactivePower?: number;
}

export type AlertTypeKey =
  | "HIGH_VOLTAGE"
  | "LOW_VOLTAGE"
  | "OVERCURRENT"
  | "PHASE_IMBALANCE"
  | "POOR_POWER_FACTOR"
  | "FREQUENCY_ABNORMAL"
  | "DEVICE_OFFLINE"
  | "COMMUNICATION_FAILURE";

export const ALERT_TYPE_LABELS: Record<AlertTypeKey, string> = {
  HIGH_VOLTAGE: "High Voltage",
  LOW_VOLTAGE: "Low Voltage",
  OVERCURRENT: "Overcurrent",
  PHASE_IMBALANCE: "Phase Imbalance",
  POOR_POWER_FACTOR: "Poor Power Factor",
  FREQUENCY_ABNORMAL: "Frequency Abnormal",
  DEVICE_OFFLINE: "Device Offline",
  COMMUNICATION_FAILURE: "Communication Failure",
};

export type AlertSeverityKey = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatusKey = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface AlertRecord {
  id: string;
  deviceId: string;
  type: AlertTypeKey;
  severity: AlertSeverityKey;
  status: AlertStatusKey;
  phase: PhaseKey | null;
  message: string;
  value: number | null;
  threshold: number | null;
  timestamp: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  device: { name: string };
}

export interface UtilityNodeDeviceSummary {
  id: string;
  name: string;
  deviceIdentifier?: string;
  status?: string;
  lastSeenAt: string | null;
  connectionStatus: DeviceConnectionStatus;
}

export interface UtilityNodeRecord {
  id: string;
  name: string;
  parentId: string | null;
  contractDemandKva: number | null;
  createdAt: string;
  device: UtilityNodeDeviceSummary | null;
  _count: { children: number; tickets: number };
}

export type TariffType = "FLAT" | "TIME_OF_USE" | "SLAB";

export interface TouRateRecord {
  label: string;
  startHour: number;
  endHour: number;
  rate: number;
}

export interface SlabRateRecord {
  uptoKwh: number | null;
  rate: number;
}

export interface TariffPlanRecord {
  id: string;
  utilityNodeId: string;
  name: string;
  type: TariffType;
  currency: string;
  flatRate: number | null;
  touRates: TouRateRecord[] | null;
  slabRates: SlabRateRecord[] | null;
  fixedChargeMonthly: number;
  demandChargePerKva: number;
}

export type TicketCategoryKey = "COMPLAINT" | "MAINTENANCE" | "INSPECTION" | "OTHER";
export type TicketPriorityKey = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatusKey = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface TicketRecord {
  id: string;
  utilityNodeId: string;
  title: string;
  description: string;
  category: TicketCategoryKey;
  priority: TicketPriorityKey;
  status: TicketStatusKey;
  assignedTo: string | null;
  createdAt: string;
  resolvedAt: string | null;
  createdBy: { name: string } | null;
  sourceAlert: { id: string; type: AlertTypeKey; severity: AlertSeverityKey } | null;
}

export type ServiceRecordTypeKey = "ROUTINE" | "REPAIR" | "INSPECTION" | "CALIBRATION" | "OTHER";

export interface ServiceRecordRecord {
  id: string;
  utilityNodeId: string;
  type: ServiceRecordTypeKey;
  description: string;
  performedBy: string;
  performedAt: string;
  cost: number | null;
  notes: string | null;
}

export type ImbalanceStatus = "normal" | "warning" | "critical";
export type PowerFactorStatus = "excellent" | "good" | "warning" | "poor";
export type DeviceConnectionStatus = "online" | "offline" | "provisioning";

export interface DashboardSummary {
  device: {
    id: string;
    name: string;
    status: DeviceConnectionStatus;
    lastSeenAt: string | null;
    demoMode: boolean;
  } | null;
  totals: {
    avgVoltage: number;
    totalCurrent: number;
    totalActivePower: number;
    totalEnergyToday: number;
  };
  phases: Record<PhaseKey, PhaseElectricalData>;
  voltage: {
    avg: number;
    min: number;
    max: number;
    imbalancePercent: number;
    status: ImbalanceStatus;
  };
  current: {
    avg: number;
    max: number;
    imbalancePercent: number;
    status: ImbalanceStatus;
  };
  powerFactor: {
    avg: number;
    status: PowerFactorStatus;
    perPhase: Record<PhaseKey, number>;
  };
  timestamp: string | null;
}
