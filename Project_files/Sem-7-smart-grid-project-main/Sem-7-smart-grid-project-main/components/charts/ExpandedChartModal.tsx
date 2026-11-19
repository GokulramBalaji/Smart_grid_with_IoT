"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from "recharts";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/Loading";
import { RANGE_LABELS, type ChartRange, type GridDataPoint } from "@/lib/analytics/bucket";
import { formatDateTime, formatTime, formatNumber } from "@/lib/utils";
import { Activity, Gauge, Zap, Sparkles, CheckSquare, Square, Info } from "lucide-react";
import type { AIPredictionResult } from "@/types";

type MetricType = "voltage" | "power" | "current" | "ai_forecast";

interface ExpandedChartModalProps {
  open: boolean;
  onClose: () => void;
  points: GridDataPoint[];
  loading: boolean;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  aiData?: AIPredictionResult | null;
  initialMetric?: MetricType;
}

const RANGE_TABS = (Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => ({ value: r, label: r }));

export function ExpandedChartModal({
  open,
  onClose,
  points,
  loading,
  range,
  onRangeChange,
  aiData,
  initialMetric = "voltage",
}: ExpandedChartModalProps) {
  const [metric, setMetric] = useState<MetricType>(initialMetric);

  // Series visibility toggles
  const [showR, setShowR] = useState(true);
  const [showY, setShowY] = useState(true);
  const [showB, setShowB] = useState(true);
  const [showTotalOr3Phase, setShowTotalOr3Phase] = useState(true);

  const isLongRange = range === "7d" || range === "30d";

  // Compute live statistics for current view
  const stats = useMemo(() => {
    if (!points.length) return null;

    if (metric === "voltage") {
      const v3PhaseVals = points.map((p) => p.voltageThreePhase).filter((v) => v > 0);
      const vAvgVals = points.map((p) => p.voltageAvg).filter((v) => v > 0);
      const latest = points[points.length - 1];
      const maxV = Math.max(...(v3PhaseVals.length ? v3PhaseVals : [0]));
      const minV = Math.min(...(v3PhaseVals.length ? v3PhaseVals : [0]));
      const avgV = v3PhaseVals.reduce((a, b) => a + b, 0) / (v3PhaseVals.length || 1);

      return {
        current: latest?.voltageThreePhase ?? 0,
        currentUnit: "V (3-Phase)",
        secondaryLabel: "Phase Avg",
        secondaryValue: `${formatNumber(latest?.voltageAvg ?? 0, 1)} V`,
        max: `${formatNumber(maxV, 1)} V`,
        min: `${formatNumber(minV, 1)} V`,
        mean: `${formatNumber(avgV, 1)} V`,
      };
    }

    if (metric === "power") {
      const totalVals = points.map((p) => p.total);
      const latest = points[points.length - 1];
      const maxP = Math.max(...totalVals);
      const minP = Math.min(...totalVals);
      const avgP = totalVals.reduce((a, b) => a + b, 0) / (totalVals.length || 1);

      return {
        current: latest?.total ?? 0,
        currentUnit: "W (Total)",
        secondaryLabel: "Peak Phase",
        secondaryValue: `${formatNumber(Math.max(latest?.R ?? 0, latest?.Y ?? 0, latest?.B ?? 0), 0)} W`,
        max: `${formatNumber(maxP, 0)} W`,
        min: `${formatNumber(minP, 0)} W`,
        mean: `${formatNumber(avgP, 0)} W`,
      };
    }

    if (metric === "current") {
      const totalVals = points.map((p) => p.currentTotal);
      const latest = points[points.length - 1];
      const maxI = Math.max(...totalVals);
      const minI = Math.min(...totalVals);
      const avgI = totalVals.reduce((a, b) => a + b, 0) / (totalVals.length || 1);

      return {
        current: latest?.currentTotal ?? 0,
        currentUnit: "A (Total)",
        secondaryLabel: "Max Phase",
        secondaryValue: `${formatNumber(Math.max(latest?.currentR ?? 0, latest?.currentY ?? 0, latest?.currentB ?? 0), 2)} A`,
        max: `${formatNumber(maxI, 2)} A`,
        min: `${formatNumber(minI, 2)} A`,
        mean: `${formatNumber(avgI, 2)} A`,
      };
    }

    return null;
  }, [points, metric]);

  const latestPoint = points[points.length - 1];
  const rV = latestPoint?.voltageR ?? 0;
  const yV = latestPoint?.voltageY ?? 0;
  const bV = latestPoint?.voltageB ?? 0;
  const eq3V = latestPoint?.voltageThreePhase ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-h-[92vh] w-[95vw] max-w-6xl overflow-y-auto p-6"
    >
      <div className="space-y-5">
        {/* Header & Metric Picker */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                <Gauge className="size-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                High-Definition Grid Visualizer
              </h2>
            </div>
            <p className="mt-1 text-xs text-foreground-muted">
              Interactive three-phase electrical telemetry, mathematical synthesis, and AI trajectory
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Mode Buttons */}
            <div className="flex rounded-xl border border-border-subtle bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setMetric("voltage")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  metric === "voltage"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Gauge className="size-3.5" />
                3-Phase Voltages
              </button>
              <button
                type="button"
                onClick={() => setMetric("power")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  metric === "power"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Zap className="size-3.5" />
                Active Power
              </button>
              <button
                type="button"
                onClick={() => setMetric("current")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  metric === "current"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Activity className="size-3.5" />
                Current
              </button>
              <button
                type="button"
                onClick={() => setMetric("ai_forecast")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  metric === "ai_forecast"
                    ? "bg-accent-blue text-white shadow-sm"
                    : "text-accent-blue hover:bg-accent-blue/10"
                }`}
              >
                <Sparkles className="size-3.5" />
                AI Prediction
              </button>
            </div>

            {/* Time Range Selector */}
            {metric !== "ai_forecast" && (
              <Tabs tabs={RANGE_TABS} value={range} onChange={(v) => onRangeChange(v as ChartRange)} />
            )}
          </div>
        </div>

        {/* Mathematical Formula Callout for 3-Phase Voltage */}
        {metric === "voltage" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-xs text-foreground">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-accent-blue" />
              <div>
                <span className="font-semibold text-accent-blue">3-Phase Line Voltage Synthesis Formula: </span>
                <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                  V_3phi = (rV + yV + bV) / sqrt(3)
                </code>
              </div>
            </div>
            <div className="flex items-center gap-2 text-foreground-muted">
              <span>Live Evaluation:</span>
              <span className="font-medium text-foreground">
                ({formatNumber(rV, 1)} + {formatNumber(yV, 1)} + {formatNumber(bV, 1)}) / 1.732 ={" "}
                <span className="font-bold text-accent-green">{formatNumber(eq3V, 1)} V</span>
              </span>
            </div>
          </div>
        )}

        {/* Stats Row */}
        {stats && metric !== "ai_forecast" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="text-[11px] text-foreground-muted">Current Value</p>
              <p className="mt-0.5 text-lg font-bold text-foreground">
                {formatNumber(stats.current, 1)}{" "}
                <span className="text-xs font-normal text-foreground-muted">{stats.currentUnit}</span>
              </p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="text-[11px] text-foreground-muted">{stats.secondaryLabel}</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{stats.secondaryValue}</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="text-[11px] text-foreground-muted">Peak</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{stats.max}</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="text-[11px] text-foreground-muted">Minimum</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{stats.min}</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <p className="text-[11px] text-foreground-muted">Average / Mean</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{stats.mean}</p>
            </div>
          </div>
        )}

        {/* Series Filter Checkboxes */}
        {metric !== "ai_forecast" && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-foreground-muted">Filter Traces:</span>
            <button
              type="button"
              onClick={() => setShowR(!showR)}
              className="flex items-center gap-1.5 text-foreground hover:opacity-80"
            >
              {showR ? <CheckSquare className="size-4 text-phase-r" /> : <Square className="size-4" />}
              <span className="size-2 rounded-full bg-phase-r" /> Phase R
            </button>
            <button
              type="button"
              onClick={() => setShowY(!showY)}
              className="flex items-center gap-1.5 text-foreground hover:opacity-80"
            >
              {showY ? <CheckSquare className="size-4 text-phase-y" /> : <Square className="size-4" />}
              <span className="size-2 rounded-full bg-phase-y" /> Phase Y
            </button>
            <button
              type="button"
              onClick={() => setShowB(!showB)}
              className="flex items-center gap-1.5 text-foreground hover:opacity-80"
            >
              {showB ? <CheckSquare className="size-4 text-phase-b" /> : <Square className="size-4" />}
              <span className="size-2 rounded-full bg-phase-b" /> Phase B
            </button>
            <button
              type="button"
              onClick={() => setShowTotalOr3Phase(!showTotalOr3Phase)}
              className="flex items-center gap-1.5 font-medium text-foreground hover:opacity-80"
            >
              {showTotalOr3Phase ? (
                <CheckSquare className="size-4 text-accent-green" />
              ) : (
                <Square className="size-4" />
              )}
              <span className="size-2 rounded-full bg-accent-green" />{" "}
              {metric === "voltage" ? "3-Phase Line V (Synthesized)" : "Total Composite"}
            </button>
          </div>
        )}

        {/* Main Chart Area */}
        <div className="h-[460px] w-full rounded-2xl border border-border-subtle bg-surface p-4">
          {loading ? (
            <LoadingState label="Loading high-resolution grid telemetry..." />
          ) : metric === "ai_forecast" ? (
            /* AI Forecast View */
            aiData?.forecast && aiData.forecast.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={aiData.forecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => formatTime(v)}
                    tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                    axisLine={{ stroke: "var(--border-subtle)" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    unit=" V"
                    width={58}
                  />
                  <Tooltip
                    labelFormatter={(v) => formatDateTime(v as string)}
                    formatter={(v: any, name: any) => [`${formatNumber(Number(v), 1)} V`, name]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border-subtle)",
                      background: "var(--surface)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    name="95% Confidence Envelope"
                    stroke="transparent"
                    fill="var(--accent-blue)"
                    fillOpacity={0.12}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    name="Lower Bound"
                    stroke="transparent"
                    fill="var(--accent-blue)"
                    fillOpacity={0.06}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedVoltage"
                    name="AI Predicted 3-Phase V"
                    stroke="var(--accent-blue)"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "var(--accent-blue)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualVoltage"
                    name="Measured 3-Phase V"
                    stroke="var(--accent-green)"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "var(--accent-green)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
                No AI forecast telemetry available for this device.
              </div>
            )
          ) : points.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
              No readings in this time range.
            </div>
          ) : (
            /* Multi-Metric High-Res Chart */
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                  width={56}
                  unit={metric === "voltage" ? " V" : metric === "power" ? " W" : " A"}
                />
                <Tooltip
                  labelFormatter={(v) => formatDateTime(v as string)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />

                {metric === "voltage" && (
                  <>
                    {showTotalOr3Phase && (
                      <Line
                        type="monotone"
                        dataKey="voltageThreePhase"
                        name="3-Phase Line V (rV+yV+bV)/√3"
                        stroke="var(--accent-green)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    )}
                    {showR && (
                      <Line
                        type="monotone"
                        dataKey="voltageR"
                        name="Phase R Voltage (V)"
                        stroke="var(--phase-r)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                    {showY && (
                      <Line
                        type="monotone"
                        dataKey="voltageY"
                        name="Phase Y Voltage (V)"
                        stroke="var(--phase-y)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                    {showB && (
                      <Line
                        type="monotone"
                        dataKey="voltageB"
                        name="Phase B Voltage (V)"
                        stroke="var(--phase-b)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                  </>
                )}

                {metric === "power" && (
                  <>
                    {showTotalOr3Phase && (
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Active Power (W)"
                        stroke="var(--foreground)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    )}
                    {showR && (
                      <Line
                        type="monotone"
                        dataKey="R"
                        name="Phase R Power (W)"
                        stroke="var(--phase-r)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                    {showY && (
                      <Line
                        type="monotone"
                        dataKey="Y"
                        name="Phase Y Power (W)"
                        stroke="var(--phase-y)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                    {showB && (
                      <Line
                        type="monotone"
                        dataKey="B"
                        name="Phase B Power (W)"
                        stroke="var(--phase-b)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                  </>
                )}

                {metric === "current" && (
                  <>
                    {showTotalOr3Phase && (
                      <Line
                        type="monotone"
                        dataKey="currentTotal"
                        name="Total Current (A)"
                        stroke="var(--foreground)"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    )}
                    {showR && (
                      <Line
                        type="monotone"
                        dataKey="currentR"
                        name="Phase R Current (A)"
                        stroke="var(--phase-r)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                    {showY && (
                      <Line
                        type="monotone"
                        dataKey="currentY"
                        name="Phase Y Current (A)"
                        stroke="var(--phase-y)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                    {showB && (
                      <Line
                        type="monotone"
                        dataKey="currentB"
                        name="Phase B Current (A)"
                        stroke="var(--phase-b)"
                        strokeWidth={1.8}
                        dot={false}
                      />
                    )}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Modal>
  );
}
