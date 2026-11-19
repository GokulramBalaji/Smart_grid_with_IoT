import React from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { OriginBadge, StatusBadge } from '../common/Badge';
import { Layers } from 'lucide-react';

export const PhaseCardsSection: React.FC = () => {
  const { phaseR, phaseY, phaseB, calculated, selectedStandard } = usePowerData();

  const phases = [
    {
      data: phaseR,
      phaseLetter: 'R',
      phaseName: 'Phase R (Line 1)',
      colorHex: '#FF3B30', // Apple System Red
      cardBorder: 'border-red-100 hover:border-red-300',
      badgeBg: 'bg-red-50 text-[#FF3B30] border-red-200',
      accentPill: 'bg-[#FF3B30]',
      lineLinePair: 'V_RY',
      lineLineVal: calculated.voltageRY,
      nominalV: selectedStandard.nominalVoltage
    },
    {
      data: phaseY,
      phaseLetter: 'Y',
      phaseName: 'Phase Y (Line 2)',
      colorHex: '#FF9500', // Apple System Amber / Orange
      cardBorder: 'border-amber-100 hover:border-amber-300',
      badgeBg: 'bg-amber-50 text-[#FF9500] border-amber-200',
      accentPill: 'bg-[#FF9500]',
      lineLinePair: 'V_YB',
      lineLineVal: calculated.voltageYB,
      nominalV: selectedStandard.nominalVoltage
    },
    {
      data: phaseB,
      phaseLetter: 'B',
      phaseName: 'Phase B (Line 3)',
      colorHex: '#007AFF', // Apple System Blue
      cardBorder: 'border-blue-100 hover:border-blue-300',
      badgeBg: 'bg-blue-50 text-[#007AFF] border-blue-200',
      accentPill: 'bg-[#007AFF]',
      lineLinePair: 'V_BR',
      lineLineVal: calculated.voltageBR,
      nominalV: selectedStandard.nominalVoltage
    }
  ];

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
              Three-Phase Direct Physical Telemetry
            </h2>
            <OriginBadge origin="MEASURED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Individual AC parameters acquired via 3× dedicated PZEM-004T v3.0 modules connected in Star (Wye)
          </p>
        </div>

        {/* Global Summary Tag */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="px-3 py-1 rounded-full bg-white border border-black/[0.06] shadow-apple-sm text-slate-700">
            Topology: <span className="text-[#0071E3] font-bold">3Φ 4-Wire (Star / Y)</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white border border-black/[0.06] shadow-apple-sm text-slate-700">
            Standard: <span className="text-amber-700 font-bold">{selectedStandard.nominalLineLineVoltage}V L-L / {selectedStandard.nominalVoltage}V L-N</span>
          </div>
        </div>
      </div>

      {/* The 3 Large Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {phases.map(({ data, phaseLetter, phaseName, colorHex, cardBorder, badgeBg, accentPill, lineLinePair, lineLineVal, nominalV }) => {
          const vDev = data.voltage - nominalV;
          const vDevPct = ((vDev / nominalV) * 100).toFixed(1);
          const isVOutOfSpec = Math.abs(Number(vDevPct)) > Math.abs(selectedStandard.voltageToleranceLower);

          return (
            <div
              key={phaseLetter}
              className={`apple-card p-5 bg-white transition-all duration-300 border ${cardBorder} shadow-apple-card hover:shadow-apple-hover`}
            >
              {/* Top Phase Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div 
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm font-sans text-white shadow-sm ${accentPill}`}
                  >
                    {phaseLetter}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1D1D1F]">{phaseName}</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      Modbus Node 0x0{phaseLetter === 'R' ? '1' : phaseLetter === 'Y' ? '2' : '3'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <OriginBadge origin="MEASURED" />
                  <StatusBadge status={data.status} />
                </div>
              </div>

              {/* Core Primary Metrics (Phase Voltage & Current) */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Voltage Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1">
                    <span>AC Voltage (L-N)</span>
                    <span className={isVOutOfSpec ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                      {vDev >= 0 ? `+${vDev.toFixed(1)}V` : `${vDev.toFixed(1)}V`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold font-sans text-[#1D1D1F] tracking-tight">
                      {data.voltage.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-slate-500">V RMS</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Nominal: {nominalV}V ({vDevPct}%)
                  </div>
                </div>

                {/* Current Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1">
                    <span>AC Current</span>
                    <span className="text-slate-400">100A CT</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold font-sans text-[#1D1D1F] tracking-tight">
                      {data.current.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-500">A RMS</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Loading: {((data.current / 100) * 100).toFixed(1)}% of rating
                  </div>
                </div>
              </div>

              {/* Secondary Telemetry Grid (Power, PF, Frequency, Energy) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* Active Power */}
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Active Power:</span>
                  <span className="font-bold text-[#1D1D1F]">
                    {(data.activePower / 1000).toFixed(2)} <span className="text-slate-400 text-[10px]">kW</span>
                  </span>
                </div>

                {/* Power Factor */}
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Power Factor:</span>
                  <span className={`font-bold ${data.powerFactor < selectedStandard.minimumPowerFactor ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {data.powerFactor.toFixed(2)} <span className="text-slate-400 text-[10px]">Lag</span>
                  </span>
                </div>

                {/* Frequency */}
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Frequency:</span>
                  <span className="font-bold text-[#1D1D1F]">
                    {data.frequency.toFixed(2)} <span className="text-slate-400 text-[10px]">Hz</span>
                  </span>
                </div>

                {/* Energy */}
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Energy:</span>
                  <span className="font-bold text-[#0071E3]">
                    {data.energy.toFixed(1)} <span className="text-slate-400 text-[10px]">kWh</span>
                  </span>
                </div>
              </div>

              {/* Three-Phase Line-to-Line Voltage Row */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Line-to-Line Voltage ({lineLinePair}):</span>
                <span className="text-[#0071E3] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  {lineLineVal.toFixed(1)} V (3Φ)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
