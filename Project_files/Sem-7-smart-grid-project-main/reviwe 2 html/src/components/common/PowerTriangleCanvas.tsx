import React, { useEffect, useRef } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { Triangle } from 'lucide-react';

export const PowerTriangleCanvas: React.FC = () => {
  const { calculated } = usePowerData();
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

    // Clean white canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const padX = 40;
    const padY = 30;
    const originX = padX;
    const originY = height - padY;

    const P = Math.max(0.1, calculated.totalActivePowerKW);
    const Q = Math.max(0.1, calculated.totalReactivePowerKVAR);
    const S = Math.max(0.1, calculated.totalApparentPowerKVA);
    const PF = calculated.totalPowerFactor;

    const availW = width - padX * 2 - 20;
    const availH = height - padY * 2 - 20;
    const baseW = availW * 0.85;
    const ratioQP = P > 0 ? Q / P : 0.5;
    const triH = Math.min(availH, Math.max(25, baseW * ratioQP * 0.65));

    const pEndX = originX + baseW;
    const pEndY = originY;
    const sEndX = pEndX;
    const sEndY = originY - triH;

    // Shaded Triangle Area
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(pEndX, pEndY);
    ctx.lineTo(sEndX, sEndY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 113, 227, 0.05)';
    ctx.fill();

    // Base: P (Active Power) - Apple Blue
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(pEndX, pEndY);
    ctx.strokeStyle = '#0071E3';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Height: Q (Reactive Power) - Amber/Orange
    ctx.beginPath();
    ctx.moveTo(pEndX, pEndY);
    ctx.lineTo(sEndX, sEndY);
    ctx.strokeStyle = '#FF9500';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Hypotenuse: S (Apparent Power) - Purple
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(sEndX, sEndY);
    ctx.strokeStyle = '#AF52DE';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Right-angle symbol
    const rSize = 10;
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pEndX - rSize, pEndY);
    ctx.lineTo(pEndX - rSize, pEndY - rSize);
    ctx.lineTo(pEndX, pEndY - rSize);
    ctx.stroke();

    // Angle theta arc
    const arcRadius = 26;
    const thetaRad = Math.acos(Math.min(1.0, Math.max(0.1, PF)));
    ctx.beginPath();
    ctx.arc(originX, originY, arcRadius, -thetaRad, 0, false);
    ctx.strokeStyle = '#0071E3';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Clean Apple Labels
    ctx.font = '10px -apple-system, Inter, sans-serif';

    // P Label
    ctx.fillStyle = '#0071E3';
    ctx.fillText(`P = ${P.toFixed(2)} kW`, originX + baseW / 2 - 35, originY + 18);

    // Q Label
    ctx.fillStyle = '#C93400';
    ctx.fillText(`Q = ${Q.toFixed(2)} kVAR`, pEndX + 8, originY - triH / 2 + 4);

    // S Label
    ctx.fillStyle = '#8E24AA';
    ctx.fillText(`S = ${S.toFixed(2)} kVA`, originX + baseW / 2 - 30, originY - triH / 2 - 10);

    // Theta & PF label
    ctx.fillStyle = '#1D1D1F';
    const thetaDeg = (thetaRad * 180) / Math.PI;
    ctx.fillText(`θ = ${thetaDeg.toFixed(1)}° (cosθ = ${PF.toFixed(2)})`, originX + 32, originY - 8);

    ctx.restore();
  }, [calculated.totalActivePowerKW, calculated.totalReactivePowerKVAR, calculated.totalApparentPowerKVA, calculated.totalPowerFactor]);

  return (
    <div className="apple-card p-4 relative flex flex-col items-center justify-between bg-white">
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0071E3] flex items-center justify-center">
            <Triangle className="w-3.5 h-3.5 rotate-180" />
          </div>
          <h4 className="text-xs font-semibold text-[#1D1D1F]">Three-Phase Power Triangle</h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#0071E3] border border-blue-200">
          Lagging Inductive (S² = P² + Q²)
        </span>
      </div>

      <div className="w-full h-48 relative">
        <canvas ref={canvasRef} className="w-full h-full block rounded-xl" />
      </div>

      <p className="text-[11px] text-slate-500 font-mono mt-2 text-center">
        P (Real kW) vs Q (Magnetizing kVAR) vs S (Total kVA Capacity)
      </p>
    </div>
  );
};
