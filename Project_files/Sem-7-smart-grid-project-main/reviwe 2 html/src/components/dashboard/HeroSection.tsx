import React from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { 
  Zap, 
  Activity, 
  Cpu, 
  Wifi, 
  ArrowRight, 
  Layers, 
  Radio
} from 'lucide-react';

interface HeroSectionProps {
  onExplore: () => void;
  onTechOverview: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore, onTechOverview }) => {
  const { phaseR, phaseY, phaseB, calculated, healthScore } = usePowerData();

  return (
    <section className="relative overflow-hidden pt-4 pb-8">
      {/* Ambient subtle light glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Text Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0071E3] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-ping" />
              <span>CEA 2019 & IEEE 519 Compliant • Dual 415V/230V Analysis</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1D1D1F] tracking-tight leading-tight">
              Understand Your Power. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071E3] via-blue-600 to-indigo-600">
                Predict Your Problems.
              </span>
            </h1>

            <p className="text-base text-slate-600 font-normal leading-relaxed">
              A smart three-phase power monitoring platform that transforms electrical measurements into actionable power-quality insights, statutory CEA grid compliance, and predictive health scoring.
            </p>

            <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] shadow-apple-sm text-xs text-slate-600 font-mono space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Radio className="w-3.5 h-3.5 text-[#0071E3] animate-pulse" />
                <span>Dual 3-Phase (415V) & Single-Phase (230V) Telemetry:</span>
              </div>
              <p className="text-slate-500">
                Continuous RMS sampling of Voltage, Current, Active Power, Power Factor, Frequency, and Energy across three individual phases via optical-isolated PZEM-004T modules.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onExplore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-sm transition-all shadow-md"
              >
                <Activity className="w-4 h-4" />
                <span>Explore Live Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onTechOverview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-200 transition-colors shadow-apple-sm"
              >
                <Cpu className="w-4 h-4 text-[#0071E3]" />
                <span>Hardware Architecture</span>
              </button>
            </div>

            {/* Hero Quick Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/80">
              <div className="p-3 rounded-xl bg-white border border-black/[0.06] shadow-apple-sm">
                <div className="text-xl font-bold font-sans text-[#0071E3]">3 Phases</div>
                <div className="text-[11px] text-slate-500">415V L-L / 230V L-N</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/[0.06] shadow-apple-sm">
                <div className="text-xl font-bold font-sans text-emerald-600">1000ms</div>
                <div className="text-[11px] text-slate-500">True RMS Sampling</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/[0.06] shadow-apple-sm">
                <div className="text-xl font-bold font-sans text-amber-600">CEA 2019</div>
                <div className="text-[11px] text-slate-500">Statutory Standard</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/[0.06] shadow-apple-sm">
                <div className="text-xl font-bold font-sans text-purple-600">{healthScore.overallScore}/100</div>
                <div className="text-[11px] text-slate-500">Analytical Health</div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Column: Apple Flow Diagram */}
          <div className="lg:col-span-6">
            <div className="apple-card p-5 bg-white border-black/[0.06] shadow-apple-card relative">
              {/* Card Title */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0071E3]" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
                    Live Telemetry Pipeline Flow
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  3 Channels Synchronous
                </span>
              </div>

              {/* Visual Flow Diagram */}
              <div className="space-y-3">
                {/* 1. Three Input Grid Lines (R, Y, B) */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* R Phase Node */}
                  <div className="p-3 rounded-xl bg-red-50/60 border border-red-200/80">
                    <div className="flex items-center justify-between">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] shadow-sm" />
                      <span className="text-[10px] font-mono text-[#FF3B30] font-bold">Phase R</span>
                    </div>
                    <div className="mt-1.5 text-base font-bold font-sans text-[#1D1D1F]">
                      {phaseR.voltage.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">V</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {phaseR.current.toFixed(2)} A • PZEM R
                    </div>
                  </div>

                  {/* Y Phase Node */}
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                    <div className="flex items-center justify-between">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500] shadow-sm" />
                      <span className="text-[10px] font-mono text-amber-700 font-bold">Phase Y</span>
                    </div>
                    <div className="mt-1.5 text-base font-bold font-sans text-[#1D1D1F]">
                      {phaseY.voltage.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">V</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {phaseY.current.toFixed(2)} A • PZEM Y
                    </div>
                  </div>

                  {/* B Phase Node */}
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80">
                    <div className="flex items-center justify-between">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] shadow-sm" />
                      <span className="text-[10px] font-mono text-[#007AFF] font-bold">Phase B</span>
                    </div>
                    <div className="mt-1.5 text-base font-bold font-sans text-[#1D1D1F]">
                      {phaseB.voltage.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">V</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {phaseB.current.toFixed(2)} A • PZEM B
                    </div>
                  </div>
                </div>

                {/* Flow Arrow */}
                <div className="flex items-center justify-center py-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
                    <span>Modbus RTU UART Multi-drop (9600 Baud)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* 2. ESP32 Controller Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0071E3] shadow-sm">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1D1D1F]">ESP32 DevKit V1 Edge Master</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Dual Core Xtensa 240MHz • FreeRTOS Scheduler
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-emerald-700 font-bold">99.7% PACKET RX</div>
                    <div className="text-slate-400">UART2 Multi-Slave</div>
                  </div>
                </div>

                {/* Wi-Fi Arrow */}
                <div className="flex items-center justify-center py-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#0071E3] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <Wifi className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>Wi-Fi 802.11 b/g/n (WebSocket Telemetry JSON)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0071E3]" />
                  </div>
                </div>

                {/* 3. Web Dashboard Box */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center text-white font-bold shadow-sm">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Apple-Style PowerPulse 3Φ</div>
                      <div className="text-[11px] font-mono text-[#0071E3]">
                        Ptotal: {calculated.totalActivePowerKW.toFixed(2)} kW • PF: {calculated.totalPowerFactor.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-700">
                      Score: {healthScore.overallScore}/100
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      V_LL,avg: {calculated.averageLineLineVoltage.toFixed(1)}V
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
