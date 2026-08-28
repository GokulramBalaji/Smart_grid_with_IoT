import { round } from "@/lib/calculations/electrical";

export interface DailyPoint {
  date: string;
  energy: number;
}

/**
 * Simple, explainable forecasting: ordinary least-squares linear regression
 * over the recent daily energy totals. This is intentionally not a black-box
 * model — the trend line and its slope are inspectable — and every value it
 * produces must be presented to the user as an "Estimated Forecast", never
 * as a measurement.
 */
export function linearRegression(points: number[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0] ?? 0 };

  const xs = points.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = points.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (points[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

export function forecastNextDays(history: DailyPoint[], daysAhead: number): number[] {
  const values = history.map((h) => h.energy);
  const { slope, intercept } = linearRegression(values);
  const n = values.length;
  const recentAvg = values.slice(-7).reduce((a, b) => a + b, 0) / Math.max(1, values.slice(-7).length);

  const forecasts: number[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const trendValue = intercept + slope * (n + i);
    // Blend the trend projection with the recent average to avoid runaway
    // extrapolation from a short/noisy history.
    const blended = trendValue * 0.5 + recentAvg * 0.5;
    forecasts.push(round(Math.max(0, blended), 2));
  }
  return forecasts;
}

export function forecastSummary(history: DailyPoint[]) {
  const tomorrow = forecastNextDays(history, 1)[0] ?? 0;
  const nextWeek = forecastNextDays(history, 7);
  const nextWeekTotal = round(nextWeek.reduce((a, b) => a + b, 0), 2);
  const monthlyProjection = round((nextWeekTotal / 7) * 30, 2);

  return {
    tomorrow,
    nextWeekTotal,
    monthlyProjection,
    dailyForecast: nextWeek,
  };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / previous) * 100);
}
