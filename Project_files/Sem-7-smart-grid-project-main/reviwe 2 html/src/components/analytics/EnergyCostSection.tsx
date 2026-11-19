import React, { useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { OriginBadge } from '../common/Badge';
import { 
  Coins, 
  Leaf, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  IndianRupee, 
  Sliders, 
  Zap, 
  Info
} from 'lucide-react';

export const EnergyCostSection: React.FC = () => {
  const { 
    calculated, 
    tariffPerKWh, 
    setTariffPerKWh, 
    currencySymbol, 
    setCurrencySymbol 
  } = usePowerData();

  const [powerFactorPenaltyRate, setPowerFactorPenaltyRate] = useState<number>(2.5); // % surcharge if PF < 0.90

  // Calculations
  const energyKWh = calculated.totalEnergy;
  const currentCost = energyKWh * tariffPerKWh;

  // Assume average hourly consumption rate based on active power
  const hourlyKWh = Math.max(0.5, calculated.totalActivePowerKW);
  const dailyKWh = hourlyKWh * 24;
  const weeklyKWh = dailyKWh * 7;
  const monthlyKWh = dailyKWh * 30;
  const annualKWh = dailyKWh * 365;

  const isLowPF = calculated.totalPowerFactor < 0.90;
  const pfMultiplier = isLowPF ? 1 + (powerFactorPenaltyRate / 100) : 1.0;

  const dailyCost = dailyKWh * tariffPerKWh * pfMultiplier;
  const weeklyCost = weeklyKWh * tariffPerKWh * pfMultiplier;
  const monthlyCost = monthlyKWh * tariffPerKWh * pfMultiplier;
  const annualCost = annualKWh * tariffPerKWh * pfMultiplier;

  // Carbon Emission Factor (India Central Electricity Authority average: ~0.82 kg CO2 / kWh)
  const carbonFactorKg = 0.82;
  const monthlyCarbonKg = monthlyKWh * carbonFactorKg;
  const annualCarbonTons = (annualKWh * carbonFactorKg) / 1000;

  return (
    <section className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-500" />
              Energy Cost & Carbon Footprint Analysis
            </h2>
            <OriginBadge origin="CALCULATED" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time kilowatt-hour register integration with configurable utility tariff structures and penalty surcharges
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          Formula: <span className="text-blue-600 font-bold">Cost = E_total × Tariff Rate</span>
        </div>
      </div>

      {/* Tariff Configuration Strip */}
      <div className="apple-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span className="font-semibold">Tariff Rate Customization:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Currency selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Currency:</span>
            {['₹', '$', '€', '£'].map(curr => (
              <button
                key={curr}
                onClick={() => setCurrencySymbol(curr)}
                className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                  currencySymbol === curr
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Unit Tariff Rate Input */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Unit Rate ({currencySymbol}/kWh):</span>
            <input
              type="number"
              step="0.1"
              value={tariffPerKWh}
              onChange={(e) => setTariffPerKWh(Number(e.target.value))}
              className="w-24 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Low PF Penalty Surcharge Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Low PF Surcharge:</span>
            <span className="text-amber-600 font-bold">+{powerFactorPenaltyRate}%</span>
          </div>
        </div>
      </div>

      {/* Energy Cost Projections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Daily Cost */}
        <div className="apple-card p-4 space-y-1.5">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Daily Projected Cost</span>
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {currencySymbol}{dailyCost.toFixed(2)}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Est. {dailyKWh.toFixed(1)} kWh / 24h
          </div>
        </div>

        {/* Weekly Cost */}
        <div className="apple-card p-4 space-y-1.5">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Weekly Projected Cost</span>
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {currencySymbol}{weeklyCost.toFixed(2)}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Est. {weeklyKWh.toFixed(0)} kWh / 7 Days
          </div>
        </div>

        {/* Monthly Cost */}
        <div className="apple-card p-4 space-y-1.5 border-blue-500/20 bg-blue-50/50">
          <div className="text-xs text-blue-700 flex items-center justify-between font-bold">
            <span>Monthly Projected Cost</span>
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-blue-600">
            {currencySymbol}{monthlyCost.toFixed(2)}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Est. {monthlyKWh.toFixed(0)} kWh / 30 Days
          </div>
        </div>

        {/* Annual Cost */}
        <div className="apple-card p-4 space-y-1.5">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Annual Projected Cost</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700">
            {currencySymbol}{annualCost.toFixed(2)}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Est. {annualKWh.toFixed(0)} kWh / Year
          </div>
        </div>

      </div>

      {/* Carbon Emissions & Low PF Penalty Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Carbon Footprint Card */}
        <div className="apple-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-800">Estimated Carbon Footprint (CO₂e)</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                CEA Grid Factor: 0.82 kg/kWh
              </span>
            </div>
            <div className="text-xs text-slate-600">
              Monthly Emissions: <strong className="text-slate-900 font-mono">{monthlyCarbonKg.toFixed(0)} kg CO₂</strong> | 
              Annual: <strong className="text-emerald-700 font-mono">{annualCarbonTons.toFixed(2)} Metric Tons CO₂e</strong>
            </div>
          </div>
        </div>

        {/* Tariff PF Penalty Warning Card */}
        <div className={`apple-card p-4 flex items-center gap-4 ${
          isLowPF ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isLowPF ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'
          }`}>
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-slate-900">
              {isLowPF ? '⚠️ Low Power Factor Utility Penalty Active' : '✓ Power Factor Tariff Incentive Compliant'}
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {isLowPF
                ? `System PF (${calculated.totalPowerFactor.toFixed(2)}) is below 0.90 standard benchmark. A ${powerFactorPenaltyRate}% surcharge is included in billing projections.`
                : `System PF (${calculated.totalPowerFactor.toFixed(2)}) is healthy. Operating without reactive utility surcharges.`
              }
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
