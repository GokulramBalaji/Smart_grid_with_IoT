import React from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { FaultSimulationType } from '../../types/power';
import { 
  Sliders, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Waves, 
  ShieldAlert 
} from 'lucide-react';

interface FaultInjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaultInjectionModal: React.FC<FaultInjectionModalProps> = ({ isOpen, onClose }) => {
  const { activeFault, setActiveFault } = usePowerData();

  if (!isOpen) return null;

  const faults: { id: FaultSimulationType; name: string; desc: string; severity: string; icon: any }[] = [
    {
      id: 'NONE',
      name: 'Normal Balanced Grid State',
      desc: 'Symmetrical 230V RMS, 50.0Hz, PF 0.96. All statutory standards fully met.',
      severity: 'Normal',
      icon: CheckCircle2
    },
    {
      id: 'SAG_R',
      name: 'R-Phase Voltage Sag (-18%)',
      desc: 'Simulates heavy upstream grid fault or transformer tap dip. VR drops to ~188V.',
      severity: 'Critical Alarm',
      icon: AlertTriangle
    },
    {
      id: 'SWELL_Y',
      name: 'Y-Phase Voltage Swell (+14%)',
      desc: 'Simulates sudden load rejection or capacitor bank over-energization. VY surges to ~262V.',
      severity: 'Critical Alarm',
      icon: Flame
    },
    {
      id: 'UNBALANCE_LOAD',
      name: 'Severe Single-Phase Load Unbalance',
      desc: 'Loads Phase R to 14.8A while Y & B remain ~2.5A. Triggers >25% Current Imbalance.',
      severity: 'Warning',
      icon: Waves
    },
    {
      id: 'LOW_PF_INDUCTIVE',
      name: 'Inductive Low Power Factor (0.62 Lag)',
      desc: 'Simulates uncompensated induction motors. Increases reactive demand and utility surcharges.',
      severity: 'Warning',
      icon: Zap
    },
    {
      id: 'FREQ_DRIFT',
      name: 'Grid Frequency Transient (48.95 Hz)',
      desc: 'Simulates regional grid generation trip outside CEA standard tolerance band (49.5–50.5 Hz).',
      severity: 'Critical Alarm',
      icon: AlertTriangle
    },
    {
      id: 'PHASE_B_OUTAGE',
      name: 'Phase B Loss / Blown Fuse (0.0 V)',
      desc: 'Simulates single-phasing condition. Phase B drops to 0V, placing extreme risk on motors.',
      severity: 'Emergency Trip',
      icon: ShieldAlert
    },
    {
      id: 'LOOSE_NEUTRAL',
      name: 'Floating / Loose Neutral Fault',
      desc: 'Causes phase voltages to float based on load impedance ratios (254V on R, 205V on Y).',
      severity: 'Critical Fire Hazard',
      icon: Flame
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="industrial-card w-full max-w-2xl p-6 bg-[#0B0F17] border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Live Electrical Disturbance & Fault Injector
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Inject real-time disturbances to demonstrate alarm triggers and score drop to viva examiners
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fault Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {faults.map(f => {
            const isSelected = activeFault === f.id;
            const Icon = f.icon;

            return (
              <div
                key={f.id}
                onClick={() => {
                  setActiveFault(f.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border font-mono ${
                  isSelected
                    ? f.id === 'NONE'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-glow-green'
                      : 'bg-rose-950/40 border-rose-500 shadow-glow-crimson'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? (f.id === 'NONE' ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white font-sans">{f.name}</span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed mb-2">
                  {f.desc}
                </p>

                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-1.5 py-0.2 rounded border ${
                    f.severity === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    f.severity === 'Warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}>
                    {f.severity}
                  </span>
                  <span className="text-slate-500">
                    {isSelected ? 'ACTIVE NOW' : 'Click to Inject'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guidance */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Tip: Watch the 60 FPS waveform canvas react instantaneously!</span>
          <button
            onClick={() => {
              setActiveFault('NONE');
              onClose();
            }}
            className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
          >
            Reset to Normal
          </button>
        </div>
      </div>
    </div>
  );
};
