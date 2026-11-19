import React from 'react';

interface CircularHealthGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  rating: string;
}

export const CircularHealthGauge: React.FC<CircularHealthGaugeProps> = ({
  score,
  size = 180,
  strokeWidth = 14,
  rating
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const offset = circumference - (progress / 100) * circumference;

  let color = '#34C759'; // Apple Mint Green
  if (score < 25) {
    color = '#FF3B30'; // Apple Red
  } else if (score < 50) {
    color = '#FF9500'; // Apple Orange
  } else if (score < 75) {
    color = '#FFCC00'; // Apple Gold
  } else if (score < 90) {
    color = '#0071E3'; // Apple Blue
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg] transition-all duration-700">
        {/* Soft Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5EA"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Colored Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease'
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold font-sans text-[#1D1D1F] tracking-tight">
          {score}
        </span>
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold">
          / 100 PTS
        </span>
        <span 
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5"
          style={{ color, backgroundColor: `${color}1A` }}
        >
          {rating}
        </span>
      </div>
    </div>
  );
};

interface SemiGaugeProps {
  value: number;
  max: number;
  limit: number;
  unit?: string;
  label: string;
  isCurrent?: boolean;
}

export const SemiGauge: React.FC<SemiGaugeProps> = ({
  value,
  max = 5.0,
  limit = 2.0,
  unit = '%',
  label,
}) => {
  const clampedVal = Math.min(max, Math.max(0, value));
  const fraction = clampedVal / max;

  const isExceeded = value > limit;
  const strokeColor = isExceeded ? '#FF3B30' : value > limit * 0.75 ? '#FF9500' : '#34C759';

  return (
    <div className="flex flex-col items-center p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
      <div className="text-xs font-medium text-slate-600 mb-1">{label}</div>
      <div className="relative w-36 h-20 flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 100 55" className="w-36 h-20">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E5E5EA"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - fraction * 125.6}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-lg font-bold font-sans text-[#1D1D1F] leading-none">
            {value.toFixed(2)}{unit}
          </span>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5">
            Limit: {limit}{unit}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
        {isExceeded ? (
          <span className="text-rose-600 font-semibold">⚠️ Exceeds Limit</span>
        ) : (
          <span className="text-emerald-600 font-medium">✓ Within Spec</span>
        )}
      </div>
    </div>
  );
};
