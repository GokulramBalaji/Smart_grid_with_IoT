"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/Loading";
import { RANGE_LABELS, type ChartRange, type GridDataPoint } from "@/lib/analytics/bucket";
import { formatDateTime, formatTime, formatNumber } from "@/lib/utils";
import { Maximize2, Zap, Gauge, Info } from "lucide-react";
import { ExpandedChartModal } from "@/components/charts/ExpandedChartModal";
import type { AIPredictionResult } from "@/types";

const RANGE_TABS = (Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => ({ value: r, label: r }));

export function PowerChart({
  deviceId,
  aiData,
}: {
  deviceId: string;
  aiData?: AIPredictionResult | null;
}) {
  const [range, setRange] = useState<ChartRange>("24h");
  const [metric, setMetric] = useState<"power" | "voltage">("power");
  const [points, setPoints] = useState<GridDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/readings/history?deviceId=${deviceId}&range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setPoints(data.points ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [deviceId, range]);

  const isLongRange = range === "7d" || range === "30d";
  const latestPoint = points[points.length - 1];

  return (
    <>
      <Card>
        <CardHeader className="flex-wrap gap-3 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Real-Time Electrical Telemetry</CardTitle>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface hover:text-accent-blue transition-colors"
                title="View graph in large fullscreen mode"
              >
                <Maximize2 className="size-3.5" />
                <span>View Large</span>
              </button>
            </div>
            <p className="mt-1 text-sm text-foreground-muted">
              {metric === "power"
                ? "Total and per-phase active power over time"
                : "3-Phase Line Voltage [(rV+yV+bV)/√3] and individual phase voltages over time"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle between Active Power and 3-Phase Voltages */}
            <div className="flex rounded-xl border border-border-subtle bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setMetric("power")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  metric === "power"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Zap className="size-3" />
                Power (W)
              </button>
              <button
                type="button"
                onClick={() => setMetric("voltage")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  metric === "voltage"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Gauge className="size-3" />
                3-Phase Voltages (V)
              </button>
            </div>

            <Tabs tabs={RANGE_TABS} value={range} onChange={(v) => setRange(v as ChartRange)} />
          </div>
        </CardHeader>

        {metric === "voltage" && latestPoint && (
          <div className="mx-6 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted px-3.5 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-accent-blue font-medium">
              <Info className="size-3.5" />
              <span>Formula: V_3phi = (rV + yV + bV) / √3</span>
            </div>
            <div className="text-foreground-muted">
              Live: ({formatNumber(latestPoint.voltageR, 1)} + {formatNumber(latestPoint.voltageY, 1)} +{" "}
              {formatNumber(latestPoint.voltageB, 1)}) / 1.732 ={" "}
              <span className="font-bold text-accent-green">
                {formatNumber(latestPoint.voltageThreePhase, 1)} V
              </span>
            </div>
          </div>
        )}

        <CardContent>
          {loading ? (
            <LoadingState label="Loading chart data..." />
          ) : points.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-foreground-muted">
              No readings in this range yet.
            </div>
          ) : (
            <div
              className="group relative h-72 w-full cursor-pointer"
              onClick={() => setExpanded(true)}
              title="Click chart to open in large view"
            >
              {/* Hover overlay hint */}
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all group-hover:bg-black/5 group-hover:opacity-100">
                <span className="rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-sm">
                  🔍 Click to view in large mode
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => (isLongRange ? formatDateTime(v) : formatTime(v))}
                    tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                    minTickGap={40}
                    axisLine={{ stroke: "var(--border-subtle)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    unit={metric === "voltage" ? " V" : " W"}
                  />
                  <Tooltip
                    labelFormatter={(v) => formatDateTime(v as string)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border-subtle)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />

                  {metric === "power" ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Power"
                        stroke="var(--foreground)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="R"
                        name="Phase R"
                        stroke="var(--phase-r)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Y"
                        name="Phase Y"
                        stroke="var(--phase-y)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="B"
                        name="Phase B"
                        stroke="var(--phase-b)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </>
                  ) : (
                    <>
                      <Line
                        type="monotone"
                        dataKey="voltageThreePhase"
                        name="3-Phase Line V [(rV+yV+bV)/√3]"
                        stroke="var(--accent-green)"
                        strokeWidth={2.2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="voltageR"
                        name="Phase R (V)"
                        stroke="var(--phase-r)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="voltageY"
                        name="Phase Y (V)"
                        stroke="var(--phase-y)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="voltageB"
                        name="Phase B (V)"
                        stroke="var(--phase-b)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen / Large Modal */}
      {expanded && (
        <ExpandedChartModal
          open={expanded}
          onClose={() => setExpanded(false)}
          points={points}
          loading={loading}
          range={range}
          onRangeChange={setRange}
          aiData={aiData}
          initialMetric={metric}
        />
      )}
    </>
  );
}
