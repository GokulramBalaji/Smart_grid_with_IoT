"use client";

import { useEffect, useState } from "react";
import { Zap, Gauge, Activity, BatteryCharging } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/charts/Sparkline";
import { formatNumber, formatPower, formatEnergy } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

interface SparkData {
  voltage: number[];
  current: number[];
  power: number[];
  energy: number[];
}

function trend(series: number[]): number {
  if (series.length < 2) return 0;
  const first = series[0] || 0.0001;
  const last = series[series.length - 1];
  return Math.round(((last - first) / first) * 1000) / 10;
}

export function SummaryCards({ summary, deviceId }: { summary: DashboardSummary; deviceId: string }) {
  const [spark, setSpark] = useState<SparkData>({ voltage: [], current: [], power: [], energy: [] });

  useEffect(() => {
    fetch(`/api/readings/sparklines?deviceId=${deviceId}`)
      .then((r) => r.json())
      .then(setSpark)
      .catch(() => {});
  }, [deviceId, summary.timestamp]);

  const cards = [
    {
      label: "Total Voltage",
      value: formatNumber(summary.totals.avgVoltage, 1),
      unit: "V (avg)",
      icon: Gauge,
      color: "var(--accent-blue)",
      data: spark.voltage,
      tone: "text-accent-blue bg-accent-blue-soft",
    },
    {
      label: "Total Current",
      value: formatNumber(summary.totals.totalCurrent, 2),
      unit: "A",
      icon: Activity,
      color: "var(--accent-green)",
      data: spark.current,
      tone: "text-accent-green bg-accent-green-soft",
    },
    {
      label: "Total Active Power",
      value: formatPower(summary.totals.totalActivePower).split(" ")[0],
      unit: formatPower(summary.totals.totalActivePower).split(" ")[1],
      icon: Zap,
      color: "var(--accent-amber)",
      data: spark.power,
      tone: "text-accent-amber bg-accent-amber-soft",
    },
    {
      label: "Total Energy Today",
      value: formatEnergy(summary.totals.totalEnergyToday).split(" ")[0],
      unit: formatEnergy(summary.totals.totalEnergyToday).split(" ")[1],
      icon: BatteryCharging,
      color: "var(--phase-b)",
      data: spark.energy,
      tone: "text-[#6e56cf] bg-[#6e56cf]/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const t = trend(c.data);
        return (
          <Card key={c.label} hover className="p-5">
            <div className="flex items-start justify-between">
              <div className={`flex size-9 items-center justify-center rounded-xl ${c.tone}`}>
                <c.icon className="size-[18px]" />
              </div>
              {c.data.length > 1 && <Sparkline id={c.label} data={c.data} color={c.color} />}
            </div>
            <p className="mt-3 text-xs font-medium text-foreground-muted">{c.label}</p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-foreground">{c.value}</span>
              <span className="text-sm text-foreground-muted">{c.unit}</span>
            </div>
            {c.data.length > 1 && (
              <p className={`mt-1 text-xs font-medium ${t >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {t >= 0 ? "+" : ""}
                {t}% recent trend
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
