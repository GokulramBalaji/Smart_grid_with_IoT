"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Cpu } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { RANGE_LABELS, type ChartRange } from "@/lib/analytics/bucket";
import { formatDateTime, formatTime } from "@/lib/utils";
import { PHASE_LABELS, PHASE_KEYS, type PhaseKey } from "@/types";

const RANGE_TABS = (Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => ({ value: r, label: r }));
const PHASE_COLOR_HEX: Record<PhaseKey, string> = { R: "#0071e3", Y: "#b76e00", B: "#6e56cf" };

interface Series {
  timestamp: string;
  voltage: number;
  current: number;
  frequency: number;
}

interface PhaseStats {
  minVoltage: number;
  maxVoltage: number;
  avgVoltage: number;
  overVoltageEvents: number;
  underVoltageEvents: number;
  minCurrent: number;
  maxCurrent: number;
  avgCurrent: number;
  overCurrentEvents: number;
  minFrequency: number;
  maxFrequency: number;
  maxFrequencyDeviation: number;
  frequencyOutOfBandEvents: number;
}

interface PowerQualityData {
  device: { id: string; name: string } | null;
  thresholds: { maxVoltage: number; minVoltage: number; maxCurrent: number; nominalFrequency: number };
  series: Record<PhaseKey, Series[]>;
  stats: Record<PhaseKey, PhaseStats>;
}

function mergeSeries(series: Record<PhaseKey, Series[]>, key: keyof Series) {
  const byTimestamp = new Map<string, Record<string, number | string>>();
  for (const phase of PHASE_KEYS) {
    for (const point of series[phase]) {
      if (!byTimestamp.has(point.timestamp)) byTimestamp.set(point.timestamp, { timestamp: point.timestamp });
      byTimestamp.get(point.timestamp)![phase] = point[key] as number;
    }
  }
  return Array.from(byTimestamp.values()).sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
}

export function PowerQualityTab({ nodeId, hasDevice }: { nodeId: string; hasDevice: boolean }) {
  const [range, setRange] = useState<ChartRange>("24h");
  const [data, setData] = useState<PowerQualityData | null>(null);
  const [loading, setLoading] = useState(hasDevice);

  useEffect(() => {
    if (!hasDevice) return;
    fetch(`/api/utility-nodes/${nodeId}/power-quality?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [nodeId, range, hasDevice]);

  if (!hasDevice) {
    return <EmptyState icon={Cpu} title="No device attached" description="Attach a device to see power quality stats." />;
  }
  if (loading || !data) return <LoadingState label="Loading power quality data..." />;

  const isLongRange = range === "7d" || range === "30d";
  const tickFormatter = (v: string) => (isLongRange ? formatDateTime(v) : formatTime(v));

  const voltageSeries = mergeSeries(data.series, "voltage");
  const currentSeries = mergeSeries(data.series, "current");
  const frequencySeries = mergeSeries(data.series, "frequency");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Tabs tabs={RANGE_TABS} value={range} onChange={(v) => setRange(v as ChartRange)} />
      </div>

      {/* Voltage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Voltage — Over / Under Voltage Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {PHASE_KEYS.map((k) => (
              <div key={k} className="rounded-xl border border-border-subtle p-3 text-center">
                <p className="text-[11px] text-foreground-muted">{PHASE_LABELS[k]} range</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {data.stats[k].minVoltage}–{data.stats[k].maxVoltage} V
                </p>
              </div>
            ))}
            <div className="rounded-xl border border-accent-red/30 bg-accent-red-soft p-3 text-center">
              <p className="text-[11px] text-accent-red">Over-voltage events</p>
              <p className="mt-0.5 text-sm font-semibold text-accent-red">
                {PHASE_KEYS.reduce((s, k) => s + data.stats[k].overVoltageEvents, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-accent-amber/30 bg-accent-amber-soft p-3 text-center">
              <p className="text-[11px] text-accent-amber">Under-voltage events</p>
              <p className="mt-0.5 text-sm font-semibold text-accent-amber">
                {PHASE_KEYS.reduce((s, k) => s + data.stats[k].underVoltageEvents, 0)}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={voltageSeries} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={tickFormatter} tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} domain={["auto", "auto"]} />
                <Tooltip labelFormatter={(v) => formatDateTime(v as string)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={data.thresholds.maxVoltage} stroke="var(--accent-red)" strokeDasharray="4 4" label={{ value: "Max", fontSize: 10, fill: "var(--accent-red)" }} />
                <ReferenceLine y={data.thresholds.minVoltage} stroke="var(--accent-amber)" strokeDasharray="4 4" label={{ value: "Min", fontSize: 10, fill: "var(--accent-amber)" }} />
                {PHASE_KEYS.map((k) => (
                  <Line key={k} type="monotone" dataKey={k} name={PHASE_LABELS[k]} stroke={PHASE_COLOR_HEX[k]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Current */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Current — Over / Under Current Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {PHASE_KEYS.map((k) => (
              <div key={k} className="rounded-xl border border-border-subtle p-3 text-center">
                <p className="text-[11px] text-foreground-muted">{PHASE_LABELS[k]} range</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {data.stats[k].minCurrent}–{data.stats[k].maxCurrent} A
                </p>
              </div>
            ))}
            <div className="rounded-xl border border-accent-red/30 bg-accent-red-soft p-3 text-center">
              <p className="text-[11px] text-accent-red">Overcurrent events</p>
              <p className="mt-0.5 text-sm font-semibold text-accent-red">
                {PHASE_KEYS.reduce((s, k) => s + data.stats[k].overCurrentEvents, 0)}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentSeries} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={tickFormatter} tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip labelFormatter={(v) => formatDateTime(v as string)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={data.thresholds.maxCurrent} stroke="var(--accent-red)" strokeDasharray="4 4" label={{ value: "Max", fontSize: 10, fill: "var(--accent-red)" }} />
                {PHASE_KEYS.map((k) => (
                  <Line key={k} type="monotone" dataKey={k} name={PHASE_LABELS[k]} stroke={PHASE_COLOR_HEX[k]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Frequency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Frequency Deviation</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {PHASE_KEYS.map((k) => (
              <div key={k} className="rounded-xl border border-border-subtle p-3 text-center">
                <p className="text-[11px] text-foreground-muted">{PHASE_LABELS[k]} max deviation</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">±{data.stats[k].maxFrequencyDeviation} Hz</p>
              </div>
            ))}
            <div className="rounded-xl border border-accent-red/30 bg-accent-red-soft p-3 text-center">
              <p className="text-[11px] text-accent-red">Out-of-band events</p>
              <p className="mt-0.5 text-sm font-semibold text-accent-red">
                {PHASE_KEYS.reduce((s, k) => s + data.stats[k].frequencyOutOfBandEvents, 0)}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={frequencySeries} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={tickFormatter} tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} domain={["auto", "auto"]} />
                <Tooltip labelFormatter={(v) => formatDateTime(v as string)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={data.thresholds.nominalFrequency} stroke="var(--foreground-muted)" strokeDasharray="4 4" label={{ value: "Nominal", fontSize: 10 }} />
                {PHASE_KEYS.map((k) => (
                  <Line key={k} type="monotone" dataKey={k} name={PHASE_LABELS[k]} stroke={PHASE_COLOR_HEX[k]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
