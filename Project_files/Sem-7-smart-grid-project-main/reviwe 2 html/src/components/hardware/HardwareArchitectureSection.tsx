import React from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { ESP32_SPEC, PZEM_SPEC } from '../../data/hardwareData';
import { OriginBadge } from '../common/Badge';
import { 
  Cpu, 
  Layers, 
  Radio, 
  ShieldAlert, 
  AlertTriangle, 
  GitFork, 
  Zap, 
  Server 
} from 'lucide-react';

export const HardwareArchitectureSection: React.FC = () => {
  const { phaseR, phaseY, phaseB, sensorsStatus } = usePowerData();

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              ESP32 + PZEM-004T Hardware Architecture & Sensor Mapping
            </h2>
            <OriginBadge origin="MEASURED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Physical signal acquisition, galvanic optical isolation, Modbus multi-drop UART, and IoT edge pipeline
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          Galvanic Isolation: 2500V RMS Optocoupler Barrier
        </div>
      </div>

      {/* Comprehensive System Topology Block Diagram */}
      <div className="apple-card p-6 space-y-4 bg-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0071E3]" />
            <h3 className="text-sm font-bold text-[#1D1D1F] font-mono uppercase tracking-wider">
              End-to-End System Block Diagram
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold">
            Synchronous 3-Phase Telemetry
          </span>
        </div>

        {/* Visual Architecture Schematic Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center font-mono">
          
          {/* Column 1: Grid Input & CTs */}
          <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>1. Three-Phase Grid</span>
            </div>
            
            <div className="p-2 rounded-lg bg-red-50/70 border border-red-200 text-xs text-rose-800">
              <strong>Phase R (L1):</strong> 230V Tap + 100A CT
            </div>
            <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
              <strong>Phase Y (L2):</strong> 230V Tap + 100A CT
            </div>
            <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-800">
              <strong>Phase B (L3):</strong> 230V Tap + 100A CT
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600">
              <strong>Neutral:</strong> Common Reference
            </div>
          </div>

          {/* Column 2: 3x PZEM-004T Sensor Units */}
          <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>2. Dedicated PZEM Modules</span>
            </div>
            
            <div className="p-2 rounded-lg bg-white border border-red-200 text-xs shadow-apple-sm">
              <div className="font-bold text-[#FF3B30]">PZEM-004T (R)</div>
              <div className="text-[10px] text-slate-500">Slave 0x01 • V9881D ASIC</div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-amber-200 text-xs shadow-apple-sm">
              <div className="font-bold text-[#FF9500]">PZEM-004T (Y)</div>
              <div className="text-[10px] text-slate-500">Slave 0x02 • V9881D ASIC</div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-blue-200 text-xs shadow-apple-sm">
              <div className="font-bold text-[#007AFF]">PZEM-004T (B)</div>
              <div className="text-[10px] text-slate-500">Slave 0x03 • V9881D ASIC</div>
            </div>

            <div className="text-[10px] text-slate-500 text-center">
              TTL Optocoupler Isolation
            </div>
          </div>

          {/* Column 3: ESP32 Edge Master */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
            <div className="text-[11px] font-bold text-[#0071E3] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>3. ESP32 Controller</span>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] shadow-sm">
                <strong>UART Task:</strong> Modbus polling (1000ms)
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] shadow-sm">
                <strong>Network:</strong> WebSocket JSON broadcast
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] shadow-sm">
                <strong>FreeRTOS:</strong> Dual Core 240MHz
              </div>
            </div>

            <div className="text-[10px] text-emerald-700 font-bold text-center">
              Wi-Fi AP / Station Mode
            </div>
          </div>

          {/* Column 4: Web Application Edge Client */}
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-3">
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              <span>4. Web Platform</span>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] shadow-sm">
                <strong>Live UI:</strong> 60 FPS Canvas Waveforms
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] shadow-sm">
                <strong>3-Phase Engine:</strong> 415V L-L & 230V L-N
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] shadow-sm">
                <strong>Scoring:</strong> Health & ML Forecasting
              </div>
            </div>

            <div className="text-[10px] text-[#0071E3] font-bold text-center">
              CEA 2019 / IEEE Audit
            </div>
          </div>

        </div>
      </div>

      {/* Three-Phase Sensor Mapping Communication Tree */}
      <div className="apple-card p-6 space-y-4 bg-white">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-[#0071E3]" />
            <h3 className="text-sm font-bold text-[#1D1D1F] font-mono uppercase tracking-wider">
              Sensor Mapping & Hardware Bus Topology
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Multi-drop Modbus RTU Address Mapping
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sensorsStatus.map(s => {
            const phaseData = s.phase === 'R' ? phaseR : s.phase === 'Y' ? phaseY : phaseB;
            const phaseColor = s.phase === 'R' ? 'border-red-200 bg-red-50/20' : s.phase === 'Y' ? 'border-amber-200 bg-amber-50/20' : 'border-blue-200 bg-blue-50/20';

            return (
              <div key={s.phase} className={`p-4 rounded-xl border ${phaseColor} space-y-2.5 font-mono text-xs bg-white shadow-apple-sm`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <strong className="text-slate-900">Phase {s.phase} Sensor</strong>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    ID: {s.deviceId}
                  </span>
                </div>

                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modbus Address:</span>
                    <span className="font-bold text-[#0071E3]">0x0{s.modbusAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voltage Reading:</span>
                    <span className="font-bold text-slate-900">{phaseData.voltage.toFixed(1)} V</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Reading:</span>
                    <span className="font-bold text-slate-900">{phaseData.current.toFixed(2)} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Power:</span>
                    <span className="font-bold text-slate-900">{(phaseData.activePower / 1000).toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power Factor:</span>
                    <span className="font-bold text-slate-900">{phaseData.powerFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packet Success:</span>
                    <span className="font-bold text-emerald-700">{s.packetSuccessRate}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                  <span>Firmware: {s.firmwareVersion}</span>
                  <span>Latency: {s.lastSeenMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Specifications Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* ESP32 Specification Card */}
        <div className="apple-card p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 text-[#0071E3] font-mono font-bold text-sm pb-2 border-b border-slate-100">
            <Cpu className="w-4 h-4" />
            <span>Why ESP32 DevKit V1? (Technical Specs)</span>
          </div>

          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            {ESP32_SPEC.description}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border border-slate-200 rounded-xl overflow-hidden">
              <tbody className="divide-y divide-slate-100">
                {ESP32_SPEC.parameters.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-500 font-medium">{p.key}</td>
                    <td className="p-2.5 text-slate-900 font-bold">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Hardware Caution:</strong> {ESP32_SPEC.datasheetCaution}
            </div>
          </div>
        </div>

        {/* PZEM-004T Specification Card */}
        <div className="apple-card p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 text-[#0071E3] font-mono font-bold text-sm pb-2 border-b border-slate-100">
            <Radio className="w-4 h-4" />
            <span>Why PZEM-004T v3.0? (Measurement Specs)</span>
          </div>

          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            {PZEM_SPEC.description}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border border-slate-200 rounded-xl overflow-hidden">
              <tbody className="divide-y divide-slate-100">
                {PZEM_SPEC.parameters.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-500 font-medium">{p.key}</td>
                    <td className="p-2.5 text-slate-900 font-bold">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-mono text-rose-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Datasheet Safety Rule:</strong> {PZEM_SPEC.datasheetCaution}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
