import React from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { OriginBadge } from '../common/Badge';
import { SemiGauge } from '../common/Gauge';
import { PhasorCanvas } from '../common/PhasorCanvas';
import { PowerTriangleCanvas } from '../common/PowerTriangleCanvas';
import { 
  Calculator, 
  Info, 
  Percent, 
  Scale, 
  ShieldAlert, 
  Zap, 
  Activity 
} from 'lucide-react';

export const ThreePhaseAnalysisSection: React.FC = () => {
  const { phaseR, phaseY, phaseB, calculated, selectedStandard } = usePowerData();

  return (
    <section className="space-y-6">
      {/* Section Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Three-Phase Electrical Analysis & Derived Indicators
            </h2>
            <OriginBadge origin="CALCULATED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Calculated in software: Line-to-Line (415V), Line-to-Neutral (230V), Apparent/Reactive Powers, Imbalance, and True Power Factor
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#0071E3] text-xs font-mono flex items-center gap-2">
          <Info className="w-4 h-4 text-[#0071E3] shrink-0" />
          <span>Educational Rule: Derived in software from 3 single-phase PZEM telemetry streams.</span>
        </div>
      </div>

      {/* Grid of Key Three-Phase Calculated Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Average Line-to-Line Three-Phase Voltage */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Average Line-to-Line (V_LL,avg)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0071E3] border border-blue-200">3Φ Main</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-sans text-[#1D1D1F]">
              {calculated.averageLineLineVoltage.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-500">V RMS (415V Standard)</span>
          </div>
          <div className="text-[11px] font-mono text-[#0071E3] bg-blue-50/60 px-2 py-1 rounded-lg border border-blue-200/60">
            V_LL ≈ √3 × V_LN = (V_RY + V_YB + V_BR) / 3
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            RY: {calculated.voltageRY.toFixed(0)}V | YB: {calculated.voltageYB.toFixed(0)}V | BR: {calculated.voltageBR.toFixed(0)}V
          </div>
        </div>

        {/* 2. Average Line-to-Neutral Voltage */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Average Phase Voltage (Vavg)</span>
            <OriginBadge origin="CALCULATED" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-sans text-[#1D1D1F]">
              {calculated.averageVoltage.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-500">V RMS (230V Ref)</span>
          </div>
          <div className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            Vavg = (VR + VY + VB) / 3
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            R: {phaseR.voltage.toFixed(1)}V | Y: {phaseY.voltage.toFixed(1)}V | B: {phaseB.voltage.toFixed(1)}V
          </div>
        </div>

        {/* 3. Average Phase Current */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Average Current (Iavg)</span>
            <OriginBadge origin="CALCULATED" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-sans text-[#1D1D1F]">
              {calculated.averageCurrent.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-500">A RMS</span>
          </div>
          <div className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            Iavg = (IR + IY + IB) / 3
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            R: {phaseR.current.toFixed(2)}A | Y: {phaseY.current.toFixed(2)}A | B: {phaseB.current.toFixed(2)}A
          </div>
        </div>

        {/* 4. Total Active Power */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Total Active Power (Ptotal)</span>
            <OriginBadge origin="CALCULATED" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-sans text-[#0071E3]">
              {calculated.totalActivePowerKW.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-slate-500">kW ({calculated.totalActivePower.toFixed(0)} W)</span>
          </div>
          <div className="text-[11px] font-mono text-[#0071E3] bg-blue-50/60 px-2 py-1 rounded-lg border border-blue-200/60">
            Ptotal = PR + PY + PB
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Sum of individual active work across all 3 phases
          </div>
        </div>

        {/* 5. Total Apparent Power */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Total Apparent Power (Stotal)</span>
            <OriginBadge origin="CALCULATED" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-sans text-purple-700">
              {calculated.totalApparentPowerKVA.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-slate-500">kVA</span>
          </div>
          <div className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200/60">
            Stotal = SR + SY + SB = Σ(V × I)
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Capacity loading demand on feeder transformer
          </div>
        </div>

        {/* 6. Total Reactive Power */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Total Reactive Power (Qtotal)</span>
            <OriginBadge origin="CALCULATED" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-sans text-amber-700">
              {calculated.totalReactivePowerKVAR.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-slate-500">kVAR</span>
          </div>
          <div className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
            Qtotal = √(Stotal² - Ptotal²)
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Magnetizing reactive burden on distribution grid
          </div>
        </div>

        {/* 7. True System Power Factor */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>True System Power Factor</span>
            <OriginBadge origin="CALCULATED" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-sans ${
              calculated.totalPowerFactor < selectedStandard.minimumPowerFactor ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {calculated.totalPowerFactor.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-slate-500">Lagging</span>
          </div>
          <div className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            PFtotal = Ptotal / Stotal
          </div>
          <div className="text-[10px] text-emerald-700 font-mono">
            Standard: ≥ {selectedStandard.minimumPowerFactor}
          </div>
        </div>

        {/* 8. Frequency Deviation */}
        <div className="apple-card p-4 space-y-2 bg-white">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Frequency Deviation (Δf)</span>
            <OriginBadge origin="CALCULATED" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-sans text-[#1D1D1F]">
              {calculated.frequencyDeviation >= 0 ? `+${calculated.frequencyDeviation.toFixed(3)}` : calculated.frequencyDeviation.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-slate-500">Hz</span>
          </div>
          <div className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            Δf = f_meas - {selectedStandard.nominalFrequency} Hz
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Target: {selectedStandard.nominalFrequency}.0 Hz (±{selectedStandard.frequencyToleranceUpper}Hz)
          </div>
        </div>
      </div>

      {/* Educational Callout on Power Factor Computation */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs font-mono text-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#0071E3] shrink-0 mt-0.5" />
        <div>
          <span className="text-[#0071E3] font-bold">Important Engineering Viva Note on Total Power Factor:</span>{' '}
          The overall three-phase power factor is strictly calculated from the total active power divided by total apparent power:{' '}
          <span className="text-slate-900 font-bold">PFtotal = (PR + PY + PB) / (VR×IR + VY×IY + VB×IB)</span>. 
          Do not calculate an arithmetic average of individual phase power factors ((PFR + PFY + PFB) / 3), as simple averaging ignores the unequal real power weighting carried by each phase conductor.
        </div>
      </div>

      {/* Visual Diagnostic Tools Grid: Imbalance Gauges, Phasor Diagram & Power Triangle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Voltage Imbalance Gauge (L-N and L-L) */}
        <div className="apple-card p-4 flex flex-col justify-between bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-[#0071E3]" />
              <h4 className="text-xs font-semibold text-[#1D1D1F]">Voltage Imbalance (VIF)</h4>
            </div>
            <OriginBadge origin="DERIVED" />
          </div>
          <SemiGauge
            value={calculated.voltageImbalancePercent}
            max={5.0}
            limit={selectedStandard.maxVoltageImbalance}
            unit="%"
            label="NEMA / IEEE V_imb"
          />
          <div className="text-[10px] font-mono text-slate-500 mt-2 text-center">
            Line-to-Line V_imb: <strong className="text-slate-800">{calculated.lineLineImbalancePercent.toFixed(2)}%</strong> (CEA Limit: 2.0%)
          </div>
        </div>

        {/* Current Imbalance Gauge */}
        <div className="apple-card p-4 flex flex-col justify-between bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#0071E3]" />
              <h4 className="text-xs font-semibold text-[#1D1D1F]">Current Imbalance</h4>
            </div>
            <OriginBadge origin="DERIVED" />
          </div>
          <SemiGauge
            value={calculated.currentImbalancePercent}
            max={25.0}
            limit={selectedStandard.maxCurrentImbalance}
            unit="%"
            label="Current Asymmetry"
            isCurrent={true}
          />
          <p className="text-[10px] font-mono text-slate-500 mt-2 text-center">
            (Max Dev from Iavg / Iavg) × 100 • Limit: 10.0%
          </p>
        </div>

        {/* Polar Phasor Vector Canvas */}
        <div className="lg:col-span-1">
          <PhasorCanvas />
        </div>

        {/* Power Triangle Canvas */}
        <div className="lg:col-span-1">
          <PowerTriangleCanvas />
        </div>
      </div>

      {/* Estimated Neutral Return Current (4-Wire Star Bonus) */}
      <div className="apple-card p-4 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#1D1D1F]">Estimated Neutral Conductor Current (IN)</h4>
              <OriginBadge origin="CALCULATED" />
            </div>
            <p className="text-xs text-slate-500 font-mono">
              IN ≈ √(IR² + IY² + IB² - (IR·IY + IY·IB + IB·IR)) • Assumes 120° fundamental phase displacement
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-xs text-slate-500">Estimated Current:</span>
          <span className={`text-2xl font-bold font-sans ${
            calculated.neutralCurrentEstimated > 4.0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {calculated.neutralCurrentEstimated.toFixed(2)} A
          </span>
          <span className="text-[10px] text-slate-400">
            ({((calculated.neutralCurrentEstimated / (calculated.averageCurrent || 1)) * 100).toFixed(0)}% of Iavg)
          </span>
        </div>
      </div>
    </section>
  );
};
