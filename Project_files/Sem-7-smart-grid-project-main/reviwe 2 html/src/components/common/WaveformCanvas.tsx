import React, { useEffect, useRef, useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { Play, Pause, Activity } from 'lucide-react';

export const WaveformCanvas: React.FC = () => {
  const { phaseR, phaseY, phaseB, activeFault } = usePowerData();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [isRunning, setIsRunning] = useState(true);
  const [showPhaseR, setShowPhaseR] = useState(true);
  const [showPhaseY, setShowPhaseY] = useState(true);
  const [showPhaseB, setShowPhaseB] = useState(true);
  const [timeScale, setTimeScale] = useState(1.0);

  const phaseOffsetRef = useRef(0);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;
      const midY = height / 2;

      // 1. Clean Apple Canvas Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Soft Gridlines
      ctx.strokeStyle = '#E5E5EA';
      ctx.lineWidth = 1;

      // Horizontal reference lines (+325V peak, 0V, -325V peak)
      ctx.beginPath();
      const peakOffset = height * 0.38;
      ctx.moveTo(0, midY - peakOffset);
      ctx.lineTo(width, midY - peakOffset);
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.moveTo(0, midY + peakOffset);
      ctx.lineTo(width, midY + peakOffset);
      ctx.stroke();

      // Horizontal dashed sub-divisions
      ctx.strokeStyle = '#F2F2F7';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY - peakOffset / 2);
      ctx.lineTo(width, midY - peakOffset / 2);
      ctx.moveTo(0, midY + peakOffset / 2);
      ctx.lineTo(width, midY + peakOffset / 2);
      ctx.stroke();

      // Vertical time markers (50 Hz cycle: 20ms = 1 period)
      const periodPixels = width / 2.5;
      for (let x = 0; x <= width; x += periodPixels / 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Clean Apple Axis Labels
      ctx.fillStyle = '#86868B';
      ctx.font = '10px -apple-system, Inter, sans-serif';
      ctx.fillText('+325V Peak', 8, midY - peakOffset + 12);
      ctx.fillText('0V Neutral Ref', 8, midY - 4);
      ctx.fillText('-325V Peak', 8, midY + peakOffset - 4);
      ctx.fillText('20ms (1 Cycle @ 50Hz)', periodPixels - 120, height - 8);

      // Advance animation phase
      if (isRunning) {
        phaseOffsetRef.current += 0.05 * timeScale;
      }
      const t = phaseOffsetRef.current;

      // Normalize voltage amplitudes relative to 230V nominal
      const scaleR = (phaseR.voltage / 230) * peakOffset * 0.95;
      const scaleY = (phaseY.voltage / 230) * peakOffset * 0.95;
      const scaleB = (phaseB.voltage / 230) * peakOffset * 0.95;

      const angularFreq = (2 * Math.PI) / periodPixels;

      const drawSine = (
        color: string,
        amplitude: number,
        phaseAngle: number,
        harmonicDistort: boolean
      ) => {
        if (amplitude <= 0) return;

        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const theta = (x * angularFreq) - t + phaseAngle;
          let yVal = amplitude * Math.sin(theta);
          if (harmonicDistort) {
            yVal += (amplitude * 0.12) * Math.sin(3 * theta);
            yVal += (amplitude * 0.06) * Math.sin(5 * theta);
          }
          const y = midY - yVal;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      };

      const hasHarmonics = activeFault === 'LOW_PF_INDUCTIVE' || activeFault === 'LOOSE_NEUTRAL';

      // Phase R: Apple Red
      if (showPhaseR) {
        drawSine('#FF3B30', scaleR, 0, hasHarmonics);
      }
      // Phase Y: Apple Amber / Orange (-120 deg)
      if (showPhaseY) {
        drawSine('#FF9500', scaleY, -(2 * Math.PI) / 3, hasHarmonics);
      }
      // Phase B: Apple System Blue (+120 deg)
      if (showPhaseB) {
        drawSine('#007AFF', scaleB, (2 * Math.PI) / 3, hasHarmonics);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, showPhaseR, showPhaseY, showPhaseB, timeScale, phaseR.voltage, phaseY.voltage, phaseB.voltage, activeFault]);

  return (
    <div className="apple-card p-5 relative overflow-hidden bg-white">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2">
              Three-Phase Fundamental Instantaneous Waveforms
              <span className="text-[10px] font-mono text-[#0071E3] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                60 FPS Real-Time
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              v_R(t) [0°] | v_Y(t) [-120°] | v_B(t) [+120°]
            </p>
          </div>
        </div>

        {/* Action pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPhaseR(!showPhaseR)}
            className={`px-3 py-1 text-xs font-mono font-medium rounded-full border transition-all ${
              showPhaseR
                ? 'bg-red-50 text-[#FF3B30] border-red-200 font-bold shadow-apple-sm'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            R Phase ({phaseR.voltage.toFixed(0)}V)
          </button>
          <button
            onClick={() => setShowPhaseY(!showPhaseY)}
            className={`px-3 py-1 text-xs font-mono font-medium rounded-full border transition-all ${
              showPhaseY
                ? 'bg-amber-50 text-[#FF9500] border-amber-200 font-bold shadow-apple-sm'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            Y Phase ({phaseY.voltage.toFixed(0)}V)
          </button>
          <button
            onClick={() => setShowPhaseB(!showPhaseB)}
            className={`px-3 py-1 text-xs font-mono font-medium rounded-full border transition-all ${
              showPhaseB
                ? 'bg-blue-50 text-[#007AFF] border-blue-200 font-bold shadow-apple-sm'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            B Phase ({phaseB.voltage.toFixed(0)}V)
          </button>

          {/* Pause/Play */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title={isRunning ? 'Pause Waveform' : 'Resume Waveform'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200/80 bg-white">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Legend watermark */}
        <div className="absolute top-3 right-3 flex items-center gap-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/[0.08] shadow-apple-sm text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-[#FF3B30] font-medium">
            <span className="w-2.5 h-1 bg-[#FF3B30] rounded-full inline-block"></span>
            <span>R (0°)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#FF9500] font-medium">
            <span className="w-2.5 h-1 bg-[#FF9500] rounded-full inline-block"></span>
            <span>Y (240°)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#007AFF] font-medium">
            <span className="w-2.5 h-1 bg-[#007AFF] rounded-full inline-block"></span>
            <span>B (120°)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
