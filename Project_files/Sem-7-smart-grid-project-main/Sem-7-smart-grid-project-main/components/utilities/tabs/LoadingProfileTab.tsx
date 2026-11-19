"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cpu } from "lucide-react";
import { RANGE_LABELS, type ChartRange } from "@/lib/analytics/bucket";
import { formatDateTime, formatTime } from "@/lib/utils";

const RANGE_TABS = (Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => ({ value: r, label: r }));

interface LoadingProfileData {
  device: { id: string; name: string } | null;
  loadCurve: { timestamp: string; R: number; Y: number; B: number; total: number }[];
  durationCurve: { percentOfTime: number; power: number }[];
  demandStats: {
    peakKva: number;
    peakAt: string | null;
    averageKva: number;
    loadFactor: number;
    contractDemandKva: number | null;
    utilizationPercent: number | null;
    exceededContract: boolean;
  };
}

export function LoadingProfileTab({ nodeId, hasDevice }: { nodeId: string; hasDevice: boolean }) {
  const [range, setRange] = useState<ChartRange>("24h");
  const [data, setData] = useState<LoadingProfileData | null>(null);
  const [loading, setLoading] = useState(hasDevice);

  useEffect(() => {
    if (!hasDevice) return;
    fetch(`/api/utility-nodes/${nodeId}/loading-profile?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [nodeId, range, hasDevice]);

  if (!hasDevice) {
    return <EmptyState icon={Cpu} title="No device attached" description="Attach a device to see its loading profile." />;
  }
  if (loading || !data) return <LoadingState label="Loading profile..." />;

  const isLongRange = range === "7d" || range === "30d";
  const demand = data.demandStats;
  const imbalanceTone = demand.exceededContract ? "red" : (demand.utilizationPercent ?? 0) > 90 ? "amber" : "green";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Peak Demand</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{demand.peakKva} kVA</p>
          {demand.peakAt && <p className="mt-0.5 text-xs text-foreground-muted">{formatDateTime(demand.peakAt)}</p>}
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Average Demand</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{demand.averageKva} kVA</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Load Factor</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{(demand.loadFactor * 100).toFixed(0)}%</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground-muted">Contract Utilization</p>
            {demand.contractDemandKva && <Badge tone={imbalanceTone}>{demand.exceededContract ? "exceeded" : "ok"}</Badge>}
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {demand.utilizationPercent !== null ? `${demand.utilizationPercent}%` : "No contract set"}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-wrap gap-3 pb-4">
          <div>
            <CardTitle>Load Curve</CardTitle>
            <p className="mt-1 text-sm text-foreground-muted">Total and per-phase active power over time</p>
          </div>
          <Tabs tabs={RANGE_TABS} value={range} onChange={(v) => setRange(v as ChartRange)} />
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.loadCurve} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => (isLongRange ? formatDateTime(v) : formatTime(v))}
                  tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                  minTickGap={40}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip labelFormatter={(v) => formatDateTime(v as string)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" name="Total" stroke="var(--foreground)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="R" name="Phase R" stroke="var(--phase-r)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Y" name="Phase Y" stroke="var(--phase-y)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="B" name="Phase B" stroke="var(--phase-b)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Load Duration Curve</CardTitle>
          <p className="mt-1 text-sm text-foreground-muted">
            Power level equalled or exceeded for what % of the selected period — a flatter curve means steadier load
          </p>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.durationCurve}>
                <defs>
                  <linearGradient id="durationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="percentOfTime"
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "% of time", position: "insideBottom", offset: -5, fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => `${v} W`} labelFormatter={(v) => `${v}% of time`} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                <Area type="monotone" dataKey="power" stroke="var(--accent-blue)" strokeWidth={2} fill="url(#durationFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
