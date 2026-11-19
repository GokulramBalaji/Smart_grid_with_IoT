import React, { useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { CircularHealthGauge } from '../common/Gauge';
import { OriginBadge } from '../common/Badge';
import { 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Info,
  Zap,
  HelpCircle
} from 'lucide-react';

export const HealthScoreSection: React.FC = () => {
  const { healthScore, calculated, selectedStandard } = usePowerData();
  const [showThresholdExplainer, setShowThresholdExplainer] = useState(true);

  const subScores = [
    {
      name: 'Voltage Quality Index (L-N & L-L)',
      weight: '25%',
      score: healthScore.voltageScore,
      description: `Deviation from ${selectedStandard.nominalLineLineVoltage}V L-L and ${selectedStandard.nominalVoltage}V L-N standards (current: ${calculated.voltageDeviationPercent >= 0 ? `+${calculated.voltageDeviationPercent.toFixed(1)}` : calculated.voltageDeviationPercent.toFixed(1)}%)`,
      color: healthScore.voltageScore > 85 ? 'bg-emerald-500' : healthScore.voltageScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
    },
    {
      name: 'Power Factor Compliance',
      weight: '20%',
      score: healthScore.powerFactorScore,
      description: `Ratio of active to apparent power (PF: ${calculated.totalPowerFactor.toFixed(2)}, benchmark: ≥${selectedStandard.minimumPowerFactor})`,
      color: healthScore.powerFactorScore > 85 ? 'bg-emerald-500' : healthScore.powerFactorScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
    },
    {
      name: 'Phase Imbalance Index (V & I)',
      weight: '20%',
      score: healthScore.imbalanceScore,
      description: `Voltage unbalance (${calculated.voltageImbalancePercent.toFixed(2)}%) and current asymmetry (${calculated.currentImbalancePercent.toFixed(2)}%)`,
      color: healthScore.imbalanceScore > 85 ? 'bg-emerald-500' : healthScore.imbalanceScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
    },
    {
      name: 'Frequency Stability Index',
      weight: '15%',
      score: healthScore.frequencyScore,
      description: `Departure from ${selectedStandard.nominalFrequency}.0Hz grid frequency (Δf: ${calculated.frequencyDeviation.toFixed(3)}Hz)`,
      color: healthScore.frequencyScore > 85 ? 'bg-emerald-500' : healthScore.frequencyScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
    },
    {
      name: 'Load & Neutral Stability',
      weight: '10%',
      score: healthScore.stabilityScore,
      description: `Neutral conductor loading (${calculated.neutralCurrentEstimated.toFixed(2)}A) and temporal variance`,
      color: healthScore.stabilityScore > 85 ? 'bg-emerald-500' : healthScore.stabilityScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
    },
    {
      name: 'Sensor Telemetry Health',
      weight: '10%',
      score: healthScore.communicationScore,
      description: 'PZEM Modbus packet delivery success rate & UART response latency',
      color: healthScore.communicationScore > 90 ? 'bg-emerald-500' : 'bg-amber-500'
    }
  ];

  const bands = [
    {
      range: '90 – 100',
      label: 'Excellent operating condition',
      desc: 'Measurements are exceptionally close to reference values. Optimal efficiency and symmetrical phase balance.',
      color: 'border-emerald-200 text-emerald-800 bg-emerald-50/60'
    },
    {
      range: '75 – 89',
      label: 'Good operating condition',
      desc: 'Minor electrical deviations present. Equipment is safe, but trending parameters warrant monitoring.',
      color: 'border-blue-200 text-blue-800 bg-blue-50/60'
    },
    {
      range: '50 – 74',
      label: 'Attention required',
      desc: 'One or more parameters show noticeable deviation from standards (e.g. low power factor or voltage imbalance > 2%).',
      color: 'border-amber-200 text-amber-800 bg-amber-50/60'
    },
    {
      range: '25 – 49',
      label: 'Poor operating condition',
      desc: 'Significant parameter deviations require prompt engineering investigation to prevent motor thermal degradation.',
      color: 'border-orange-200 text-orange-800 bg-orange-50/60'
    },
    {
      range: '0 – 24',
      label: 'Critical condition',
      desc: 'Severe voltage sag/swell, missing phase, or extreme imbalance outside statutory limits. Immediate trip protection required.',
      color: 'border-rose-200 text-rose-800 bg-rose-50/60'
    }
  ];

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
              Intelligent Power Quality Health Scoring Engine
            </h2>
            <OriginBadge origin="DERIVED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            0–100 composite analytical index synthesizing multi-channel 3-phase and single-phase electrical parameters
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-purple-600" />
          <span>Project-defined analytical score (Not an official ISO standard)</span>
        </div>
      </div>

      {/* Main Score Overview Card */}
      <div className="apple-card p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white">
        {/* Left: Circular Animated Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50/60 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-mono text-slate-500 mb-3 uppercase tracking-wider font-semibold">
            Overall Health Index
          </div>
          <CircularHealthGauge
            score={healthScore.overallScore}
            rating={healthScore.conditionRating}
          />
          <div className="mt-4 text-center">
            <div className="text-sm font-bold text-[#1D1D1F]">
              {healthScore.conditionRating} Condition
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans">
              {healthScore.description}
            </p>
          </div>
        </div>

        {/* Right: Sub-Score Progress Bars */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 pb-1 border-b border-slate-100 font-semibold">
            <span>Weighted Component Score Breakdown</span>
            <span>Current Points</span>
          </div>

          <div className="space-y-3">
            {subScores.map((sub, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 font-medium flex items-center gap-2 font-sans">
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">[{sub.weight}]</span>
                  </span>
                  <span className="font-bold font-sans text-slate-900">{sub.score} / 100</span>
                </div>
                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${sub.color}`}
                    style={{ width: `${sub.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{sub.description}</div>
              </div>
            ))}
          </div>

          {/* Actionable Recommendations */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-mono font-bold text-[#0071E3] flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Real-Time Diagnostic & Remediation Guidance:</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-700 font-sans">
              {healthScore.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Expandable Score Description Scale */}
      <div className="apple-card p-5 bg-white">
        <div 
          onClick={() => setShowThresholdExplainer(!showThresholdExplainer)}
          className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-100"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#0071E3]" />
            <h3 className="text-sm font-bold text-[#1D1D1F]">
              Project-Defined Analytical Score Thresholds & Grading Taxonomy
            </h3>
          </div>
          <button className="text-slate-400 hover:text-slate-700">
            {showThresholdExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showThresholdExplainer && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
            {bands.map((b, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border ${b.color} flex flex-col justify-between`}>
                <div>
                  <div className="text-base font-extrabold font-mono mb-0.5">{b.range}</div>
                  <div className="text-xs font-bold text-[#1D1D1F] mb-1.5">{b.label}</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{b.desc}</p>
                </div>
                <div className="mt-3 text-[10px] font-mono text-slate-400 border-t border-black/[0.06] pt-1">
                  Grade Band {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
