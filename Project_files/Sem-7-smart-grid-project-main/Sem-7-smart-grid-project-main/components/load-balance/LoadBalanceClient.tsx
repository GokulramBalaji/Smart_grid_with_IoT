"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDashboardStream } from "@/hooks/useDashboardStream";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/Loading";
import { PHASE_KEYS, PHASE_LABELS } from "@/types";
import { mostAndLeastLoadedPhase, loadDistributionPercent } from "@/lib/calculations/electrical";
import { buildLoadBalanceInsight } from "@/lib/calculations/load-balance-messages";
import { formatNumber } from "@/lib/utils";

const PHASE_COLOR_HEX: Record<string, string> = { R: "#0071e3", Y: "#b76e00", B: "#6e56cf" };
const IMBALANCE_TONE = { normal: "green", warning: "amber", critical: "red" } as const;

export function LoadBalanceClient({ deviceId }: { deviceId: string }) {
  const { summary, loading } = useDashboardStream(deviceId);

  if (loading || !summary?.device) {
    return <LoadingState label="Loading load balance data..." />;
  }

  const power = {
    R: summary.phases.R.activePower,
    Y: summary.phases.Y.activePower,
    B: summary.phases.B.activePower,
  };
  const current = {
    R: summary.phases.R.current,
    Y: summary.phases.Y.current,
    B: summary.phases.B.current,
  };

  const { most, least } = mostAndLeastLoadedPhase(power);
  const distribution = loadDistributionPercent(power);
  const insight = buildLoadBalanceInsight(power, most);

  const barData = PHASE_KEYS.map((k) => ({ phase: PHASE_LABELS[k], power: power[k], current: current[k] }));
  const pieData = PHASE_KEYS.map((k) => ({ name: PHASE_LABELS[k], value: distribution[k], key: k }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Load Balance</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Per-phase load distribution and imbalance across {summary.device.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Most Loaded Phase</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{PHASE_LABELS[most]}</p>
          <p className="mt-1 text-xs text-foreground-muted">{formatNumber(power[most], 0)} W</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Least Loaded Phase</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{PHASE_LABELS[least]}</p>
          <p className="mt-1 text-xs text-foreground-muted">{formatNumber(power[least], 0)} W</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground-muted">Load Imbalance</p>
            <Badge tone={IMBALANCE_TONE[summary.current.status]}>{summary.current.status}</Badge>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.current.imbalancePercent}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${
                summary.current.status === "critical"
                  ? "bg-accent-red"
                  : summary.current.status === "warning"
                    ? "bg-accent-amber"
                    : "bg-accent-green"
              }`}
              style={{ width: `${Math.min(100, summary.current.imbalancePercent * 4)}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface p-5 card-shadow">
        <p className="text-sm leading-relaxed text-foreground">{insight.message}</p>
        {insight.recommendation && (
          <p className="mt-2 rounded-xl bg-accent-blue-soft px-3 py-2.5 text-sm text-accent-blue">
            {insight.recommendation}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Power Consumption per Phase</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="phase" tick={{ fontSize: 12, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                  <Bar dataKey="power" name="Power (W)" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={PHASE_COLOR_HEX[PHASE_KEYS[i]]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Load Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center pt-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={PHASE_COLOR_HEX[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${v}%`}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <div className="flex justify-center gap-4 pb-5">
            {pieData.map((d) => (
              <div key={d.key} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span className="size-2 rounded-full" style={{ background: PHASE_COLOR_HEX[d.key] }} />
                {d.name}: {d.value}%
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Current per Phase</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="phase" tick={{ fontSize: 12, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                <Bar dataKey="current" name="Current (A)" radius={[0, 8, 8, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={PHASE_COLOR_HEX[PHASE_KEYS[i]]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
