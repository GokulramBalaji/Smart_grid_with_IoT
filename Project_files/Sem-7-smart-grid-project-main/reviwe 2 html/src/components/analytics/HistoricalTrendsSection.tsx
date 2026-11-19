import React, { useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { OriginBadge } from '../common/Badge';
import { 
  TrendingUp, 
  Clock, 
  Download
} from 'lucide-react';

export const HistoricalTrendsSection: React.FC = () => {
  const { historicalData, calculated } = usePowerData();
  const [selectedMetric, setSelectedMetric] = useState<'voltage' | 'voltageLL' | 'current' | 'power' | 'pf' | 'imbalance'>('voltage');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [showPhaseR, setShowPhaseR] = useState(true);
  const [showPhaseY, setShowPhaseY] = useState(true);
  const [showPhaseB, setShowPhaseB] = useState(true);

  // SVG Chart Dimensions
  const chartWidth = 900;
  const chartHeight = 260;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;

  const dataSlice = historicalData.slice(-25);
  const count = dataSlice.length;

  let minY = 0;
  let maxY = 100;
  let unit = '';

  if (selectedMetric === 'voltage') {
    minY = 200;
    maxY = 260;
    unit = 'V';
  } else if (selectedMetric === 'voltageLL') {
    minY = 360;
    maxY = 460;
    unit = 'V';
  } else if (selectedMetric === 'current') {
    minY = 0;
    maxY = 15;
    unit = 'A';
  } else if (selectedMetric === 'power') {
    minY = 0;
    maxY = 10;
    unit = 'kW';
  } else if (selectedMetric === 'pf') {
    minY = 0.5;
    maxY = 1.0;
    unit = '';
  } else if (selectedMetric === 'imbalance') {
    minY = 0;
    maxY = 6.0;
    unit = '%';
  }

  const getX = (index: number) => {
    return padLeft + (index / (count - 1 || 1)) * (chartWidth - padLeft - padRight);
  };

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const frac = (clamped - minY) / (maxY - minY || 1);
    return chartHeight - padBottom - frac * (chartHeight - padTop - padBottom);
  };

  const buildPath = (values: number[]) => {
    return values.map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`).join(' ');
  };

  const pathR = buildPath(
    selectedMetric === 'voltage' ? dataSlice.map(d => d.voltageR) :
    selectedMetric === 'voltageLL' ? dataSlice.map(d => d.voltageRY) :
    selectedMetric === 'current' ? dataSlice.map(d => d.currentR) :
    selectedMetric === 'power' ? dataSlice.map(d => d.powerR / 1000) :
    selectedMetric === 'pf' ? dataSlice.map(d => d.powerFactorTotal) :
    dataSlice.map(d => d.voltageImbalance)
  );

  const pathY = buildPath(
    selectedMetric === 'voltage' ? dataSlice.map(d => d.voltageY) :
    selectedMetric === 'voltageLL' ? dataSlice.map(d => d.voltageYB) :
    selectedMetric === 'current' ? dataSlice.map(d => d.currentY) :
    selectedMetric === 'power' ? dataSlice.map(d => d.powerY / 1000) :
    selectedMetric === 'pf' ? dataSlice.map(d => d.powerFactorTotal) :
    dataSlice.map(d => d.currentImbalance)
  );

  const pathB = buildPath(
    selectedMetric === 'voltage' ? dataSlice.map(d => d.voltageB) :
    selectedMetric === 'voltageLL' ? dataSlice.map(d => d.voltageBR) :
    selectedMetric === 'current' ? dataSlice.map(d => d.currentB) :
    selectedMetric === 'power' ? dataSlice.map(d => d.powerB / 1000) :
    selectedMetric === 'pf' ? dataSlice.map(d => d.powerFactorTotal) :
    dataSlice.map(d => d.voltageImbalance)
  );

  const handleExportCSV = () => {
    let csv = 'Timestamp,Time,Voltage_R,Voltage_Y,Voltage_B,Voltage_RY,Voltage_YB,Voltage_BR,Current_R,Current_Y,Current_B,ActivePower_kW,PowerFactor,Frequency,Voltage_Imbalance_Pct\n';
    historicalData.forEach(d => {
      csv += `${d.timestamp},"${d.timeString}",${d.voltageR},${d.voltageY},${d.voltageB},${d.voltageRY},${d.voltageYB},${d.voltageBR},${d.currentR},${d.currentY},${d.currentB},${d.totalActivePowerKW},${d.powerFactorTotal},${d.frequency},${d.voltageImbalance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `three_phase_telemetry_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Historical Parameter Trends & Phase Comparisons
            </h2>
            <OriginBadge origin="MEASURED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Time-series telemetry visualization, phase-by-phase overlay, and statistical variance
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-mono font-medium transition-colors shadow-apple-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV Telemetry</span>
        </button>
      </div>

      {/* Control Bar: Metric Selector & Timeframe Filter */}
      <div className="apple-card p-4 flex flex-wrap items-center justify-between gap-4 bg-white">
        {/* Metric Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'voltage', label: 'Voltage L-N (230V)' },
            { id: 'voltageLL', label: 'Voltage L-L (415V 3Φ)' },
            { id: 'current', label: 'Current (IR, IY, IB)' },
            { id: 'power', label: 'Active Power (kW)' },
            { id: 'pf', label: 'Power Factor' },
            { id: 'imbalance', label: 'Imbalance (V & I)' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMetric(m.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all ${
                selectedMetric === m.id
                  ? 'bg-[#0071E3] text-white font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Range:</span>
          </span>
          {(['1h', '6h', '24h', '7d'] as const).map(tr => (
            <button
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-3 py-1 rounded-full border transition-all ${
                timeRange === tr
                  ? 'bg-slate-800 text-white border-slate-700 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Time-Series SVG Chart */}
      <div className="apple-card p-6 space-y-4 bg-white">
        {/* Chart Header & Legend Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 text-xs font-mono">
          <div className="text-slate-800 font-bold uppercase tracking-wider">
            {selectedMetric === 'voltageLL' ? 'THREE-PHASE LINE-TO-LINE (415V)' : selectedMetric.toUpperCase()} TREND PROFILE ({unit || 'RATIO'})
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#FF3B30] font-medium">
              <input
                type="checkbox"
                checked={showPhaseR}
                onChange={() => setShowPhaseR(!showPhaseR)}
                className="rounded text-red-500"
              />
              <span>{selectedMetric === 'voltageLL' ? 'V_RY' : 'Phase R'}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-[#FF9500] font-medium">
              <input
                type="checkbox"
                checked={showPhaseY}
                onChange={() => setShowPhaseY(!showPhaseY)}
                className="rounded text-amber-500"
              />
              <span>{selectedMetric === 'voltageLL' ? 'V_YB' : 'Phase Y'}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-[#007AFF] font-medium">
              <input
                type="checkbox"
                checked={showPhaseB}
                onChange={() => setShowPhaseB(!showPhaseB)}
                className="rounded text-blue-500"
              />
              <span>{selectedMetric === 'voltageLL' ? 'V_BR' : 'Phase B'}</span>
            </label>
          </div>
        </div>

        {/* SVG Responsive Surface */}
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-64 block select-none"
          >
            <rect width={chartWidth} height={chartHeight} fill="#FFFFFF" rx="12" />

            {/* Grid horizontal divisions */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
              const yPos = chartHeight - padBottom - frac * (chartHeight - padTop - padBottom);
              const val = minY + frac * (maxY - minY);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={chartWidth - padRight}
                    y2={yPos}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 || idx === 4 ? "none" : "3,3"}
                  />
                  <text
                    x={padLeft - 8}
                    y={yPos + 4}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="-apple-system, sans-serif"
                    textAnchor="end"
                  >
                    {val.toFixed(unit === 'V' || unit === 'kW' ? 0 : 2)}{unit}
                  </text>
                </g>
              );
            })}

            {/* Time labels on X Axis */}
            {dataSlice.map((pt, idx) => {
              if (idx % 6 === 0 || idx === count - 1) {
                const xPos = getX(idx);
                return (
                  <text
                    key={idx}
                    x={xPos}
                    y={chartHeight - 12}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="-apple-system, sans-serif"
                    textAnchor="middle"
                  >
                    {pt.timeString}
                  </text>
                );
              }
              return null;
            })}

            {/* Line Path Phase R (Apple Red) */}
            {showPhaseR && (
              <path
                d={pathR}
                fill="none"
                stroke="#FF3B30"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Line Path Phase Y (Apple Amber) */}
            {showPhaseY && (
              <path
                d={pathY}
                fill="none"
                stroke="#FF9500"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Line Path Phase B (Apple Blue) */}
            {showPhaseB && (
              <path
                d={pathB}
                fill="none"
                stroke="#007AFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {count > 0 && showPhaseR && (
              <circle cx={getX(count - 1)} cy={getY(
                selectedMetric === 'voltage' ? dataSlice[count - 1].voltageR :
                selectedMetric === 'voltageLL' ? dataSlice[count - 1].voltageRY :
                selectedMetric === 'current' ? dataSlice[count - 1].currentR :
                selectedMetric === 'power' ? dataSlice[count - 1].powerR / 1000 :
                dataSlice[count - 1].voltageImbalance
              )} r="4" fill="#FF3B30" />
            )}
          </svg>
        </div>

        {/* Phase Comparison Stat Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <span className="text-slate-500">R Phase L-N:</span>
            <span className="font-bold text-[#FF3B30]">{calculated.averageVoltage.toFixed(1)}V • {calculated.averageCurrent.toFixed(2)}A</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <span className="text-slate-500">Y Phase L-N:</span>
            <span className="font-bold text-[#FF9500]">{calculated.averageVoltage.toFixed(1)}V • {calculated.averageCurrent.toFixed(2)}A</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <span className="text-slate-500">B Phase L-N:</span>
            <span className="font-bold text-[#007AFF]">{calculated.averageVoltage.toFixed(1)}V • {calculated.averageCurrent.toFixed(2)}A</span>
          </div>
        </div>
      </div>
    </section>
  );
};
