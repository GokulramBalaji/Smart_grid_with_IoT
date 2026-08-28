import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRequestDevice } from "@/lib/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { round } from "@/lib/calculations/electrical";
import { percentChange, forecastSummary, type DailyPoint } from "@/lib/analytics/forecast";
import type { PhaseKey } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const { device } = await resolveRequestDevice(deviceId);
    if (!device) return apiSuccess({ device: null });

    const now = new Date();
    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);

    const [dailySummaries, monthlySummaries, todayReadings, yesterdayReadings, hourlyToday] = await Promise.all([
      prisma.energySummary.findMany({
        where: { deviceId: device.id, period: "DAILY" },
        orderBy: { periodStart: "asc" },
      }),
      prisma.energySummary.findMany({
        where: { deviceId: device.id, period: "MONTHLY" },
        orderBy: { periodStart: "asc" },
      }),
      prisma.sensorReading.findMany({
        where: { deviceId: device.id, timestamp: { gte: todayStart } },
        select: { energyDelta: true, phase: true },
      }),
      prisma.sensorReading.findMany({
        where: { deviceId: device.id, timestamp: { gte: yesterdayStart, lt: todayStart } },
        select: { energyDelta: true },
      }),
      prisma.sensorReading.findMany({
        where: { deviceId: device.id, timestamp: { gte: todayStart } },
        select: { timestamp: true, energyDelta: true },
        orderBy: { timestamp: "asc" },
      }),
    ]);

    // --- Hourly consumption (today) ---
    const hourlyBuckets = new Array(24).fill(0);
    for (const r of hourlyToday) {
      hourlyBuckets[r.timestamp.getUTCHours()] += r.energyDelta;
    }
    const hourly = hourlyBuckets.map((v, hour) => ({ hour, energy: round(v, 3) }));

    // --- Daily consumption trend (raw-retention window) ---
    const daily: DailyPoint[] = dailySummaries.map((s) => ({
      date: s.periodStart.toISOString().slice(0, 10),
      energy: s.totalEnergy,
    }));

    // --- Weekly consumption (bucket daily summaries into calendar weeks) ---
    const weeklyMap = new Map<string, number>();
    for (const s of dailySummaries) {
      const weekStart = new Date(s.periodStart);
      const day = weekStart.getUTCDay();
      weekStart.setUTCDate(weekStart.getUTCDate() - day);
      const key = weekStart.toISOString().slice(0, 10);
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + s.totalEnergy);
    }
    const weekly = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, energy]) => ({ weekStart, energy: round(energy, 2) }));

    // --- Monthly consumption: long-horizon rollups + current partial month from daily data ---
    const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const currentMonthTotal = dailySummaries
      .filter((s) => s.periodStart.toISOString().slice(0, 7) === currentMonthKey)
      .reduce((sum, s) => sum + s.totalEnergy, 0);

    const monthly = [
      ...monthlySummaries.map((s) => ({
        month: s.periodStart.toISOString().slice(0, 7),
        energy: round(s.totalEnergy, 2),
      })),
      { month: currentMonthKey, energy: round(currentMonthTotal, 2) },
    ];

    // --- Phase-wise energy over the raw-retention window ---
    const phaseWise = dailySummaries.reduce(
      (acc, s) => {
        acc.R += s.energyR;
        acc.Y += s.energyY;
        acc.B += s.energyB;
        return acc;
      },
      { R: 0, Y: 0, B: 0 } as Record<PhaseKey, number>
    );

    // --- Peak / lowest / average daily consumption ---
    const dailyTotals = dailySummaries.map((s) => s.totalEnergy);
    const peak = dailyTotals.length ? Math.max(...dailyTotals) : 0;
    const lowest = dailyTotals.length ? Math.min(...dailyTotals) : 0;
    const avgDaily = dailyTotals.length ? dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length : 0;

    // --- Comparisons ---
    const todayTotal = todayReadings.reduce((sum, r) => sum + r.energyDelta, 0);
    const yesterdayTotal = yesterdayReadings.reduce((sum, r) => sum + r.energyDelta, 0);

    const last7 = dailySummaries.slice(-7);
    const prev7 = dailySummaries.slice(-14, -7);
    const thisWeekTotal = last7.reduce((sum, s) => sum + s.totalEnergy, 0);
    const lastWeekTotal = prev7.reduce((sum, s) => sum + s.totalEnergy, 0);

    const lastMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth()).padStart(2, "0")}`;
    const lastMonthFromRollup = monthlySummaries.find((s) => s.periodStart.toISOString().slice(0, 7) === lastMonthKey);
    const lastMonthTotal = lastMonthFromRollup?.totalEnergy ?? 0;

    const forecast = forecastSummary(daily);

    return apiSuccess({
      device: { id: device.id, name: device.name },
      hourly,
      daily,
      weekly,
      monthly,
      phaseWise: {
        R: round(phaseWise.R, 2),
        Y: round(phaseWise.Y, 2),
        B: round(phaseWise.B, 2),
      },
      stats: {
        peakDaily: round(peak, 2),
        lowestDaily: round(lowest, 2),
        averageDaily: round(avgDaily, 2),
      },
      comparisons: {
        todayVsYesterday: {
          today: round(todayTotal, 2),
          yesterday: round(yesterdayTotal, 2),
          changePercent: percentChange(todayTotal, yesterdayTotal),
        },
        weekVsLastWeek: {
          thisWeek: round(thisWeekTotal, 2),
          lastWeek: round(lastWeekTotal, 2),
          changePercent: percentChange(thisWeekTotal, lastWeekTotal),
        },
        monthVsLastMonth: {
          thisMonth: round(currentMonthTotal, 2),
          lastMonth: round(lastMonthTotal, 2),
          changePercent: percentChange(currentMonthTotal, lastMonthTotal),
        },
      },
      forecast,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
