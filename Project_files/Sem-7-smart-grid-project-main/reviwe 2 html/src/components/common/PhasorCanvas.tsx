import React, { useEffect, useRef } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { Compass } from 'lucide-react';

export const PhasorCanvas: React.FC = () => {
  const { phaseR, phaseY, phaseB, calculated } = usePowerData();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(cx, cy) * 0.82;

    // Clean white canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Polar Grid Circles (100V, 200V, 250V)
    const nominalV = 250;
    const scale = maxRadius / nominalV;

    [50, 100, 150, 200, 250].forEach(v => {
      const r = v * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = v === 230 ? '#CBD5E1' : '#F1F5F9';
      ctx.lineWidth = v === 230 ? 1.5 : 1;
      if (v === 230) {
        ctx.setLineDash([3, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();

      if (v % 100 === 0 || v === 230) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '9px -apple-system, sans-serif';
        ctx.fillText(`${v}V`, cx + 4, cy - r + 11);
      }
    });

    // Angle Axes
    ctx.strokeStyle = '#E2E8F0';
    ctx.setLineDash([]);
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(cx - maxRadius, cy);
    ctx.lineTo(cx + maxRadius, cy);
    ctx.moveTo(cx, cy - maxRadius);
    ctx.lineTo(cx, cy + maxRadius);
    ctx.stroke();

    // 120° and 240° dashed lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.setLineDash([2, 4]);
    [-120, 120].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(rad), cy + maxRadius * Math.sin(rad));
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Compute Vector Endpoints
    const rR = Math.min(nominalV, phaseR.voltage) * scale;
    const rx = cx + rR * Math.cos(0);
    const ry = cy - rR * Math.sin(0);

    const rY = Math.min(nominalV, phaseY.voltage) * scale;
    const yRad = (-120 * Math.PI) / 180;
    const yx = cx + rY * Math.cos(yRad);
    const yy = cy - rY * Math.sin(yRad);

    const rB = Math.min(nominalV, phaseB.voltage) * scale;
    const bRad = (120 * Math.PI) / 180;
    const bx = cx + rB * Math.cos(bRad);
    const by = cy - rB * Math.sin(bRad);

    // Connect Vector Heads to visualize balance triangle
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(yx, yy);
    ctx.lineTo(bx, by);
    ctx.closePath();
    ctx.fillStyle = calculated.voltageImbalancePercent > 2.0 
      ? 'rgba(255, 59, 48, 0.08)' 
      : 'rgba(0, 122, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = calculated.voltageImbalancePercent > 2.0 
      ? 'rgba(255, 59, 48, 0.3)' 
      : 'rgba(0, 122, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Helper to draw an arrow vector
    const drawVector = (toX: number, toY: number, color: string, label: string, val: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(toY - cy, toX - cx);
      const headLen = 8;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Text label
      ctx.fillStyle = color;
      ctx.font = 'bold 10px -apple-system, sans-serif';
      const labelDist = 16;
      const textX = toX + labelDist * Math.cos(angle);
      const textY = toY + labelDist * Math.sin(angle);
      ctx.fillText(`${label} (${val.toFixed(0)}V)`, textX - 22, textY + 3);
      ctx.restore();
    };

    drawVector(rx, ry, '#FF3B30', 'VR ∠0°', phaseR.voltage);
    drawVector(yx, yy, '#FF9500', 'VY ∠-120°', phaseY.voltage);
    drawVector(bx, by, '#007AFF', 'VB ∠+120°', phaseB.voltage);

    // Center Origin Node
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#1D1D1F';
    ctx.fill();

    ctx.restore();
  }, [phaseR.voltage, phaseY.voltage, phaseB.voltage, calculated.voltageImbalancePercent]);

  return (
    <div className="apple-card p-4 relative flex flex-col items-center justify-between bg-white">
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0071E3] flex items-center justify-center">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-semibold text-[#1D1D1F]">Phasor Vector Diagram</h4>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
          calculated.voltageImbalancePercent <= 2.0 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {calculated.voltageImbalancePercent <= 2.0 ? 'Balanced Symmetry' : 'Asymmetric Unbalance'}
        </span>
      </div>

      <div className="w-full h-48 relative">
        <canvas ref={canvasRef} className="w-full h-full block rounded-xl" />
      </div>

      <p className="text-[11px] text-slate-500 font-mono mt-2 text-center">
        Polar magnitude & 120° fundamental displacement showing symmetry distortion
      </p>
    </div>
  );
};
