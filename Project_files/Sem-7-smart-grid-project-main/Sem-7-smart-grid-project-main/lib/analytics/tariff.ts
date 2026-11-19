import { round } from "@/lib/calculations/electrical";

export type TariffType = "FLAT" | "TIME_OF_USE" | "SLAB";

export interface TouRate {
  label: string;
  startHour: number;
  endHour: number; // exclusive; 24 means midnight
  rate: number;
}

export interface SlabRate {
  uptoKwh: number | null; // null = unbounded top slab
  rate: number;
}

export interface TariffPlanLike {
  type: TariffType;
  currency: string;
  flatRate: number | null;
  touRates: TouRate[] | null;
  slabRates: SlabRate[] | null;
  fixedChargeMonthly: number;
  demandChargePerKva: number;
}

export interface EnergyCostBreakdown {
  energyCharge: number;
  demandCharge: number;
  fixedCharge: number;
  totalCost: number;
  currency: string;
  effectiveRatePerKwh: number;
}

/**
 * Computes the energy charge portion of a bill.
 * - FLAT: a single $/kWh rate applied to total consumption.
 * - SLAB: progressive tiers, each kWh billed at the rate of the slab it falls in.
 * - TIME_OF_USE: requires hourly consumption (kWh per hour-of-day, 0-23) so
 *   each hour's energy can be billed at the rate for the window it falls in.
 */
export function calculateEnergyCharge(
  tariff: Pick<TariffPlanLike, "type" | "flatRate" | "slabRates" | "touRates">,
  totalKwh: number,
  hourlyKwh?: number[]
): number {
  if (tariff.type === "FLAT") {
    return round((tariff.flatRate ?? 0) * totalKwh, 2);
  }

  if (tariff.type === "SLAB" && tariff.slabRates) {
    let remaining = totalKwh;
    let previousCap = 0;
    let cost = 0;
    for (const slab of tariff.slabRates) {
      const cap = slab.uptoKwh ?? Infinity;
      const slabWidth = cap - previousCap;
      const consumedInSlab = Math.min(remaining, slabWidth);
      if (consumedInSlab > 0) {
        cost += consumedInSlab * slab.rate;
        remaining -= consumedInSlab;
      }
      previousCap = cap;
      if (remaining <= 0) break;
    }
    return round(cost, 2);
  }

  if (tariff.type === "TIME_OF_USE" && tariff.touRates && hourlyKwh) {
    let cost = 0;
    for (let hour = 0; hour < 24; hour++) {
      const kwh = hourlyKwh[hour] ?? 0;
      const window = tariff.touRates.find((w) => hour >= w.startHour && hour < w.endHour);
      cost += kwh * (window?.rate ?? 0);
    }
    return round(cost, 2);
  }

  return 0;
}

export function calculateEnergyCostBreakdown(
  tariff: TariffPlanLike,
  totalKwh: number,
  peakDemandKva: number,
  hourlyKwh?: number[]
): EnergyCostBreakdown {
  const energyCharge = calculateEnergyCharge(tariff, totalKwh, hourlyKwh);
  const demandCharge = round(peakDemandKva * tariff.demandChargePerKva, 2);
  const fixedCharge = round(tariff.fixedChargeMonthly, 2);
  const totalCost = round(energyCharge + demandCharge + fixedCharge, 2);

  return {
    energyCharge,
    demandCharge,
    fixedCharge,
    totalCost,
    currency: tariff.currency,
    effectiveRatePerKwh: totalKwh > 0 ? round(totalCost / totalKwh, 4) : 0,
  };
}
