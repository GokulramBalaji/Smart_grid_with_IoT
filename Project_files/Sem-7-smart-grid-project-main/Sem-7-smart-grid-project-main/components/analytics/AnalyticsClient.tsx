"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/Loading";
import { ComparisonCard } from "./ComparisonCard";
import { formatEnergy, formatDateTime } from "@/lib/utils";
import { PHASE_LABELS } from "@/types";

const PHASE_COLOR_HEX: Record<string, string> = { R: "#0071e3", Y: "#b76e00", B: "#6e56cf" };

interface AnalyticsData {
  device: { id: string; name: string } | null;
  hourly: { hour: number; energy: number }[];
  daily: { date: string; energy: number }[];
  weekly: { weekStart: string; energy: number }[];
  monthly: { month: string; energy: number }[];
  phaseWise: { R: number; Y: number; B: number };
  stats: { peakDaily: number; lowestDaily: number; averageDaily: number };
  comparisons: {
    todayVsYesterday: { today: number; yesterday: number; changePercent: number };
    weekVsLastWeek: { thisWeek: number; lastWeek: number; changePercent: number };
    monthVsLastMonth: { thisMonth: number; lastMonth: number; changePercent: number };
  };
  forecast: { tomorrow: number; nextWeekTotal: number; monthlyProjection: number };
}

export function AnalyticsClient({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics?deviceId=${deviceId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [deviceId]);

  if (loading || !data?.device) return <LoadingState label="Loading analytics..." />;

  const phasePieData = (Object.keys(data.phaseWise) as (keyof typeof data.phaseWise)[]).map((k) => ({
    name: PHASE_LABELS[k],
    value: data.phaseWise[k],
    key: k,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Energy Analytics</h1>
        <p className="mt-1 text-sm text-foreground-muted">Consumption trends, comparisons and forecasts for {data.device.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ComparisonCard
          title="Today vs Yesterday"
          currentLabel="Today"
          current={data.comparisons.todayVsYesterday.today}
          previousLabel="Yesterday"
          previous={data.comparisons.todayVsYesterday.yesterday}
          changePercent={data.comparisons.todayVsYesterday.changePercent}
        />
        <ComparisonCard
          title="This Week vs Last Week"
          currentLabel="This week"
          current={data.comparisons.weekVsLastWeek.thisWeek}
          previousLabel="Last week"
          previous={data.comparisons.weekVsLastWeek.lastWeek}
          changePercent={data.comparisons.weekVsLastWeek.changePercent}
        />
        <ComparisonCard
          title="This Month vs Last Month"
          currentLabel="This month"
          current={data.comparisons.monthVsLastMonth.thisMonth}
          previousLabel="Last month"
          previous={data.comparisons.monthVsLastMonth.lastMonth}
          changePercent={data.comparisons.monthVsLastMonth.changePercent}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Peak Daily Usage</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{formatEnergy(data.stats.peakDaily)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Lowest Daily Usage</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{formatEnergy(data.stats.lowestDaily)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Average Daily Usage</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{formatEnergy(data.stats.averageDaily)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Hourly Consumption — Today</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} formatter={(v) => `${v} kWh`} />
                <Bar dataKey="energy" name="Energy (kWh)" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Daily Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDateTime(d)}
                    tick={{ fontSize: 10, fill: "var(--foreground-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} formatter={(v) => `${v} kWh`} />
                  <Line type="monotone" dataKey="energy" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Phase-wise Energy Consumption</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-3">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={phasePieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {phasePieData.map((d) => (
                      <Cell key={d.key} fill={PHASE_COLOR_HEX[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatEnergy(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs text-foreground-muted">
              {phasePieData.map((d) => (
                <div key={d.key} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: PHASE_COLOR_HEX[d.key] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Monthly Consumption</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} formatter={(v) => `${v} kWh`} />
                <Bar dataKey="energy" name="Energy (kWh)" fill="var(--phase-b)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent-blue" />
            <CardTitle>Estimated Forecast</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <p className="mb-4 text-xs text-foreground-muted">
            Projected using a simple linear-trend model blended with the recent 7-day average. These are
            estimates, not measurements, and become more accurate as more history accumulates.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-foreground-muted">Tomorrow</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatEnergy(data.forecast.tomorrow)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-foreground-muted">Next 7 Days</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatEnergy(data.forecast.nextWeekTotal)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-foreground-muted">Monthly Projection</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatEnergy(data.forecast.monthlyProjection)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
