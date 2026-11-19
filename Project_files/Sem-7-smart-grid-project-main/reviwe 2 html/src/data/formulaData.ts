export interface FormulaItem {
  id: string;
  category: 'Voltage' | 'Current' | 'Power' | 'Power Factor' | 'Frequency' | 'Energy' | 'Power Quality';
  title: string;
  formulaLatex: string;
  symbols: { symbol: string; meaning: string; unit: string }[];
  unit: string;
  exampleCalculation: string;
  engineeringExplanation: string;
  projectApplication: string;
  getLiveValue: (context: any) => { formulaFilled: string; result: string };
}

export const FORMULA_LIBRARY: FormulaItem[] = [
  {
    id: 'v_avg',
    category: 'Voltage',
    title: 'Average Phase Voltage',
    formulaLatex: 'V_{avg} = \\frac{V_R + V_Y + V_B}{3}',
    symbols: [
      { symbol: 'V_{avg}', meaning: 'Three-phase arithmetic mean phase voltage', unit: 'Volts (V)' },
      { symbol: 'V_R', meaning: 'R-Phase line-to-neutral RMS voltage', unit: 'Volts (V)' },
      { symbol: 'V_Y', meaning: 'Y-Phase line-to-neutral RMS voltage', unit: 'Volts (V)' },
      { symbol: 'V_B', meaning: 'B-Phase line-to-neutral RMS voltage', unit: 'Volts (V)' },
    ],
    unit: 'Volts (V)',
    exampleCalculation: 'V_R = 231.2V, V_Y = 229.8V, V_B = 230.5V\nV_avg = (231.2 + 229.8 + 230.5) / 3 = 691.5 / 3 = 230.50 V',
    engineeringExplanation: 'The average phase voltage establishes the reference baseline of the three-phase distribution system. Significant departure of individual phases from Vavg indicates asymmetric loading or upstream grid transformer unbalance.',
    projectApplication: 'The website receives three separate line-to-neutral voltages via PZEM-004T modules and calculates Vavg in software, serving as the benchmark for voltage unbalance computations.',
    getLiveValue: (ctx) => {
      const vr = ctx.phaseR.voltage.toFixed(1);
      const vy = ctx.phaseY.voltage.toFixed(1);
      const vb = ctx.phaseB.voltage.toFixed(1);
      const avg = ctx.calculated.averageVoltage.toFixed(2);
      return {
        formulaFilled: `(${vr} + ${vy} + ${vb}) / 3`,
        result: `${avg} V`
      };
    }
  },
  {
    id: 'v_imb',
    category: 'Power Quality',
    title: 'Voltage Imbalance Percentage (NEMA / IEEE)',
    formulaLatex: 'V_{imb}\\% = \\frac{\\max(|V_R - V_{avg}|, |V_Y - V_{avg}|, |V_B - V_{avg}|)}{V_{avg}} \\times 100',
    symbols: [
      { symbol: 'V_{imb}\\%', meaning: 'Voltage unbalance factor', unit: 'Percentage (%)' },
      { symbol: 'V_{avg}', meaning: 'Mean three-phase voltage', unit: 'Volts (V)' },
      { symbol: 'V_R, V_Y, V_B', meaning: 'Individual line-to-neutral voltages', unit: 'Volts (V)' },
    ],
    unit: '%',
    exampleCalculation: 'V_R = 236V, V_Y = 230V, V_B = 224V -> V_avg = 230V\nDeviations: |236-230|=6V, |230-230|=0V, |224-230|=6V -> Max Dev = 6V\nV_imb = (6 / 230) * 100 = 2.61%',
    engineeringExplanation: 'Even a small voltage imbalance causes a large negative-sequence current in induction motors, generating excessive heat and counter-torque. A 1% voltage unbalance can cause up to 6%–10% current unbalance.',
    projectApplication: 'Used to flag compliance against CEA grid regulations (max 2.0% unbalance for consumer terminals).',
    getLiveValue: (ctx) => {
      const avg = ctx.calculated.averageVoltage;
      const devR = Math.abs(ctx.phaseR.voltage - avg);
      const devY = Math.abs(ctx.phaseY.voltage - avg);
      const devB = Math.abs(ctx.phaseB.voltage - avg);
      const maxDev = Math.max(devR, devY, devB).toFixed(2);
      return {
        formulaFilled: `(${maxDev} V / ${avg.toFixed(2)} V) × 100`,
        result: `${ctx.calculated.voltageImbalancePercent.toFixed(2)} %`
      };
    }
  },
  {
    id: 'i_avg',
    category: 'Current',
    title: 'Average Phase Current',
    formulaLatex: 'I_{avg} = \\frac{I_R + I_Y + I_B}{3}',
    symbols: [
      { symbol: 'I_{avg}', meaning: 'Three-phase average RMS current', unit: 'Amperes (A)' },
      { symbol: 'I_R, I_Y, I_B', meaning: 'Current through Phase R, Y, B Current Transformers', unit: 'Amperes (A)' },
    ],
    unit: 'Amperes (A)',
    exampleCalculation: 'I_R = 5.2A, I_Y = 4.8A, I_B = 5.0A\nI_avg = (5.2 + 4.8 + 5.0) / 3 = 5.00 A',
    engineeringExplanation: 'Indicates aggregate thermal loading on the three-phase distribution panel and transformer secondary windings.',
    projectApplication: 'Provides thermal benchmark and baseline for current unbalance gauge calculations.',
    getLiveValue: (ctx) => {
      const ir = ctx.phaseR.current.toFixed(2);
      const iy = ctx.phaseY.current.toFixed(2);
      const ib = ctx.phaseB.current.toFixed(2);
      const avg = ctx.calculated.averageCurrent.toFixed(2);
      return {
        formulaFilled: `(${ir} + ${iy} + ${ib}) / 3`,
        result: `${avg} A`
      };
    }
  },
  {
    id: 'p_total',
    category: 'Power',
    title: 'Total Active Power (Three-Phase)',
    formulaLatex: 'P_{total} = P_R + P_Y + P_B',
    symbols: [
      { symbol: 'P_{total}', meaning: 'Total real power transferred to load', unit: 'Watts (W) or kW' },
      { symbol: 'P_R, P_Y, P_B', meaning: 'Per-phase active power measured by PZEM-004T', unit: 'Watts (W)' },
    ],
    unit: 'kW (or W)',
    exampleCalculation: 'P_R = 1200W, P_Y = 1150W, P_B = 1250W\nP_total = 1200 + 1150 + 1250 = 3600 W = 3.60 kW',
    engineeringExplanation: 'Active power represents the actual rate of energy conversion into useful work (mechanical motion, heat, lighting). By Blondel\'s theorem, total active power in an N-wire system is the algebraic sum of the individual phase powers.',
    projectApplication: 'Calculated in real-time from the three PZEM telemetry frames to monitor facility demand.',
    getLiveValue: (ctx) => {
      const pr = ctx.phaseR.activePower.toFixed(0);
      const py = ctx.phaseY.activePower.toFixed(0);
      const pb = ctx.phaseB.activePower.toFixed(0);
      return {
        formulaFilled: `${pr} W + ${py} W + ${pb} W`,
        result: `${ctx.calculated.totalActivePowerKW.toFixed(3)} kW`
      };
    }
  },
  {
    id: 's_total',
    category: 'Power',
    title: 'Total Apparent Power',
    formulaLatex: 'S_{total} = S_R + S_Y + S_B = V_R I_R + V_Y I_Y + V_B I_B',
    symbols: [
      { symbol: 'S_{total}', meaning: 'Total apparent power capacity required', unit: 'Volt-Amperes (VA) or kVA' },
      { symbol: 'S_R, S_Y, S_B', meaning: 'Per-phase apparent powers (V × I)', unit: 'Volt-Amperes (VA)' },
    ],
    unit: 'kVA (or VA)',
    exampleCalculation: 'S_R = 230V × 5A = 1150 VA, S_Y = 230V × 5A = 1150 VA, S_B = 230V × 5A = 1150 VA\nS_total = 3450 VA = 3.45 kVA',
    engineeringExplanation: 'Apparent power represents the total volt-ampere demand placed on cables, switchgear, and transformers. Equipment ratings (transformers, UPS, generators) are always sized in kVA, not kW.',
    projectApplication: 'Used as the denominator in computing true three-phase power factor (PF_total = P_total / S_total).',
    getLiveValue: (ctx) => {
      const sr = ctx.calculated.apparentPowerR.toFixed(0);
      const sy = ctx.calculated.apparentPowerY.toFixed(0);
      const sb = ctx.calculated.apparentPowerB.toFixed(0);
      return {
        formulaFilled: `${sr} VA + ${sy} VA + ${sb} VA`,
        result: `${ctx.calculated.totalApparentPowerKVA.toFixed(3)} kVA`
      };
    }
  },
  {
    id: 'pf_total',
    category: 'Power Factor',
    title: 'Total Three-Phase Power Factor (True Ratio)',
    formulaLatex: 'PF_{total} = \\frac{P_{total}}{S_{total}} = \\frac{P_R + P_Y + P_B}{V_R I_R + V_Y I_Y + V_B I_B}',
    symbols: [
      { symbol: 'PF_{total}', meaning: 'Overall system power factor', unit: 'Dimensionless (0.00 - 1.00)' },
      { symbol: 'P_{total}', meaning: 'Sum of active powers', unit: 'Watts (W)' },
      { symbol: 'S_{total}', meaning: 'Sum of apparent powers', unit: 'Volt-Amperes (VA)' },
    ],
    unit: 'Ratio [0 - 1]',
    exampleCalculation: 'P_total = 3200 W, S_total = 3500 VA\nPF_total = 3200 / 3500 = 0.914\n(DO NOT compute arithmetic average (PFR + PFY + PFB)/3 as it ignores phase weighting!)',
    engineeringExplanation: 'A critical viva examination concept: The true three-phase power factor is defined by the ratio of total real work to total apparent capacity. Averaging the three phase power factors algebraically is mathematically invalid when phases carry unequal loads.',
    projectApplication: 'The platform strictly calculates PF_total = P_total / S_total and warns if PF falls below the CEA tariff threshold (0.90).',
    getLiveValue: (ctx) => {
      const p = ctx.calculated.totalActivePower.toFixed(0);
      const s = ctx.calculated.totalApparentPower.toFixed(0);
      return {
        formulaFilled: `${p} W / ${s} VA`,
        result: `${ctx.calculated.totalPowerFactor.toFixed(3)}`
      };
    }
  },
  {
    id: 'q_total',
    category: 'Power',
    title: 'Total Reactive Power (Power Triangle)',
    formulaLatex: 'Q_{total} = \\sqrt{S_{total}^2 - P_{total}^2}',
    symbols: [
      { symbol: 'Q_{total}', meaning: 'Total magnetizing / reactive power', unit: 'VAR or kVAR' },
      { symbol: 'S_{total}', meaning: 'Total apparent power', unit: 'Volt-Amperes (VA)' },
      { symbol: 'P_{total}', meaning: 'Total active power', unit: 'Watts (W)' },
    ],
    unit: 'kVAR',
    exampleCalculation: 'S_total = 5000 VA, P_total = 4000 W\nQ_total = sqrt(5000^2 - 4000^2) = sqrt(25,000,000 - 16,000,000) = sqrt(9,000,000) = 3000 VAR = 3.00 kVAR',
    engineeringExplanation: 'Reactive power sustains the alternating electromagnetic fields required by inductive apparatus (motors, ballasts, transformers). While doing no net mechanical work, it causes I²R transmission losses and voltage drops.',
    projectApplication: 'Displays real-time reactive demand and guides capacitor bank sizing for power factor correction.',
    getLiveValue: (ctx) => {
      const s = ctx.calculated.totalApparentPower.toFixed(0);
      const p = ctx.calculated.totalActivePower.toFixed(0);
      return {
        formulaFilled: `√(${s}² - ${p}²)`,
        result: `${ctx.calculated.totalReactivePowerKVAR.toFixed(3)} kVAR`
      };
    }
  },
  {
    id: 'f_dev',
    category: 'Frequency',
    title: 'Frequency Deviation',
    formulaLatex: '\\Delta f = f_{measured} - f_{nominal}',
    symbols: [
      { symbol: '\\Delta f', meaning: 'Grid frequency departure', unit: 'Hertz (Hz)' },
      { symbol: 'f_{measured}', meaning: 'PZEM measured AC frequency', unit: 'Hertz (Hz)' },
      { symbol: 'f_{nominal}', meaning: 'Standard grid frequency (50.0 Hz in India / IEC, 60.0 Hz in US)', unit: 'Hertz (Hz)' },
    ],
    unit: 'Hz',
    exampleCalculation: 'f_measured = 50.15 Hz, f_nominal = 50.00 Hz\nΔf = 50.15 - 50.00 = +0.15 Hz (Grid generation exceeds demand)',
    engineeringExplanation: 'Grid frequency reflects the rotational kinetic balance between total generation and consumer load. A drop below 49.5 Hz signifies generation deficit, while a surge above 50.5 Hz signifies load shedding or excess generation.',
    projectApplication: 'Evaluated continuously against CEA Indian Electricity Grid Code operational band (49.90 Hz – 50.05 Hz).',
    getLiveValue: (ctx) => {
      const f = ctx.phaseR.frequency.toFixed(2);
      const fNom = ctx.selectedStandard.nominalFrequency.toFixed(1);
      const dev = ctx.calculated.frequencyDeviation >= 0 
        ? `+${ctx.calculated.frequencyDeviation.toFixed(3)}` 
        : ctx.calculated.frequencyDeviation.toFixed(3);
      return {
        formulaFilled: `${f} Hz - ${fNom} Hz`,
        result: `${dev} Hz`
      };
    }
  },
  {
    id: 'i_neutral',
    category: 'Current',
    title: 'Estimated Neutral Return Current (4-Wire Star)',
    formulaLatex: 'I_N \\approx \\sqrt{I_R^2 + I_Y^2 + I_B^2 - (I_R I_Y + I_Y I_B + I_B I_R)}',
    symbols: [
      { symbol: 'I_N', meaning: 'Neutral conductor RMS current', unit: 'Amperes (A)' },
      { symbol: 'I_R, I_Y, I_B', meaning: 'Phase RMS currents (assuming 120° fundamental displacement)', unit: 'Amperes (A)' },
    ],
    unit: 'Amperes (A)',
    exampleCalculation: 'I_R = 10A, I_Y = 10A, I_B = 10A (Balanced)\nI_N = sqrt(100 + 100 + 100 - (100 + 100 + 100)) = 0 A\nIf unbalanced: I_R = 15A, I_Y = 5A, I_B = 0A -> I_N = 13.23 A',
    engineeringExplanation: 'In a balanced 3-phase 4-wire system, the vector sum of line currents is zero. Under single-phase unbalance or triplen harmonics (3rd, 9th, 15th), neutral current flows back to the transformer, posing thermal burnout risks if neutral wires are undersized.',
    projectApplication: 'Enables early warnings of neutral overheating without requiring a 4th dedicated current transformer.',
    getLiveValue: (ctx) => {
      const ir = ctx.phaseR.current.toFixed(1);
      const iy = ctx.phaseY.current.toFixed(1);
      const ib = ctx.phaseB.current.toFixed(1);
      return {
        formulaFilled: `√(${ir}² + ${iy}² + ${ib}² - (${ir}×${iy} + ${iy}×${ib} + ${ib}×${ir}))`,
        result: `${ctx.calculated.neutralCurrentEstimated.toFixed(2)} A`
      };
    }
  },
  {
    id: 'energy_cost',
    category: 'Energy',
    title: 'Energy Cost & Tariff Formulation',
    formulaLatex: '\\text{Cost} = E_{total} \\times \\text{Tariff Rate}',
    symbols: [
      { symbol: 'Cost', meaning: 'Monetary energy expenditure', unit: 'Currency (₹ / $ / €)' },
      { symbol: 'E_{total}', meaning: 'Cumulative active energy consumed', unit: 'kWh' },
      { symbol: 'Tariff Rate', meaning: 'Cost per kilowatt-hour', unit: '₹/kWh' },
    ],
    unit: '₹ / $ / €',
    exampleCalculation: 'E_total = 45.2 kWh, Tariff = ₹7.50 / kWh\nCost = 45.2 × 7.50 = ₹339.00',
    engineeringExplanation: 'Energy meters integrate active power over time (kWh = ∫ P dt). Utilities levy time-of-day tariffs and demand surcharges when power factor falls below prescribed benchmarks.',
    projectApplication: 'Integrates real-time energy registers with customizable tariff schedules for cost forecasting.',
    getLiveValue: (ctx) => {
      const e = ctx.calculated.totalEnergy.toFixed(2);
      const rate = (7.5).toFixed(2);
      return {
        formulaFilled: `${e} kWh × ₹${rate}`,
        result: `₹${(ctx.calculated.totalEnergy * 7.5).toFixed(2)}`
      };
    }
  }
];
