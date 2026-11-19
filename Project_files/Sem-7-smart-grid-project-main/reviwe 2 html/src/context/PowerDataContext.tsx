import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  PhaseMeasurement, 
  ThreePhaseCalculated, 
  HealthScoreBreakdown, 
  PowerQualityStandard, 
  AlertEvent, 
  HistoricalDataPoint, 
  PredictionDataPoint, 
  FaultSimulationType, 
  SensorTelemetryStatus 
} from '../types/power';
import { calculateThreePhaseParameters, calculateHealthScore } from '../utils/electricalCalculations';
import { PRESET_STANDARDS } from '../data/standardsData';

interface PowerDataContextType {
  // Measurements
  phaseR: PhaseMeasurement;
  phaseY: PhaseMeasurement;
  phaseB: PhaseMeasurement;
  
  // Calculations & Analytics
  calculated: ThreePhaseCalculated;
  healthScore: HealthScoreBreakdown;
  
  // Standards
  standards: PowerQualityStandard[];
  selectedStandard: PowerQualityStandard;
  setSelectedStandardId: (id: string) => void;
  updateCustomStandard: (updates: Partial<PowerQualityStandard>) => void;
  resetStandardToDefault: () => void;
  
  // Connection & Hardware
  connectionMode: 'DEMO' | 'LIVE_ESP32';
  setConnectionMode: (mode: 'DEMO' | 'LIVE_ESP32') => void;
  esp32Ip: string;
  setEsp32Ip: (ip: string) => void;
  isEsp32Connected: boolean;
  setIsEsp32Connected: (status: boolean) => void;
  lastUpdated: string;
  refreshIntervalMs: number;
  setRefreshIntervalMs: (ms: number) => void;
  sensorsStatus: SensorTelemetryStatus[];
  
  // Fault Simulation & Viva Controls
  activeFault: FaultSimulationType;
  setActiveFault: (fault: FaultSimulationType) => void;
  
  // Historical & Forecasting Data
  historicalData: HistoricalDataPoint[];
  predictions: PredictionDataPoint[];
  
  // Alerts & Events
  alerts: AlertEvent[];
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
  
  // Cost & Tariff
  tariffPerKWh: number;
  setTariffPerKWh: (rate: number) => void;
  currencySymbol: string;
  setCurrencySymbol: (curr: string) => void;
  
  // Presentation / Viva Mode
  isPresentationMode: boolean;
  setIsPresentationMode: (active: boolean) => void;
}

const PowerDataContext = createContext<PowerDataContextType | undefined>(undefined);

// Generate 24 hours of realistic pre-seeded data
function generateInitialHistoricalData(standard: PowerQualityStandard): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  const now = Date.now();
  const count = 30; // 30 points representing recent history
  
  for (let i = count; i >= 0; i--) {
    const timestamp = now - i * 60 * 1000;
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Normal fluctuations around 230V, 5A, PF 0.96
    const noiseV = (Math.sin(i * 0.3) * 2.5) + (Math.random() * 1.2 - 0.6);
    const vr = Math.round((230.8 + noiseV) * 10) / 10;
    const vy = Math.round((229.4 - noiseV * 0.8) * 10) / 10;
    const vb = Math.round((231.1 + noiseV * 0.5) * 10) / 10;
    
    const noiseI = Math.sin(i * 0.2) * 0.8 + (Math.random() * 0.4 - 0.2);
    const ir = Math.round((5.1 + noiseI) * 100) / 100;
    const iy = Math.round((4.9 - noiseI * 0.5) * 100) / 100;
    const ib = Math.round((5.2 + noiseI * 0.3) * 100) / 100;
    
    const pr = Math.round(vr * ir * 0.96);
    const py = Math.round(vy * iy * 0.95);
    const pb = Math.round(vb * ib * 0.97);
    const pTotal = pr + py + pb;
    const sTotal = vr*ir + vy*iy + vb*ib;
    const pf = Math.round((pTotal / sTotal) * 1000) / 1000;
    
    const avgV = (vr + vy + vb) / 3;
    const maxVDev = Math.max(Math.abs(vr - avgV), Math.abs(vy - avgV), Math.abs(vb - avgV));
    const vImb = Math.round((maxVDev / avgV) * 10000) / 100;
    
    const avgI = (ir + iy + ib) / 3;
    const maxIDev = Math.max(Math.abs(ir - avgI), Math.abs(iy - avgI), Math.abs(ib - avgI));
    const iImb = Math.round((maxIDev / avgI) * 10000) / 100;
    
    points.push({
      timestamp,
      timeString: timeStr,
      voltageR: vr,
      voltageY: vy,
      voltageB: vb,
      voltageRY: Math.round(Math.sqrt(vr*vr + vy*vy + vr*vy) * 10) / 10,
      voltageYB: Math.round(Math.sqrt(vy*vy + vb*vb + vy*vb) * 10) / 10,
      voltageBR: Math.round(Math.sqrt(vb*vb + vr*vr + vb*vr) * 10) / 10,
      currentR: ir,
      currentY: iy,
      currentB: ib,
      powerR: pr,
      powerY: py,
      powerB: pb,
      totalActivePowerKW: Math.round((pTotal / 1000) * 100) / 100,
      totalApparentPowerKVA: Math.round((sTotal / 1000) * 100) / 100,
      totalReactivePowerKVAR: Math.round((Math.sqrt(Math.max(0, sTotal*sTotal - pTotal*pTotal)) / 1000) * 100) / 100,
      powerFactorTotal: pf,
      frequency: Math.round((50.02 + Math.sin(i * 0.1) * 0.04) * 100) / 100,
      voltageImbalance: vImb,
      currentImbalance: iImb,
      healthScore: Math.round(94 - vImb * 3 - (1 - pf) * 40)
    });
  }
  return points;
}

export const PowerDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Standards state
  const [standards, setStandards] = useState<PowerQualityStandard[]>(PRESET_STANDARDS);
  const [selectedStandardId, setSelectedStandardId] = useState<string>('INDIA_CEA');
  
  const selectedStandard = useMemo(() => {
    return standards.find(s => s.id === selectedStandardId) || standards[0];
  }, [standards, selectedStandardId]);

  // Connection state
  const [connectionMode, setConnectionMode] = useState<'DEMO' | 'LIVE_ESP32'>('DEMO');
  const [esp32Ip, setEsp32Ip] = useState<string>('192.168.4.1');
  const [isEsp32Connected, setIsEsp32Connected] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(1000);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  // Fault simulation
  const [activeFault, setActiveFault] = useState<FaultSimulationType>('NONE');

  // Tariffs
  const [tariffPerKWh, setTariffPerKWh] = useState<number>(7.50);
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');

  // Baseline Phase Measurements
  const [phaseR, setPhaseR] = useState<PhaseMeasurement>({
    phase: 'R',
    name: 'R Phase (L1)',
    voltage: 231.4,
    current: 4.85,
    activePower: 1075,
    powerFactor: 0.96,
    frequency: 50.02,
    energy: 14.82,
    timestamp: Date.now(),
    status: 'NORMAL'
  });

  const [phaseY, setPhaseY] = useState<PhaseMeasurement>({
    phase: 'Y',
    name: 'Y Phase (L2)',
    voltage: 229.8,
    current: 5.12,
    activePower: 1115,
    powerFactor: 0.95,
    frequency: 50.01,
    energy: 15.20,
    timestamp: Date.now(),
    status: 'NORMAL'
  });

  const [phaseB, setPhaseB] = useState<PhaseMeasurement>({
    phase: 'B',
    name: 'B Phase (L3)',
    voltage: 230.6,
    current: 4.78,
    activePower: 1060,
    powerFactor: 0.96,
    frequency: 50.03,
    energy: 14.45,
    timestamp: Date.now(),
    status: 'NORMAL'
  });

  // Sensor hardware telemetry status
  const [sensorsStatus, setSensorsStatus] = useState<SensorTelemetryStatus[]>([
    {
      phase: 'R',
      deviceId: 'PZEM_R_01',
      modbusAddress: 0x01,
      online: true,
      packetSuccessRate: 99.8,
      lastSeenMs: 24,
      voltageStatus: 'HEALTHY',
      currentStatus: 'HEALTHY',
      firmwareVersion: 'v3.0.4'
    },
    {
      phase: 'Y',
      deviceId: 'PZEM_Y_02',
      modbusAddress: 0x02,
      online: true,
      packetSuccessRate: 99.5,
      lastSeenMs: 48,
      voltageStatus: 'HEALTHY',
      currentStatus: 'HEALTHY',
      firmwareVersion: 'v3.0.4'
    },
    {
      phase: 'B',
      deviceId: 'PZEM_B_03',
      modbusAddress: 0x03,
      online: true,
      packetSuccessRate: 99.7,
      lastSeenMs: 12,
      voltageStatus: 'HEALTHY',
      currentStatus: 'HEALTHY',
      firmwareVersion: 'v3.0.4'
    }
  ]);

  // Historical Buffer
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(() => 
    generateInitialHistoricalData(selectedStandard)
  );

  // Alerts
  const [alerts, setAlerts] = useState<AlertEvent[]>([
    {
      id: 'alert-init-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      severity: 'INFO',
      phase: 'ALL',
      parameter: 'System Initialized',
      measuredValue: '3 Phases Active',
      limitValue: 'Nominal 230V / 50Hz',
      message: 'Three-Phase monitoring active under CEA Standards configuration.',
      recommendedAction: 'Verify sensor calibration offsets during initial power-on.',
      acknowledged: true
    }
  ]);

  // Calculated derived parameters
  const calculated = useMemo(() => {
    return calculateThreePhaseParameters(phaseR, phaseY, phaseB, selectedStandard);
  }, [phaseR, phaseY, phaseB, selectedStandard]);

  // Health Score calculation
  const healthScore = useMemo(() => {
    const avgPacketRate = sensorsStatus.reduce((acc, s) => acc + s.packetSuccessRate, 0) / sensorsStatus.length;
    return calculateHealthScore(calculated, selectedStandard, avgPacketRate);
  }, [calculated, selectedStandard, sensorsStatus]);

  // ML Predictions (Simulated educational forecasting)
  const predictions = useMemo<PredictionDataPoint[]>(() => {
    const baseV = calculated.averageVoltage;
    const baseImb = calculated.voltageImbalancePercent;
    const baseP = calculated.totalActivePowerKW;
    const pts: PredictionDataPoint[] = [];

    // Predict for next +5m, +10m, +15m, +30m, +45m, +60m
    const intervals = [5, 10, 15, 30, 45, 60];
    intervals.forEach(min => {
      // Trend calculation based on active fault or baseline drift
      let drift = 0;
      let imbDrift = 0;
      if (activeFault === 'SAG_R') {
        drift = -0.05 * min; // progressive sag
        imbDrift = 0.08 * min;
      } else if (activeFault === 'LOOSE_NEUTRAL') {
        drift = 0.03 * min;
        imbDrift = 0.12 * min;
      } else {
        drift = Math.sin(min * 0.1) * 0.8;
        imbDrift = Math.cos(min * 0.05) * 0.1;
      }

      const predV = Math.round((baseV + drift) * 10) / 10;
      const uncertainty = (min / 60) * 4.5; // Uncertainty grows over time
      const predImb = Math.max(0.2, Math.round((baseImb + imbDrift) * 100) / 100);
      const conf = Math.round(Math.max(65, 96 - (min / 60) * 22));

      pts.push({
        timeOffset: `+${min} min`,
        timeMinutes: min,
        predictedVoltage: predV,
        upperConfidenceBound: Math.round((predV + uncertainty) * 10) / 10,
        lowerConfidenceBound: Math.round((predV - uncertainty) * 10) / 10,
        predictedImbalance: predImb,
        predictedPowerKW: Math.round((baseP + (min * 0.01)) * 100) / 100,
        confidenceScore: conf
      });
    });

    return pts;
  }, [calculated, activeFault]);

  // Main Live Telemetry Simulation / Polling Engine
  const energyRef = useRef({ r: 14.82, y: 15.20, b: 14.45 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(timeStr);

      if (connectionMode === 'DEMO') {
        // Realistic micro-jitter in voltage, current, PF
        const jitterVR = (Math.random() * 0.8 - 0.4);
        const jitterVY = (Math.random() * 0.8 - 0.4);
        const jitterVB = (Math.random() * 0.8 - 0.4);
        const jitterIR = (Math.random() * 0.08 - 0.04);
        const jitterIY = (Math.random() * 0.08 - 0.04);
        const jitterIB = (Math.random() * 0.08 - 0.04);
        const jitterFreq = (Math.random() * 0.04 - 0.02);

        // Apply baseline
        let targetVR = 231.2 + jitterVR;
        let targetVY = 229.6 + jitterVY;
        let targetVB = 230.4 + jitterVB;
        let targetIR = 4.85 + jitterIR;
        let targetIY = 5.12 + jitterIY;
        let targetIB = 4.78 + jitterIB;
        let targetPFR = 0.96;
        let targetPFY = 0.95;
        let targetPFB = 0.96;
        let targetFreq = 50.02 + jitterFreq;

        // Apply Injected Faults for Viva Presentation:
        if (activeFault === 'SAG_R') {
          targetVR = 188.5 + jitterVR; // Voltage Sag on Phase R (-18%)
        } else if (activeFault === 'SWELL_Y') {
          targetVY = 262.0 + jitterVY; // Voltage Swell on Phase Y (+14%)
        } else if (activeFault === 'UNBALANCE_LOAD') {
          targetIR = 14.8 + jitterIR;  // Heavy single-phase load on R
          targetIY = 2.4 + jitterIY;
          targetIB = 3.1 + jitterIB;
        } else if (activeFault === 'LOW_PF_INDUCTIVE') {
          targetPFR = 0.62;            // Severely inductive motor load
          targetPFY = 0.65;
          targetPFB = 0.60;
        } else if (activeFault === 'FREQ_DRIFT') {
          targetFreq = 48.95;          // Under-frequency grid disturbance
        } else if (activeFault === 'PHASE_B_OUTAGE') {
          targetVB = 0.0;              // Blown fuse / open phase on B
          targetIB = 0.0;
          targetPFB = 0.0;
        } else if (activeFault === 'LOOSE_NEUTRAL') {
          targetVR = 254.0 + jitterVR; // Floating neutral shifts phase voltages
          targetVY = 205.0 + jitterVY;
          targetVB = 238.0 + jitterVB;
        }

        // Energy increment (kWh accumulator)
        energyRef.current.r += (targetVR * targetIR * targetPFR) / (1000 * 3600);
        energyRef.current.y += (targetVY * targetIY * targetPFY) / (1000 * 3600);
        energyRef.current.b += (targetVB * targetIB * targetPFB) / (1000 * 3600);

        setPhaseR({
          phase: 'R',
          name: 'R Phase (L1)',
          voltage: Math.round(targetVR * 10) / 10,
          current: Math.round(targetIR * 100) / 100,
          activePower: Math.round(targetVR * targetIR * targetPFR),
          powerFactor: Math.round(targetPFR * 100) / 100,
          frequency: Math.round(targetFreq * 100) / 100,
          energy: Math.round(energyRef.current.r * 100) / 100,
          timestamp: now,
          status: targetVR < 216 || targetVR > 244 ? 'WARNING' : 'NORMAL'
        });

        setPhaseY({
          phase: 'Y',
          name: 'Y Phase (L2)',
          voltage: Math.round(targetVY * 10) / 10,
          current: Math.round(targetIY * 100) / 100,
          activePower: Math.round(targetVY * targetIY * targetPFY),
          powerFactor: Math.round(targetPFY * 100) / 100,
          frequency: Math.round(targetFreq * 100) / 100,
          energy: Math.round(energyRef.current.y * 100) / 100,
          timestamp: now,
          status: targetVY < 216 || targetVY > 244 ? 'WARNING' : 'NORMAL'
        });

        setPhaseB({
          phase: 'B',
          name: 'B Phase (L3)',
          voltage: Math.round(targetVB * 10) / 10,
          current: Math.round(targetIB * 100) / 100,
          activePower: Math.round(targetVB * targetIB * targetPFB),
          powerFactor: Math.round(targetPFB * 100) / 100,
          frequency: Math.round(targetFreq * 100) / 100,
          energy: Math.round(energyRef.current.b * 100) / 100,
          timestamp: now,
          status: targetVB < 216 || targetVB > 244 ? 'WARNING' : 'NORMAL'
        });

        // Update historical ring buffer
        setHistoricalData(prev => {
          const newPt: HistoricalDataPoint = {
            timestamp: now,
            timeString: timeStr,
            voltageR: Math.round(targetVR * 10) / 10,
            voltageY: Math.round(targetVY * 10) / 10,
            voltageB: Math.round(targetVB * 10) / 10,
            voltageRY: Math.round(Math.sqrt(targetVR*targetVR + targetVY*targetVY + targetVR*targetVY) * 10) / 10,
            voltageYB: Math.round(Math.sqrt(targetVY*targetVY + targetVB*targetVB + targetVY*targetVB) * 10) / 10,
            voltageBR: Math.round(Math.sqrt(targetVB*targetVB + targetVR*targetVR + targetVB*targetVR) * 10) / 10,
            currentR: Math.round(targetIR * 100) / 100,
            currentY: Math.round(targetIY * 100) / 100,
            currentB: Math.round(targetIB * 100) / 100,
            powerR: Math.round(targetVR * targetIR * targetPFR),
            powerY: Math.round(targetVY * targetIY * targetPFY),
            powerB: Math.round(targetVB * targetIB * targetPFB),
            totalActivePowerKW: Math.round(((targetVR*targetIR*targetPFR + targetVY*targetIY*targetPFY + targetVB*targetIB*targetPFB) / 1000) * 100) / 100,
            totalApparentPowerKVA: Math.round(((targetVR*targetIR + targetVY*targetIY + targetVB*targetIB) / 1000) * 100) / 100,
            totalReactivePowerKVAR: Math.round((Math.sqrt(Math.max(0, Math.pow(targetVR*targetIR + targetVY*targetIY + targetVB*targetIB, 2) - Math.pow(targetVR*targetIR*targetPFR + targetVY*targetIY*targetPFY + targetVB*targetIB*targetPFB, 2))) / 1000) * 100) / 100,
            powerFactorTotal: Math.round((targetPFR * 0.333 + targetPFY * 0.333 + targetPFB * 0.334) * 1000) / 1000,
            frequency: Math.round(targetFreq * 100) / 100,
            voltageImbalance: Math.round(calculated.voltageImbalancePercent * 100) / 100,
            currentImbalance: Math.round(calculated.currentImbalancePercent * 100) / 100,
            healthScore: healthScore.overallScore
          };
          const next = [...prev.slice(1), newPt];
          return next;
        });

        // Trigger Alarms based on standard breaches
        if (targetVR < 216.2 && activeFault === 'SAG_R') {
          triggerAlarmOnce('SAG_R_ALARM', 'CRITICAL', 'R', 'Voltage Sag', `${targetVR.toFixed(1)} V`, '216.2 V (-6%)', 'R-Phase Under-Voltage Sag detected! Check upstream feeder transformer tap.');
        } else if (targetVY > 243.8 && activeFault === 'SWELL_Y') {
          triggerAlarmOnce('SWELL_Y_ALARM', 'CRITICAL', 'Y', 'Voltage Swell', `${targetVY.toFixed(1)} V`, '243.8 V (+6%)', 'Y-Phase Over-Voltage Swell detected! Danger to single-phase appliances.');
        } else if (targetPFR < 0.85 && activeFault === 'LOW_PF_INDUCTIVE') {
          triggerAlarmOnce('LOW_PF_ALARM', 'WARNING', 'ALL', 'Low Power Factor', `${targetPFR.toFixed(2)}`, '0.90 Lag', 'Total System Power Factor below CEA statutory limit (0.90). Utility penalties apply.');
        } else if (targetVB < 10 && activeFault === 'PHASE_B_OUTAGE') {
          triggerAlarmOnce('PHASE_OUTAGE_ALARM', 'CRITICAL', 'B', 'Phase Loss', '0.0 V', '230 V Nominal', 'Complete Phase B Loss / Blown Fuse detected. Immediate motor trip protection recommended.');
        }
      }
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [connectionMode, activeFault, refreshIntervalMs, calculated, healthScore.overallScore]);

  // Helper to prevent duplicate alarms
  const triggerAlarmOnce = (
    alarmKey: string,
    severity: AlertEvent['severity'],
    phase: AlertEvent['phase'],
    parameter: string,
    measuredValue: string,
    limitValue: string,
    message: string
  ) => {
    setAlerts(prev => {
      const exists = prev.some(a => a.id.startsWith(alarmKey) && !a.acknowledged);
      if (exists) return prev;
      const newAlarm: AlertEvent = {
        id: `${alarmKey}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        severity,
        phase,
        parameter,
        measuredValue,
        limitValue,
        message,
        recommendedAction: 'Inspect affected phase connections, CT orientations, and switchgear contacts.',
        acknowledged: false
      };
      return [newAlarm, ...prev.slice(0, 19)];
    });
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const updateCustomStandard = (updates: Partial<PowerQualityStandard>) => {
    setStandards(prev => prev.map(std => {
      if (std.id === 'CUSTOM') {
        return { ...std, ...updates };
      }
      return std;
    }));
  };

  const resetStandardToDefault = () => {
    setStandards(PRESET_STANDARDS);
    setSelectedStandardId('INDIA_CEA');
  };

  return (
    <PowerDataContext.Provider
      value={{
        phaseR,
        phaseY,
        phaseB,
        calculated,
        healthScore,
        standards,
        selectedStandard,
        setSelectedStandardId,
        updateCustomStandard,
        resetStandardToDefault,
        connectionMode,
        setConnectionMode,
        esp32Ip,
        setEsp32Ip,
        isEsp32Connected,
        setIsEsp32Connected,
        lastUpdated,
        refreshIntervalMs,
        setRefreshIntervalMs,
        sensorsStatus,
        activeFault,
        setActiveFault,
        historicalData,
        predictions,
        alerts,
        acknowledgeAlert,
        clearAlerts,
        tariffPerKWh,
        setTariffPerKWh,
        currencySymbol,
        setCurrencySymbol,
        isPresentationMode,
        setIsPresentationMode
      }}
    >
      {children}
    </PowerDataContext.Provider>
  );
};

export const usePowerData = () => {
  const context = useContext(PowerDataContext);
  if (!context) {
    throw new Error('usePowerData must be used within a PowerDataProvider');
  }
  return context;
};
