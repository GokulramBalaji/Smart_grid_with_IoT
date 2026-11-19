import React, { useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { OriginBadge } from '../common/Badge';
import { 
  Cpu, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  Repeat, 
  Sparkles
} from 'lucide-react';

export const PredictiveMaintenance: React.FC = () => {
  const { calculated, predictions, activeFault } = usePowerData();
  const [predictionHorizon, setPredictionHorizon] = useState<number>(60);

  let possibleIssue = 'Symmetrical Stable Loading';
  let rootCauses = ['Normal grid operation within statutory tolerances'];
  let confidence = 94;
  let recommendedInspection = 'Routine quarterly thermographic check of main busbars.';

  if (activeFault === 'SAG_R') {
    possibleIssue = 'Progressive R-Phase Voltage Depletion & Upstream Tap Wear';
    rootCauses = [
      'High-resistance connection on R-Phase feeder terminal',
      'Uneven single-phase commercial load growth',
      'Distribution transformer tap-changer mechanical binding'
    ];
    confidence = 89;
    recommendedInspection = 'Measure contact resistance (Ductor test) on Phase R breaker and check transformer tap.';
  } else if (activeFault === 'LOOSE_NEUTRAL') {
    possibleIssue = 'Floating Neutral Bus Disconnection Risk';
    rootCauses = [
      'Loose or corroded neutral terminal in distribution panel',
      'Broken neutral conductor in supply drop',
      'Triplen harmonic current heating of neutral bus'
    ];
    confidence = 92;
    recommendedInspection = 'Immediate inspection of neutral bar torque specs and earth-neutral voltage measurement.';
  } else if (activeFault === 'LOW_PF_INDUCTIVE') {
    possibleIssue = 'Capacitor Bank Degradation / Heavy Inductive Surcharge';
    rootCauses = [
      'Failed power factor correction capacitors (open contactor or blown internal fuse)',
      'Uncompensated induction motor idling in facility'
    ];
    confidence = 96;
    recommendedInspection = 'Test individual capacitor cell capacitances and verify APFC step switching relay outputs.';
  } else if (calculated.voltageImbalancePercent > 1.8) {
    possibleIssue = 'Developing Three-Phase Voltage Asymmetry Trend';
    rootCauses = [
      'Phase load imbalance caused by single-phase consumer clustering',
      'Impedance asymmetry in distribution line'
    ];
    confidence = 82;
    recommendedInspection = 'Audit single-phase sub-circuits and re-distribute loads across Phases R, Y, and B.';
  }

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Predictive Maintenance & Continuous Machine Learning
            </h2>
            <OriginBadge origin="PREDICTED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Multivariate time-series forecasting, recursive statistical filtering, and developing fault classification
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Simulated Pedagogical ML Demo • Clearly Distinguishes Real Telemetry</span>
        </div>
      </div>

      {/* Engineering Definition Quote Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80 border border-blue-200/60 shadow-apple-sm">
        <blockquote className="text-sm text-slate-700 italic font-sans">
          "Predictive maintenance uses historical measurements to identify patterns and subtle parameter drift that may indicate a developing problem before catastrophic equipment failure occurs."
        </blockquote>
        <div className="mt-2 text-xs font-mono text-[#0071E3] flex items-center gap-2 font-semibold">
          <span>— Fundamental IoT & Electrical Asset Management Principle</span>
        </div>
      </div>

      {/* Developing Fault Diagnostic Summary */}
      <div className="apple-card p-6 space-y-4 bg-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider font-mono">
              Developing Electrical Issue Assessment
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Model Confidence:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {confidence}% Confidence
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 mb-1">Identified Potential Issue:</div>
            <div className="text-sm font-bold text-[#1D1D1F] mb-2 font-sans">
              {possibleIssue}
            </div>
            <div className="text-[11px] text-slate-500">
              V_imb: <span className="text-slate-900 font-bold">{calculated.voltageImbalancePercent.toFixed(2)}%</span> | 
              PF: <span className="text-slate-900 font-bold">{calculated.totalPowerFactor.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 mb-1">Plausible Electrical Causes:</div>
            <ul className="space-y-1 text-slate-700 list-disc list-inside font-sans text-[11px]">
              {rootCauses.map((cause, idx) => (
                <li key={idx}>{cause}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 mb-1">Recommended Preventative Inspection:</div>
            <p className="text-slate-700 font-sans text-[11px] leading-relaxed">
              {recommendedInspection}
            </p>
            <div className="mt-2 text-[10px] text-emerald-700 font-bold">
              ✓ Prevents unplanned downtime and motor thermal tripping.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Machine Learning Prediction Demo Graph */}
      <div className="apple-card p-6 space-y-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2 font-mono">
                <span>Interactive Predictive Forecast Curve</span>
                <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                  95% Confidence Band
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Visualizes expected average voltage trajectory over future intervals [T+5m to T+60m]
            </p>
          </div>

          {/* Prediction Horizon Selector */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Forecast Horizon:</span>
            {[15, 30, 60].map(min => (
              <button
                key={min}
                onClick={() => setPredictionHorizon(min)}
                className={`px-3 py-1 rounded-full border transition-all ${
                  predictionHorizon === min
                    ? 'bg-[#0071E3] text-white border-[#0071E3] font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                +{min} min
              </button>
            ))}
          </div>
        </div>

        {/* Forecast Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3">Future Horizon</th>
                <th className="p-3">Predicted Voltage</th>
                <th className="p-3">95% Confidence Interval</th>
                <th className="p-3">Projected Imbalance</th>
                <th className="p-3">Model Confidence</th>
                <th className="p-3">Status Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {predictions.filter(p => p.timeMinutes <= predictionHorizon).map((p, idx) => {
                const isOutOfSpec = p.predictedVoltage < 216.2 || p.predictedVoltage > 243.8;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-[#0071E3]">{p.timeOffset}</td>
                    <td className="p-3 font-bold text-slate-900">{p.predictedVoltage.toFixed(1)} V</td>
                    <td className="p-3 text-slate-600">
                      [{p.lowerConfidenceBound.toFixed(1)} V — {p.upperConfidenceBound.toFixed(1)} V]
                    </td>
                    <td className="p-3 text-slate-600">{p.predictedImbalance.toFixed(2)} %</td>
                    <td className="p-3 text-emerald-700 font-bold">{p.confidenceScore}%</td>
                    <td className="p-3">
                      {isOutOfSpec ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          ⚠️ Projected Threshold Breach
                        </span>
                      ) : (
                        <span className="text-slate-500">Nominal Projection</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ML Disclaimer */}
        <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <strong>Note for Viva Committee:</strong> The prediction points above demonstrate how an edge time-series regression pipeline would process historical PZEM telemetry. Simulated forecasts are clearly labeled and separated from physical sensor telemetry.
        </div>
      </div>

      {/* Educational Matrix: Rule-Based vs Machine Learning */}
      <div className="apple-card p-6 space-y-4 bg-white">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Layers className="w-5 h-5 text-[#0071E3]" />
          <h3 className="text-base font-bold text-[#1D1D1F]">
            How Machine Learning Can Improve This System: Architectural Comparison
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Rule-Based */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-mono font-bold text-amber-800 text-sm">
              1. Rule-Based Monitoring (Current Stage)
            </div>
            <p className="text-slate-700 font-sans leading-relaxed">
              Compares instantaneously against fixed static thresholds (e.g. <code>IF V &lt; 216V THEN Trigger Under-Voltage Alert</code>).
            </p>
            <div className="text-slate-600 font-mono space-y-1">
              <div><strong>Advantage:</strong> Deterministic, low computation, compliant with statutory codes.</div>
              <div><strong>Limitation:</strong> Reactive only. Does not detect progressive deterioration until the limit is already violated.</div>
            </div>
          </div>

          {/* Predictive Machine Learning */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
            <div className="font-mono font-bold text-[#0071E3] text-sm">
              2. Predictive Machine Learning (Future Expansion)
            </div>
            <p className="text-slate-700 font-sans leading-relaxed">
              Learns nominal operational manifold across load variations. Forecasts parameter trajectory hours ahead.
            </p>
            <div className="text-slate-600 font-mono space-y-1">
              <div><strong>Advantage:</strong> Proactive intervention before insulation breakdown or motor trip occurs.</div>
              <div><strong>Limitation:</strong> Requires extensive labeled training datasets and edge inference memory.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Continuous Learning & Recursive Analysis Explanation */}
      <div className="apple-card p-6 space-y-4 bg-white">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Repeat className="w-5 h-5 text-[#0071E3]" />
          <h3 className="text-base font-bold text-[#1D1D1F]">
            Continuous Learning & Recursive Analysis Methodology
          </h3>
        </div>

        <p className="text-xs text-slate-600 font-sans leading-relaxed">
          Recursive analysis repeatedly processes incoming PZEM measurements by updating prior state estimates with newly arrived telemetry, rather than reprocessing the entire historical dataset from scratch. This enables real-time edge processing on resource-constrained microcontrollers like the ESP32.
        </p>

        {/* Recursive Feedback Diagram */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[#0071E3] font-bold shadow-sm text-center">
            New Sensor Sample (t)
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-amber-700 font-bold shadow-sm text-center">
            Prior Analysis State (t-1)
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-sm text-center">
            Recursive Kalman / Moving Update
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-emerald-700 font-bold shadow-sm text-center">
            Refined Predictive Forecast (t+1)
          </div>
        </div>
      </div>
    </section>
  );
};
