"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Cpu, Lightbulb, AlertTriangle, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";

interface EfficiencyData {
  device: { id: string; name: string } | null;
  trend: { date: string; avgPowerFactor: number; voltageImbalance: number; currentImbalance: number; efficiencyScore: number }[];
  demandStats: { peakKva: number; averageKva: number; loadFactor: number };
  recommendations: { title: string; detail: string; severity: "info" | "suggestion" | "action" }[];
}

const SEVERITY_CONFIG = {
  action: { icon: AlertTriangle, tone: "border-accent-red/30 bg-accent-red-soft", iconTone: "text-accent-red" },
  suggestion: { icon: Lightbulb, tone: "border-accent-amber/30 bg-accent-amber-soft", iconTone: "text-accent-amber" },
  info: { icon: Info, tone: "border-accent-blue/30 bg-accent-blue-soft", iconTone: "text-accent-blue" },
};

export function EfficiencyTab({ nodeId, hasDevice }: { nodeId: string; hasDevice: boolean }) {
  const [data, setData] = useState<EfficiencyData | null>(null);
  const [loading, setLoading] = useState(hasDevice);

  useEffect(() => {
    if (!hasDevice) return;
    fetch(`/api/utility-nodes/${nodeId}/efficiency`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [nodeId, hasDevice]);

  if (!hasDevice) {
    return <EmptyState icon={Cpu} title="No device attached" description="Attach a device to see efficiency analysis." />;
  }
  if (loading || !data) return <LoadingState label="Analyzing efficiency..." />;

  const latestScore = data.trend.length ? data.trend[data.trend.length - 1].efficiencyScore : 0;
  const chartData = data.trend.map((d) => ({ ...d, avgPowerFactor: Math.round(d.avgPowerFactor * 100) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Efficiency Score</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{latestScore.toFixed(0)}/100</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Load Factor</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{(data.demandStats.loadFactor * 100).toFixed(0)}%</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Peak Demand</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{data.demandStats.peakKva} kVA</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-foreground-muted">Average Demand</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{data.demandStats.averageKva} kVA</p>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Operating Efficiency Trend</CardTitle>
          <p className="mt-1 text-sm text-foreground-muted">
            Composite score (60% power factor, 40% phase balance) alongside its underlying components, over the raw-data retention window
          </p>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => formatDateTime(v)} tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} minTickGap={30} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip labelFormatter={(v) => formatDateTime(v as string)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="efficiencyScore" name="Efficiency Score" stroke="var(--foreground)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avgPowerFactor" name="Avg Power Factor (×100)" stroke="var(--accent-blue)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="currentImbalance" name="Current Imbalance %" stroke="var(--accent-amber)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Demand Reduction & Efficiency Recommendations</h3>
        <div className="space-y-3">
          {data.recommendations.map((rec, i) => {
            const config = SEVERITY_CONFIG[rec.severity];
            const Icon = config.icon;
            return (
              <div key={i} className={`rounded-2xl border p-4 ${config.tone}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${config.iconTone}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{rec.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
