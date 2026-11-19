import React from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  Cpu, 
  AlertTriangle, 
  FileText, 
  GraduationCap, 
  Activity, 
  BookOpen, 
  ShieldCheck, 
  TrendingUp, 
  Sliders
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenFaultModal: () => void;
  onOpenEspModal: () => void;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenFaultModal,
  onOpenEspModal,
  onOpenReportModal
}) => {
  const { 
    connectionMode, 
    isEsp32Connected, 
    esp32Ip, 
    lastUpdated, 
    activeFault,
    isPresentationMode,
    setIsPresentationMode
  } = usePowerData();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'analysis', label: '3-Phase Analysis', icon: Zap },
    { id: 'formulas', label: 'Formula Library', icon: BookOpen },
    { id: 'standards', label: 'Grid Standards (3Φ & 1Φ)', icon: ShieldCheck },
    { id: 'scoring', label: 'Health Score', icon: ShieldCheck },
    { id: 'predictive', label: 'Predictive ML', icon: Cpu },
    { id: 'hardware', label: 'Architecture', icon: Cpu },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'viva', label: 'Viva Defense', icon: GraduationCap, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-black/[0.06] shadow-apple-sm">
      {/* Top Banner: Status & Telemetry Strip */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Project Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center shadow-sm text-white font-bold">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-bold text-[#1D1D1F] tracking-tight text-sm">
                PowerPulse <span className="text-[#0071E3]">3Φ</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                EEE Capstone • 415V / 230V Analysis
              </span>
            </div>
          </div>
        </div>

        {/* Hardware Status Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Active Fault Indicator */}
          {activeFault !== 'NONE' && (
            <div 
              onClick={onOpenFaultModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-medium cursor-pointer shadow-sm animate-pulse"
              title="Click to change or reset active injected fault"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>FAULT: {activeFault.replace('_', ' ')}</span>
            </div>
          )}

          {/* Connection Status Pill */}
          <div 
            onClick={onOpenEspModal}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 hover:bg-slate-100 cursor-pointer text-slate-700 transition-colors shadow-apple-sm"
            title="Click to configure ESP32 connection"
          >
            {isEsp32Connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="font-sans font-medium text-[11px]">
              {connectionMode === 'LIVE_ESP32' ? 'ESP32 Hardware' : 'Demo Simulation'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-[11px]">{esp32Ip}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60 text-slate-500 text-[11px]">
            <span>1000ms</span>
            <span className="text-slate-300">•</span>
            <span>Sync: {lastUpdated}</span>
          </div>

          {/* Viva Presentation Mode Toggle */}
          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isPresentationMode 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isPresentationMode ? '🎓 Viva Mode: ON' : '🎓 Viva Mode'}
          </button>

          {/* Fault Injector Modal Trigger */}
          <button
            onClick={onOpenFaultModal}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors font-medium"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Fault Injector</span>
          </button>

          {/* Audit Report Trigger */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0071E3] border border-blue-200 transition-colors font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Report</span>
          </button>
        </div>
      </div>

      {/* Segmented Navigation Bar */}
      <div className="px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 bg-slate-50/50">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-[#0071E3] shadow-sm font-semibold border border-black/[0.06]'
                  : item.highlight
                  ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.03]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0071E3]' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
