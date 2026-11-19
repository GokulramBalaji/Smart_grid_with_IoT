import React, { useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { PowerQualityStandard } from '../../types/power';
import { OriginBadge } from '../common/Badge';
import { 
  ShieldCheck, 
  RotateCcw, 
  Download, 
  ExternalLink, 
  Edit3, 
  Check, 
  Sliders, 
  AlertCircle,
  Layers
} from 'lucide-react';

export const StandardsSection: React.FC = () => {
  const { 
    standards, 
    selectedStandard, 
    setSelectedStandardId, 
    updateCustomStandard, 
    resetStandardToDefault 
  } = usePowerData();

  const [activeStandardsView, setActiveStandardsView] = useState<'THREE_PHASE' | 'SINGLE_PHASE' | 'COMBINED'>('COMBINED');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customForm, setCustomForm] = useState<Partial<PowerQualityStandard>>({
    nominalVoltage: selectedStandard.nominalVoltage,
    voltageToleranceLower: selectedStandard.voltageToleranceLower,
    voltageToleranceUpper: selectedStandard.voltageToleranceUpper,
    nominalLineLineVoltage: selectedStandard.nominalLineLineVoltage,
    lineLineToleranceLower: selectedStandard.lineLineToleranceLower,
    lineLineToleranceUpper: selectedStandard.lineLineToleranceUpper,
    nominalFrequency: selectedStandard.nominalFrequency,
    frequencyToleranceLower: selectedStandard.frequencyToleranceLower,
    frequencyToleranceUpper: selectedStandard.frequencyToleranceUpper,
    minimumPowerFactor: selectedStandard.minimumPowerFactor,
    maxVoltageImbalance: selectedStandard.maxVoltageImbalance,
    maxCurrentImbalance: selectedStandard.maxCurrentImbalance,
    thdVoltageLimit: selectedStandard.thdVoltageLimit,
    thdCurrentLimit: selectedStandard.thdCurrentLimit,
  });

  const handleSaveCustom = () => {
    updateCustomStandard(customForm);
    setSelectedStandardId('CUSTOM');
    setIsEditingCustom(false);
  };

  const handleExportStandards = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedStandard, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `standard_config_${selectedStandard.id.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Power Quality Standards (Three-Phase 415V & Single-Phase 230V)
            </h2>
            <OriginBadge origin="DERIVED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Statutory grid compliance baselines from Central Electricity Authority (CEA 2019 India), IEC 61000-4-30, and IEEE 519
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={resetStandardToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-apple-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to CEA Defaults</span>
          </button>

          <button
            onClick={handleExportStandards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0071E3] border border-blue-200 transition-colors shadow-apple-sm font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Configuration</span>
          </button>
        </div>
      </div>

      {/* Grid Standard Preset Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {standards.map(std => {
          const isSelected = selectedStandard.id === std.id;
          return (
            <div
              key={std.id}
              onClick={() => setSelectedStandardId(std.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border bg-white ${
                isSelected
                  ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20 shadow-apple-hover'
                  : 'border-black/[0.06] hover:border-slate-300 shadow-apple-card'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {std.systemType}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#0071E3]" />
                )}
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-1 leading-tight">{std.name}</h3>
              <p className="text-[11px] text-slate-500 line-clamp-2">{std.authority}</p>
              
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="font-semibold text-[#0071E3]">3Φ: {std.nominalLineLineVoltage}V</span>
                <span>1Φ: {std.nominalVoltage}V</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standards View Switcher (Three-Phase vs Single-Phase vs Combined) */}
      <div className="apple-card p-3 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-500">Standards Scope:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => setActiveStandardsView('COMBINED')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeStandardsView === 'COMBINED'
                  ? 'bg-white text-[#0071E3] font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combined (3Φ & 1Φ) Matrix
            </button>
            <button
              onClick={() => setActiveStandardsView('THREE_PHASE')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeStandardsView === 'THREE_PHASE'
                  ? 'bg-white text-[#0071E3] font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Three-Phase (415V L-L) Only
            </button>
            <button
              onClick={() => setActiveStandardsView('SINGLE_PHASE')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeStandardsView === 'SINGLE_PHASE'
                  ? 'bg-white text-[#0071E3] font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single-Phase (230V L-N) Only
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Selected Standard: <strong className="text-slate-900">{selectedStandard.name}</strong>
        </div>
      </div>

      {/* Active Standard Details & Comprehensive Audit Table */}
      <div className="apple-card p-6 space-y-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0071E3] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Active Benchmark
              </span>
              <h3 className="text-base font-bold text-[#1D1D1F]">{selectedStandard.name}</h3>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Source: {selectedStandard.sourceRegulation}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedStandard.citationUrl && selectedStandard.citationUrl !== '#' && (
              <a
                href={selectedStandard.citationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-[#0071E3] hover:underline"
              >
                <span>Official Gazetted Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {selectedStandard.isEditable && (
              <button
                onClick={() => setIsEditingCustom(!isEditingCustom)}
                className="flex items-center gap-1 px-3 py-1 text-xs font-mono font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingCustom ? 'Close Editor' : 'Edit Custom Limits'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Limit Editor Form (if Custom is selected) */}
        {isEditingCustom && (
          <div className="p-4 rounded-xl bg-slate-50 border border-amber-300 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-800">
              <Sliders className="w-4 h-4" />
              <span>Custom Standards Laboratory Parameter Editor (3Φ & 1Φ)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Three-Phase Voltage (V L-L):</label>
                <input
                  type="number"
                  value={customForm.nominalLineLineVoltage || 415}
                  onChange={(e) => setCustomForm({ ...customForm, nominalLineLineVoltage: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">3Φ Voltage Tol Lower (%):</label>
                <input
                  type="number"
                  value={customForm.lineLineToleranceLower || -6.0}
                  onChange={(e) => setCustomForm({ ...customForm, lineLineToleranceLower: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">3Φ Voltage Tol Upper (%):</label>
                <input
                  type="number"
                  value={customForm.lineLineToleranceUpper || 6.0}
                  onChange={(e) => setCustomForm({ ...customForm, lineLineToleranceUpper: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Single-Phase Voltage (V L-N):</label>
                <input
                  type="number"
                  value={customForm.nominalVoltage || 230}
                  onChange={(e) => setCustomForm({ ...customForm, nominalVoltage: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Nominal Frequency (Hz):</label>
                <input
                  type="number"
                  value={customForm.nominalFrequency || 50.0}
                  onChange={(e) => setCustomForm({ ...customForm, nominalFrequency: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Freq Tol Upper (Hz):</label>
                <input
                  type="number"
                  value={customForm.frequencyToleranceUpper || 0.5}
                  onChange={(e) => setCustomForm({ ...customForm, frequencyToleranceUpper: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Minimum Power Factor:</label>
                <input
                  type="number"
                  step="0.01"
                  value={customForm.minimumPowerFactor || 0.90}
                  onChange={(e) => setCustomForm({ ...customForm, minimumPowerFactor: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Max Voltage Imbalance (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={customForm.maxVoltageImbalance || 2.0}
                  onChange={(e) => setCustomForm({ ...customForm, maxVoltageImbalance: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingCustom(false)}
                className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Save Custom Standard</span>
              </button>
            </div>
          </div>
        )}

        {/* Structured Standards Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3">Standard Parameter</th>
                <th className="p-3">Scope</th>
                <th className="p-3">Nominal Value</th>
                <th className="p-3">Lower Permissible Limit</th>
                <th className="p-3">Upper Permissible Limit</th>
                <th className="p-3">Statutory Scope & Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              
              {/* Three-Phase Line-to-Line Standard Row */}
              {(activeStandardsView === 'COMBINED' || activeStandardsView === 'THREE_PHASE') && (
                <tr className="hover:bg-slate-50/70 bg-blue-50/20">
                  <td className="p-3 font-semibold text-[#0071E3] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0071E3]" />
                    <span>Three-Phase Voltage (Line-to-Line)</span>
                  </td>
                  <td className="p-3 font-bold text-[#0071E3]">3-Phase (L-L)</td>
                  <td className="p-3 font-bold text-slate-900">{selectedStandard.nominalLineLineVoltage} V</td>
                  <td className="p-3 text-rose-600 font-bold">
                    {(selectedStandard.nominalLineLineVoltage * (1 + selectedStandard.lineLineToleranceLower / 100)).toFixed(1)} V ({selectedStandard.lineLineToleranceLower}%)
                  </td>
                  <td className="p-3 text-rose-600 font-bold">
                    {(selectedStandard.nominalLineLineVoltage * (1 + selectedStandard.lineLineToleranceUpper / 100)).toFixed(1)} V (+{selectedStandard.lineLineToleranceUpper}%)
                  </td>
                  <td className="p-3 text-slate-600">CEA Grid Regulation (415V/400V 3-Phase Industrial / Commercial Interconnection)</td>
                </tr>
              )}

              {/* Single-Phase Line-to-Neutral Standard Row */}
              {(activeStandardsView === 'COMBINED' || activeStandardsView === 'SINGLE_PHASE') && (
                <tr className="hover:bg-slate-50/70">
                  <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Single-Phase Voltage (Line-to-Neutral)</span>
                  </td>
                  <td className="p-3 font-medium text-slate-600">1-Phase (L-N)</td>
                  <td className="p-3 font-bold text-slate-900">{selectedStandard.nominalVoltage} V</td>
                  <td className="p-3 text-rose-600 font-bold">
                    {(selectedStandard.nominalVoltage * (1 + selectedStandard.voltageToleranceLower / 100)).toFixed(1)} V ({selectedStandard.voltageToleranceLower}%)
                  </td>
                  <td className="p-3 text-rose-600 font-bold">
                    {(selectedStandard.nominalVoltage * (1 + selectedStandard.voltageToleranceUpper / 100)).toFixed(1)} V (+{selectedStandard.voltageToleranceUpper}%)
                  </td>
                  <td className="p-3 text-slate-600">Low Tension (LT) Consumer Terminal Supply Code</td>
                </tr>
              )}

              {/* Grid Frequency */}
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-semibold text-slate-900">AC Grid Frequency</td>
                <td className="p-3 text-slate-600">Synchronous Grid</td>
                <td className="p-3 font-bold text-slate-900">{selectedStandard.nominalFrequency} Hz</td>
                <td className="p-3 text-rose-600 font-bold">
                  {(selectedStandard.nominalFrequency + selectedStandard.frequencyToleranceLower).toFixed(2)} Hz
                </td>
                <td className="p-3 text-rose-600 font-bold">
                  {(selectedStandard.nominalFrequency + selectedStandard.frequencyToleranceUpper).toFixed(2)} Hz
                </td>
                <td className="p-3 text-slate-600">IEGC Operational Band (49.90 - 50.05 Hz continuous)</td>
              </tr>

              {/* Three-Phase Voltage Imbalance */}
              <tr className="hover:bg-slate-50/70 bg-amber-50/20">
                <td className="p-3 font-semibold text-amber-800">Three-Phase Voltage Imbalance (VIF)</td>
                <td className="p-3 font-bold text-amber-800">3-Phase Symmetry</td>
                <td className="p-3 font-bold text-slate-900">0.00 % (Balanced)</td>
                <td className="p-3 text-slate-400">0.00 %</td>
                <td className="p-3 text-rose-600 font-bold">
                  ≤ {selectedStandard.maxVoltageImbalance.toFixed(1)} %
                </td>
                <td className="p-3 text-slate-600">CEA Grid Regulation (Max 2.0% consumer terminal to prevent motor derating)</td>
              </tr>

              {/* Current Imbalance */}
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-semibold text-slate-900">Current Asymmetry / Imbalance</td>
                <td className="p-3 text-slate-600">3-Phase Feeder</td>
                <td className="p-3 font-bold text-slate-900">0.00 %</td>
                <td className="p-3 text-slate-400">0.00 %</td>
                <td className="p-3 text-rose-600 font-bold">
                  ≤ {selectedStandard.maxCurrentImbalance.toFixed(1)} %
                </td>
                <td className="p-3 text-slate-600">Phase Feeder Distribution Balance Norm</td>
              </tr>

              {/* Power Factor */}
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-semibold text-slate-900">Power Factor Benchmark (cos φ)</td>
                <td className="p-3 text-slate-600">Overall System</td>
                <td className="p-3 font-bold text-slate-900">1.00 (Unity)</td>
                <td className="p-3 text-rose-600 font-bold">
                  ≥ {selectedStandard.minimumPowerFactor.toFixed(2)} Lag
                </td>
                <td className="p-3 text-emerald-700 font-bold">1.00 (Unity)</td>
                <td className="p-3 text-slate-600">Commercial / Industrial Tariff Benchmark (Avoid Discom Surcharge)</td>
              </tr>

              {/* Harmonic Distortion */}
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-semibold text-slate-900">Total Harmonic Distortion (THD-V)</td>
                <td className="p-3 text-slate-600">Power Quality</td>
                <td className="p-3 font-bold text-slate-900">0.00 %</td>
                <td className="p-3 text-slate-400">0.00 %</td>
                <td className="p-3 text-rose-600 font-bold">≤ {selectedStandard.thdVoltageLimit.toFixed(1)} %</td>
                <td className="p-3 text-slate-600">IEEE 519-2014 & CEA 2019 Harmonic Limit at Point of Common Coupling</td>
              </tr>

              {/* Neutral Sizing Rule */}
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-semibold text-slate-900">Neutral Sizing & Grounding</td>
                <td className="p-3 text-slate-600">Safety Standard</td>
                <td className="p-3 font-bold text-slate-900">Solid Ground</td>
                <td colSpan={2} className="p-3 text-slate-700 font-sans">
                  {selectedStandard.neutralSizingRule}
                </td>
                <td className="p-3 text-slate-600">Prevents dangerous floating neutral and neutral conductor thermal burnout</td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Technical Guidance Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600 font-mono">
          <AlertCircle className="w-4 h-4 text-[#0071E3] shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-900">Viva Defense Note on Three-Phase vs Single-Phase Standards:</strong> In India and IEC countries, consumer distribution delivers both 3-Phase 415V (line-to-line between any two phases) for heavy motors and industrial machinery, and Single-Phase 230V (line-to-neutral) for commercial appliances. By Blondel's theorem and three-phase symmetrical relations, V_LL = √3 × V_LN ≈ 1.732 × 230V ≈ 400V - 415V. This platform explicitly verifies compliance across both tiers!
          </p>
        </div>
      </div>
    </section>
  );
};
