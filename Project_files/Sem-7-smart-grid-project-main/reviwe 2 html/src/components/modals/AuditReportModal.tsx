import React from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { 
  FileText, 
  Printer, 
  X, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({ isOpen, onClose }) => {
  const { 
    phaseR, 
    phaseY, 
    phaseB, 
    calculated, 
    healthScore, 
    selectedStandard, 
    lastUpdated 
  } = usePowerData();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reportId = `PQ-AUDIT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const isVImbPass = calculated.voltageImbalancePercent <= selectedStandard.maxVoltageImbalance;
  const isPFPass = calculated.totalPowerFactor >= selectedStandard.minimumPowerFactor;
  const isFDevPass = Math.abs(calculated.frequencyDeviation) <= selectedStandard.frequencyToleranceUpper;
  const isVNomPass = Math.abs(calculated.voltageDeviationPercent) <= selectedStandard.voltageToleranceUpper;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl p-8 relative my-8 font-sans max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:m-0 print:p-6 print:rounded-none">
        
        {/* Action controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-mono font-bold">
              Printable PDF Audit Preview
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Ready for examiner portfolio
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formal Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">
                Electrical Engineering Department • Final Year Project Evaluation
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                THREE-PHASE POWER QUALITY & COMPLIANCE AUDIT REPORT
              </h1>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                Target Platform: ESP32 Microcontroller + 3× PZEM-004T Optical-Isolated Sensors
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
              <div><strong>Report ID:</strong> {reportId}</div>
              <div><strong>Date:</strong> {reportDate}</div>
              <div><strong>Sync Time:</strong> {lastUpdated}</div>
              <div className="text-emerald-700 font-bold">Status: GENERATED</div>
            </div>
          </div>
        </div>

        {/* Executive Summary & Composite Health Score */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">Executive Evaluation:</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {healthScore.conditionRating} Condition
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono">
              Grade Score: <strong>{healthScore.overallScore} / 100 PTS</strong>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">Regulatory Baseline:</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {selectedStandard.name}
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono">
              Ref: {selectedStandard.authority}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">System Demand:</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5 font-mono">
              {calculated.totalActivePowerKW.toFixed(2)} kW
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono">
              Total Apparent: {calculated.totalApparentPowerKVA.toFixed(2)} kVA
            </div>
          </div>
        </div>

        {/* Section 1: Measured Physical Telemetry (From PZEM-004T) */}
        <div className="mb-6">
          <h2 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>1. Measured Physical Phase Telemetry (Direct PZEM-004T Inputs)</span>
          </h2>
          <table className="w-full text-xs font-mono text-left border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
              <tr>
                <th className="p-2">Phase</th>
                <th className="p-2">Voltage (V RMS)</th>
                <th className="p-2">Current (A RMS)</th>
                <th className="p-2">Active Power (kW)</th>
                <th className="p-2">Power Factor</th>
                <th className="p-2">Frequency (Hz)</th>
                <th className="p-2">Energy (kWh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 font-bold text-rose-600">Phase R (L1)</td>
                <td className="p-2">{phaseR.voltage.toFixed(1)} V</td>
                <td className="p-2">{phaseR.current.toFixed(2)} A</td>
                <td className="p-2">{(phaseR.activePower/1000).toFixed(3)} kW</td>
                <td className="p-2">{phaseR.powerFactor.toFixed(2)}</td>
                <td className="p-2">{phaseR.frequency.toFixed(2)} Hz</td>
                <td className="p-2">{phaseR.energy.toFixed(2)} kWh</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-amber-600">Phase Y (L2)</td>
                <td className="p-2">{phaseY.voltage.toFixed(1)} V</td>
                <td className="p-2">{phaseY.current.toFixed(2)} A</td>
                <td className="p-2">{(phaseY.activePower/1000).toFixed(3)} kW</td>
                <td className="p-2">{phaseY.powerFactor.toFixed(2)}</td>
                <td className="p-2">{phaseY.frequency.toFixed(2)} Hz</td>
                <td className="p-2">{phaseY.energy.toFixed(2)} kWh</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-cyan-600">Phase B (L3)</td>
                <td className="p-2">{phaseB.voltage.toFixed(1)} V</td>
                <td className="p-2">{phaseB.current.toFixed(2)} A</td>
                <td className="p-2">{(phaseB.activePower/1000).toFixed(3)} kW</td>
                <td className="p-2">{phaseB.powerFactor.toFixed(2)}</td>
                <td className="p-2">{phaseB.frequency.toFixed(2)} Hz</td>
                <td className="p-2">{phaseB.energy.toFixed(2)} kWh</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Calculated Three-Phase Quantities */}
        <div className="mb-6">
          <h2 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider mb-2">
            2. Calculated Three-Phase Electrical Parameters (Software Formulations)
          </h2>
          <table className="w-full text-xs font-mono text-left border border-slate-300">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 font-bold text-slate-700 bg-slate-50 w-1/3">Average Phase Voltage (Vavg):</td>
                <td className="p-2">{calculated.averageVoltage.toFixed(2)} V RMS</td>
                <td className="p-2 font-bold text-slate-700 bg-slate-50 w-1/3">Total Active Power (Ptotal):</td>
                <td className="p-2">{calculated.totalActivePowerKW.toFixed(3)} kW</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-700 bg-slate-50">Average Phase Current (Iavg):</td>
                <td className="p-2">{calculated.averageCurrent.toFixed(2)} A RMS</td>
                <td className="p-2 font-bold text-slate-700 bg-slate-50">Total Apparent Power (Stotal):</td>
                <td className="p-2">{calculated.totalApparentPowerKVA.toFixed(3)} kVA</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-700 bg-slate-50">Total Reactive Power (Qtotal):</td>
                <td className="p-2">{calculated.totalReactivePowerKVAR.toFixed(3)} kVAR</td>
                <td className="p-2 font-bold text-slate-700 bg-slate-50">System Power Factor (Ptotal/Stotal):</td>
                <td className="p-2 font-bold text-blue-700">{calculated.totalPowerFactor.toFixed(3)}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-700 bg-slate-50">Voltage Imbalance (% VIF):</td>
                <td className="p-2 font-bold">{calculated.voltageImbalancePercent.toFixed(2)} %</td>
                <td className="p-2 font-bold text-slate-700 bg-slate-50">Current Imbalance (%):</td>
                <td className="p-2 font-bold">{calculated.currentImbalancePercent.toFixed(2)} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Statutory Standards Compliance Matrix */}
        <div className="mb-6">
          <h2 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider mb-2">
            3. Standards Compliance Audit Matrix ({selectedStandard.name})
          </h2>
          <table className="w-full text-xs font-mono text-left border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
              <tr>
                <th className="p-2">Criterion</th>
                <th className="p-2">Measured / Calculated</th>
                <th className="p-2">Permissible Limit</th>
                <th className="p-2">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 font-bold">Voltage Tolerance</td>
                <td className="p-2">{calculated.averageVoltage.toFixed(1)} V ({calculated.voltageDeviationPercent >= 0 ? `+${calculated.voltageDeviationPercent.toFixed(1)}` : calculated.voltageDeviationPercent.toFixed(1)}%)</td>
                <td className="p-2">±{selectedStandard.voltageToleranceUpper}% of {selectedStandard.nominalVoltage}V</td>
                <td className="p-2 font-bold">{isVNomPass ? <span className="text-emerald-700">✓ COMPLIANT</span> : <span className="text-rose-700">❌ BREACH</span>}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold">Voltage Imbalance</td>
                <td className="p-2">{calculated.voltageImbalancePercent.toFixed(2)} %</td>
                <td className="p-2">≤ {selectedStandard.maxVoltageImbalance.toFixed(1)} % (CEA Standard)</td>
                <td className="p-2 font-bold">{isVImbPass ? <span className="text-emerald-700">✓ COMPLIANT</span> : <span className="text-rose-700">❌ NON-COMPLIANT</span>}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold">Power Factor Benchmark</td>
                <td className="p-2">{calculated.totalPowerFactor.toFixed(3)} Lag</td>
                <td className="p-2">≥ {selectedStandard.minimumPowerFactor.toFixed(2)} Lag</td>
                <td className="p-2 font-bold">{isPFPass ? <span className="text-emerald-700">✓ COMPLIANT</span> : <span className="text-amber-700">⚠️ SURCHARGE RISK</span>}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold">Frequency Stability</td>
                <td className="p-2">{phaseR.frequency.toFixed(2)} Hz (Δf: {calculated.frequencyDeviation.toFixed(3)}Hz)</td>
                <td className="p-2">±{selectedStandard.frequencyToleranceUpper} Hz</td>
                <td className="p-2 font-bold">{isFDevPass ? <span className="text-emerald-700">✓ COMPLIANT</span> : <span className="text-rose-700">❌ BREACH</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Engineering Remediation Guidance */}
        <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider mb-1.5">
            4. Engineering Diagnostic Guidance & Actions:
          </h3>
          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
            {healthScore.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Official Sign-Off Verification Blocks */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 font-mono text-xs">
          <div>
            <div className="h-12 border-b border-slate-400 mb-1"></div>
            <div className="font-bold text-slate-800">Student Candidate Signature</div>
            <div className="text-[11px] text-slate-500">B.Tech / B.E. Electrical & Electronics Engg</div>
          </div>

          <div>
            <div className="h-12 border-b border-slate-400 mb-1"></div>
            <div className="font-bold text-slate-800">External Examiner / Project Guide Sign-Off</div>
            <div className="text-[11px] text-slate-500">Evaluation Review Panel • Final Capstone</div>
          </div>
        </div>

      </div>
    </div>
  );
};
