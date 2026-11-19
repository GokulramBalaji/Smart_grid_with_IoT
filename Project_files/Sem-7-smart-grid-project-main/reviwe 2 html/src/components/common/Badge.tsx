import React from 'react';
import { DataOrigin } from '../../types/power';
import { Radio, Calculator, Activity, Cpu } from 'lucide-react';

interface OriginBadgeProps {
  origin: DataOrigin;
  className?: string;
  tooltip?: string;
}

export const OriginBadge: React.FC<OriginBadgeProps> = ({ origin, className = '' }) => {
  switch (origin) {
    case 'MEASURED':
      return (
        <span 
          title="Direct hardware telemetry acquired from PZEM-004T module"
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-apple-sm ${className}`}
        >
          <Radio className="w-2.5 h-2.5 text-emerald-600" />
          MEASURED
        </span>
      );
    case 'CALCULATED':
      return (
        <span 
          title="Calculated in software from the 3 individual phase measurements"
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-apple-sm ${className}`}
        >
          <Calculator className="w-2.5 h-2.5 text-blue-600" />
          CALCULATED
        </span>
      );
    case 'DERIVED':
      return (
        <span 
          title="Derived power quality indicator & analytical metric"
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200 shadow-apple-sm ${className}`}
        >
          <Activity className="w-2.5 h-2.5 text-purple-600" />
          DERIVED
        </span>
      );
    case 'PREDICTED':
      return (
        <span 
          title="Simulated pedagogical forecast based on trend regression"
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-apple-sm ${className}`}
        >
          <Cpu className="w-2.5 h-2.5 text-amber-600" />
          PREDICTED
        </span>
      );
    default:
      return null;
  }
};

interface StatusBadgeProps {
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'HEALTHY' | 'FAULT';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  if (status === 'NORMAL' || status === 'HEALTHY') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        NORMAL
      </span>
    );
  }
  if (status === 'WARNING') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        WARNING
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
      CRITICAL
    </span>
  );
};
